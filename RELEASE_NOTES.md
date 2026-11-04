# 🎙️ WinTTS — Historial de versiones

📌 **Versión activa: `2.0.0` · Versión mínima publicada: `1.0.0`**

> [!IMPORTANT]
> **Estándar SemVer Flexible (Core-Docs v1.7.0):**
> - Se utiliza SemVer estándar (`MAJOR.MINOR.PATCH`) sin límites artificiales por dígito.
> - Se incrementa `MAJOR` en hitos de transformación arquitectónica integral con nombre de dulce.

## [2.0.0] — 2026-10-22 — “Nougat & Nugget Update”

### Resumen

Reescritura y modernización arquitectónica completa de WinTTS migrando desde WPF/C# hacia una plataforma nativa y multiplataforma basada en **Rust + Tauri 2.0**, **React 19**, **TypeScript** y **Vite**.

Se implementa la capacidad de arrastrar y soltar (Drag & Drop) archivos `.md` y `.txt` directamente sobre la ventana de la aplicación con retroalimentación visual inmediata. El motor de procesamiento en Rust realiza una limpieza instantánea de sintaxis Markdown, emojis y bloques de código, manteniendo la exclusión precisa de fragmentos marcados en ámbar.

La aplicación integra compatibilidad para voces del sistema operativo y una arquitectura preparada para motores neuronales locales como Piper TTS. Se mantiene el diseño visual original con paleta Dark Slate/Teal, controles de velocidad, tono y volumen, modo de vista previa Markdown enriquecida y exportación directa a formato WAV de alta fidelidad.

Sobre esa base, esta entrega cierra las promesas que el catalogo de voces neuronales dejaba abiertas y convierte el editor en una herramienta de trabajo: los documentos se abren, se guardan y Piper deja de ser decorativo para ser un motor real.

El código fuente del stack C#/WPF previo ha sido archivado y resguardado en la carpeta `archivado/`.

### Añadido

* **Reescritura a Rust + Tauri 2.0** con frontend en **React 19**, **TypeScript** y **Vite**, y el stack C#/WPF previo archivado en `archivado/`.
* **Arrastrar y soltar (Drag & Drop)** de archivos `.md` y `.txt` sobre la ventana, con overlay visual animado.
* **Limpieza de Markdown en Rust**: preprocesamiento instantaneo de sintaxis Markdown, emojis y bloques de codigo, conservando la exclusion precisa de los fragmentos marcados en ambar.
* **Voces del sistema** con selector y arquitectura preparada para motores neuronales locales como Piper TTS, manteniendo la paleta Dark Slate/Teal, los controles de velocidad, tono y volumen y la vista previa Markdown enriquecida.
* **Exportacion directa a WAV de alta fidelidad** desde la aplicacion.
* **Guardar, Abrir y Guardar como** (`Ctrl+S`, `Ctrl+O`, `Ctrl+Shift+S`). El comando `save_text_file`
  ya existia en el backend pero ningun codigo del frontend lo invocaba: las ediciones se perdian al
  cerrar la aplicacion.
* **Borrador persistente entre sesiones**: el contenido en edicion se restaura al reabrir WinTTS,
  marcando si hay cambios pendientes de escribir en disco.
* **Motor Piper funcional**: descarga real de los pesos `.onnx` desde Hugging Face con barra de
  progreso, verificacion de lo que hay realmente en disco, sintesis local con `piper.exe` y
  reproduccion del WAV generado. La velocidad se controla con `length_scale`.
* **El motor deja de molestar cuando no se usa**: si falta `piper.exe`, la aplicacion no cambia de voz en
  silencio y no muestra avisos en la barra lateral: la seccion neural simplemente no existe todavia.
* **Instalacion del motor Piper desde la propia aplicacion**: el campo de ruta de `piper.exe` ya no es un
  callejon sin salida. El boton **Instalar Piper** descarga el binario oficial de Windows (22 MB), verifica
  su SHA-256 contra el del build publicado, lo extrae en `%LOCALAPPDATA%\com.biglexj.wintts\runtime\piper`
  y **actualiza la configuracion con la ruta resultante**. Despues se descarga la voz por defecto
  (`es_ES-carlfm-x_low`) para que el motor pueda usarse de inmediato. El ejecutable oficial acepta
  `--model`, `--output_file` y `--length_scale`: son exactamente los argumentos que ya enviava el backend.
* **Las voces neuronales ya no aparecen por defecto**: la seccion “VOZ PIPER (NEURAL)”, su desplegable y
  la insignia de Acerca de solo se muestran cuando el motor esta instalado. En una instalacion limpia la
  barra lateral enseña solo las voces del sistema, sin avisos: las voces neuronales son opcionales y su
  ausencia no es un problema. En consecuencia, las voces Piper solo se ofrecen en el selector cuando hay
  un motor que pueda sintetizarlas.
* **Persistencia de la configuracion de voz**: voz, volumen, velocidad y tono se guardan entre sesiones.
* **Instalador de Windows modernizado (Inno Setup)**: El instalador EXE de Windows se genera ahora con la plantilla propia de Biglex en Inno Setup, con una pantalla unica de entrada (presentacion, ruta editable y boton principal), progreso y exito nativos, tema claro/oscuro automatico segun Windows, esquinas nativas de Windows 11 e icono centrado. La instalacion es por usuario y sin elevacion, la actualizacion se aplica en el mismo directorio sin instalar en paralelo, y la coexistencia con el instalador anterior (NSIS) queda documentada.

### Corregido

* **La exportacion WAV fallaba por defecto.** `build_ssml` generaba `pitch="0st"`, que no es un valor
  valido de SSML (los valores absolutos van con nombre), y la sintetizacion de Windows devolvia el
  HRESULT `0x80131537`. El tono 0 ya no genera elemento `prosody`.
* **El idioma del audio exportado seguia a la voz real.** El SSML se construia siempre con `es-PE`,
  de modo que una voz en ingles se exportaba con fonetica espanola.
* **Las omisiones se descuadraban al editar.** Los fragmentos omitidos se guardan como offsets
  absolutos; al escribir por encima de ellos apuntaban a otro texto. Ahora se reajustan con el punto
  exacto de la edicion.
* **El catalogo de Piper no coincidia con el repositorio real**: tres entradas (`es_ES-carlfm-high`,
  `es_ES-carlfm-medium`, `it_IT-riccardo-medium`) no existen, y todos los tamanos de archivo estaban
  equivocados. El catalogo se contrasto contra la API de Hugging Face y se corrigio.
* **MP3 en plataformas sin Media Foundation**: se escribia un WAV dentro de un archivo `.mp3`. Ahora se
  informa con claridad de que la exportacion a MP3 solo esta disponible en Windows.
* **Los archivos de texto no UTF-8** ya no impiden abrirlos: se decodifican de forma tolerante.

### Verificacion

* 14 pruebas unitarias en Rust (antes 1), incluyendo el ciclo completo de Piper con un ejecutable
  simulado y la descarga real de un peso desde Hugging Face.
* `tsc && vite build` sin errores; `cargo test --lib` en verde (bundle 293 kB, gzip 88 kB).
* Flujo de guardado verificado sobre la aplicacion en ejecucion (escritura y relectura reales).

## [1.0.1] — 2026-07-16

### Resumen

Este parche amplió WinTTS con un ciclo de reproducción completo —pausa, reanudación, detención, velocidad y tono— y convirtió el editor en una herramienta de narración más práctica mediante lectura de selección y fragmentos marcados para omitir.

También incorporó exportación WAV local, cambio de voz durante la lectura activa, limpieza de sintaxis Markdown y omisión de emojis.

## [1.0.0] — 2026-01-20 — “Alfajor”

### Resumen

Primera versión pública de WinTTS en WPF/.NET con síntesis de voz 100% local, selector de voz, ajuste de volumen y diseño oscuro con acentos turquesa.
