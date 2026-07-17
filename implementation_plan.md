# Plan de implementación — WinTTS 1.0.1

## Objetivo

Convertir WinTTS de un lector básico en una herramienta de escritorio práctica para preparar, escuchar y exportar narraciones locales, manteniendo la privacidad offline y una interfaz simple.

## Diagnóstico actual

### Base técnica

- WPF sobre .NET 10 con `System.Speech.Synthesis`.
- La aplicación compila actualmente con 0 errores y 0 advertencias después de regenerar los metadatos de restauración de NuGet.
- La lógica, el preprocesamiento y la UI están concentrados en tres archivos. Es suficiente para la versión actual, pero mezclar más controles en el code-behind volvería frágil el mantenimiento.
- No existen pruebas automatizadas.

### Bugs y deuda detectados

1. La plantilla común de botones no propaga `BorderBrush` ni `BorderThickness`. El botón **Detener** configura un borde rojo que nunca se dibuja y queda como texto rojo aislado.
2. El limpiador Markdown procesa enlaces antes que imágenes; `![alt](url)` puede convertirse en `!alt` y terminar leído.
3. Las expresiones regulares de cursiva pueden alterar guiones bajos válidos y el limpiador no cubre bien citas, reglas horizontales, escapes, tablas ni Markdown anidado.
4. Cambiar la voz mientras se reproduce cancela y reinicia todo desde el principio; no es un hot-swap real ni se comunica al usuario.
5. Los errores al seleccionar una voz se silencian por completo.
6. La UI no escucha `StateChanged`, `SpeakStarted`, `SpeakProgress` ni `SpeakCompleted`; por ello los botones nunca reflejan el estado real y no hay estado, progreso o error visible.
7. Los glifos de minimizar, maximizar y cerrar usan caracteres tipográficos distintos en vez de geometría de iconos consistente. El icono de maximizar tampoco cambia al restaurar.
8. El `ComboBox`, el `Slider`, el scrollbar y los estados de foco/disabled conservan estilos del sistema o contrastes inconsistentes. Blanco sobre turquesa en una opción seleccionada tiene poco contraste.
9. La barra de título personalizada no contempla doble clic para maximizar/restaurar, iconos accesibles, navegación por teclado ni un comportamiento de redimensionado suficientemente claro.
10. No hay tratamiento para “sin voces instaladas”, texto vacío después del preprocesamiento, exportaciones fallidas ni cierre durante una operación.
11. Dos certificados `.pfx` están versionados. Deben considerarse comprometidos, retirarse del repositorio e historial y rotarse antes de una nueva publicación. Esta acción requiere coordinación porque puede invalidar el flujo de firma existente.
12. El README enlaza `docs/publicar.md`, archivo que no existe; la guía real parece ser `docs/PUBLISHING.md`.

## Arquitectura propuesta

Mantener WPF y `System.Speech`, pero separar responsabilidades sin introducir un framework pesado:

```text
WinTTS/
├─ Models/
│  ├─ PlaybackState.cs
│  ├─ SpeechSettings.cs
│  └─ ExportRequest.cs
├─ Services/
│  ├─ SpeechService.cs
│  ├─ AudioExportService.cs
│  ├─ TextPreprocessor.cs
│  └─ SettingsService.cs
├─ ViewModels/
│  └─ MainViewModel.cs
├─ Controls/
│  └─ NarrationEditor.xaml
├─ Themes/
│  ├─ Colors.xaml
│  └─ Controls.xaml
└─ MainWindow.xaml
```

- `SpeechService`: reproducir, pausar, reanudar, detener, velocidad, volumen, voz y eventos de progreso.
- `TextPreprocessor`: pipeline determinista para Markdown, fragmentos omitidos y SSML seguro.
- `AudioExportService`: generar archivos sin cambiar la salida del reproductor activo.
- `MainViewModel`: única fuente de verdad para estado, comandos, disponibilidad de botones y mensajes.
- Diccionarios de recursos: colores semánticos y estilos reutilizables; nada de repetir colores en cada botón.

## Fases de implementación

### Fase 0 — Estabilización y seguridad

Prioridad: crítica.

- Corregir la restauración reproducible de NuGet para que no dependa de una carpeta de Visual Studio inexistente.
- Extraer y probar `TextPreprocessor`; corregir imágenes, enlaces, bloques de código, listas y Markdown anidado.
- Añadir un proyecto de pruebas para preprocesamiento y transiciones del reproductor.
- Sustituir excepciones silenciadas por resultados controlados y mensajes no intrusivos.
- Corregir el enlace roto del README.
- Diseñar, aprobar y ejecutar por separado la rotación/eliminación de los `.pfx`; nunca incluir contraseñas o certificados privados en Git.

**Criterio de salida:** compilación limpia desde un clon, pruebas verdes y ningún fallo silencioso en el flujo principal.

### Fase 1 — Controles reales de reproducción

Prioridad: alta; constituye el primer MVP utilizable.

- Implementar una máquina de estados explícita: `Idle`, `Speaking`, `Paused`, `Stopping`, `Exporting`, `Error`.
- Unificar el control principal como **Reproducir / Pausar / Reanudar** según el estado y mantener **Detener** como acción separada.
- Añadir velocidad (`Rate`, de -10 a +10), conservar volumen y voz.
- Añadir tono mediante SSML (`prosody`) con escape seguro; `System.Speech` no expone una propiedad directa de tono.
- Permitir **Leer todo** y **Leer selección**. Si existe una selección, mostrar claramente qué alcance se reproducirá.
- Mostrar estado, progreso aproximado y fragmento/palabra actual usando los eventos del sintetizador.
- Atajos: `Ctrl+Enter` reproducir, `Space` pausar/reanudar cuando el editor no esté escribiendo, `Esc` detener.
- Al cambiar de voz durante la lectura, pedir reinicio desde la posición actual aproximada o aplicar el cambio en la siguiente reproducción; no reiniciar silenciosamente desde cero.

**Criterio de salida:** todas las acciones están habilitadas sólo cuando corresponden y una secuencia reproducir → pausar → reanudar → detener es estable y repetible.

### Fase 2 — Fragmentos que no deben leerse

Prioridad: alta; es la mejora diferencial del editor.

- Migrar el área de entrada a un `RichTextBox` encapsulado en `NarrationEditor`.
- Acción **Omitir selección**: envolver el rango elegido en un `Span` etiquetado como `wintts-skip`.
- Mostrar los fragmentos omitidos con estilo semántico atenuado, fondo sutil e icono/tooltip, evitando depender sólo del color.
- Acción **Volver a incluir** y comando **Limpiar todas las omisiones**.
- El extractor recorre el `FlowDocument` y excluye los spans etiquetados, sin insertar marcadores molestos en el texto visible.
- Definir cómo persistir las omisiones: durante la sesión para TXT/MD y, si se desea conservarlas, mediante un formato propio `.wintts` o metadatos laterales. No incrustar XAML arbitrario sin validación.
- Compatibilidad con deshacer/rehacer y edición que atraviese parcialmente un fragmento omitido.

**Criterio de salida:** seleccionar varias regiones, omitirlas, editar alrededor de ellas y reproducir/exportar produce exactamente el mismo texto filtrado.

### Fase 3 — Generación y exportación de audio

Prioridad: alta.

- Exportar primero a **WAV**, soporte nativo y sin pérdidas mediante `SetOutputToWaveFile`.
- Diálogo de guardado, nombre sugerido, validación de ruta, estado de generación, cancelación y confirmación final.
- Usar una instancia separada del sintetizador para que exportar no altere o bloquee el reproductor activo.
- Aplicar exactamente la misma voz, volumen, velocidad, tono, limpieza Markdown y omisiones que en la previsualización.
- Implementar **MP3** como segunda entrega, después de decidir el codificador y revisar licencia, tamaño del ejecutable y compatibilidad MSIX. No presentarlo como nativo de `System.Speech`.
- Evitar sobrescrituras accidentales y limpiar archivos parciales si la exportación se cancela o falla.

**Criterio de salida:** el WAV generado coincide con la previsualización y una cancelación no deja archivos corruptos.

### Fase 4 — Rediseño práctico y corrección visual

Prioridad: media-alta; puede avanzar junto a las fases 1–3.

- Reorganizar la ventana en barra superior, editor central y barra de transporte inferior. Los ajustes menos frecuentes pueden ir en un panel lateral compacto.
- Centralizar colores en recursos semánticos: fondo, superficie, texto principal/secundario, acento turquesa, peligro y estados disabled/focus.
- Aplicar la jerarquía visual de referencia: radios de 12–16 px en controles y 24 px en contenedores principales; superficies sólidas legibles y acentos planos.
- Reemplazar glifos de ventana y acciones por `Path` vectoriales monocromáticos que hereden `Foreground`. Reservar rojo exclusivamente para cerrar/detener/destruir y corregir el borde perdido de **Detener**.
- Crear estilos compartidos para botones primary, secondary, ghost, danger e icon button, incluyendo hover, pressed, focus, disabled y alto contraste.
- Estilizar selector, slider, scrollbar, focus ring y selección del editor; comprobar contraste WCAG y escalado de texto.
- Añadir tooltips y `AutomationProperties.Name` a botones de icono, orden de tabulación, accesos de teclado y foco visible.
- Corregir maximizar/restaurar, doble clic en título, límites mínimos y comportamiento en pantallas pequeñas/DPI alto.
- Añadir contador de caracteres/palabras, duración estimada y mensajes de estado.
- Añadir vista Markdown activada por defecto y un modo fuente que resalte en ámbar la sintaxis y los elementos que no se narrarán.

**Criterio de salida:** la UI se entiende sin explicación, todos los iconos respetan el mismo color/estilo y puede operarse completamente con teclado.

### Fase 5 — Funciones de productividad y publicación

Prioridad: media.

- Abrir/arrastrar `.txt` y `.md`; guardar texto y detectar cambios sin guardar.
- Historial de archivos recientes y persistencia local de voz, volumen, velocidad, tono y tamaño de ventana.
- Acciones rápidas: pegar y leer, limpiar, copiar texto procesado y previsualizar “lo que realmente se leerá”.
- Pruebas manuales con varias voces, textos largos, Unicode, Markdown complejo, audio en uso y ausencia de voces.
- Validar EXE portable, MSIX, firma, manifiestos WinGet, documentación, privacidad y notas de versión 1.0.1.

**Criterio de salida:** paquete instalable reproducible, documentación alineada y smoke test completo en Windows 10/11.

## Orden recomendado de entrega

1. Fase 0 completa.
2. Fase 1 completa.
3. Fase 2 completa.
4. Fase 3 con WAV.
5. Fase 4 y pulido integral.
6. Fase 5 y MP3, si se aprueba la dependencia elegida.

El alcance aprobado para **WinTTS 1.0.1** es Fases 0–4 con WAV. MP3, formato `.wintts`, historial reciente y otras funciones de productividad quedan en planificación intermedia para una versión posterior.

## Validación mínima por entrega

- `dotnet restore`, `dotnet build` y `dotnet test` desde un entorno limpio.
- Pruebas unitarias del preprocesamiento y de las reglas de estado.
- Smoke test manual de voz, pausa, reanudación, detención, selección, omisiones y exportación.
- Inspección visual a 100%, 125% y 150% de escala; ventana normal y maximizada.
- Revisión de teclado, foco, contraste, ausencia de archivos privados y árbol Git limpio.

## Decisiones que requieren aprobación

1. Adoptar `RichTextBox` para omisiones visuales y aceptar un formato `.wintts` opcional si deben persistirse.
2. Entregar WAV en 1.0.1 y dejar MP3 condicionado a la evaluación de codificador/licencia.
3. Mantener WPF + `System.Speech` en esta versión, sin migrar de framework ni usar servicios online.
4. Retirar y rotar los certificados versionados antes de publicar una nueva compilación firmada.
