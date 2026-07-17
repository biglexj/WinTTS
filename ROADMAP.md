# 🎯 WinTTS — Roadmap

Plan de trabajo, objetivos y prioridades del proyecto.

## 🔴 Urgente / Normal (Pendientes Activos)

- Sin pendientes críticos abiertos para el hito `1.0.1`.

## 🟡 Intermedio (Prioridad Media/Baja)

- [ ] Incorporar importación y guardado de `.txt` y `.md`.
- [ ] Persistir configuración, archivos recientes y fragmentos omitidos mediante un formato seguro.
- [ ] Evaluar exportación MP3 según licencia, tamaño y compatibilidad MSIX.
- [ ] Añadir previsualización del texto procesado y estimación avanzada de duración.

## ⚪ Descartado / En Pausa

- ⏸️ Migración de WPF o uso de TTS en la nube: fuera del alcance; se conserva la ejecución local y privada.

## 🟢 Completado

- [x] Primera versión estable WinTTS `1.0.0` “Alfajor”.
- [x] Motor TTS local mediante `System.Speech.Synthesis`.
- [x] Selección de voces instaladas y ajuste de volumen.
- [x] Cambio de voz durante la lectura, retomando tras la última palabra procesada y conservando la pausa.
- [x] Vista Markdown renderizada con modo fuente y resaltado de elementos no narrados.
- [x] Preprocesamiento Markdown y omisión de emojis cubiertos por pruebas automatizadas.
- [x] Reproducción, pausa, reanudación y detención mediante estados explícitos.
- [x] Velocidad, tono, lectura de selección y fragmentos omitidos.
- [x] Exportación WAV cancelable con la misma configuración de reproducción.
- [x] Iconos, colores, foco, contraste y estados de controles unificados.
- [x] WinTTS `1.0.1` compilado, validado y publicado con binario portable y SHA-256.
- [x] Interfaz oscura inicial con barra de título personalizada.
- [x] Plan de implementación y reglas documentales normalizadas desde los templates del autor.
