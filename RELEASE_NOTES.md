# 🎙️ WinTTS — Historial de versiones

📌 **Versión activa: `2.0.0` · Versión mínima publicada: `1.0.0`**

> [!IMPORTANT]
> **Estándar SemVer Flexible (Core-Docs v1.7.0):**
> - Se utiliza SemVer estándar (`MAJOR.MINOR.PATCH`) sin límites artificiales por dígito.
> - Se incrementa `MAJOR` en hitos de transformación arquitectónica integral con nombre de dulce.

## [2.1.0] — 2026-10-22 — “Nugget Update”

### Resumen

Cierra las promesas que el catalogo de voces neuronales dejaba abiertas y convierte el editor en una
herramienta de trabajo: los documentos se abren, se guardan y Piper deja de ser decorativo para ser un
motor real.

### Añadido

* **Guardar, Abrir y Guardar como** (`Ctrl+S`, `Ctrl+O`, `Ctrl+Shift+S`). El comando `save_text_file`
  ya existia en el backend pero ningun codigo del frontend lo invocaba: las ediciones se perdian al
  cerrar la aplicacion.
* **Borrador persistente entre sesiones**: el contenido en edicion se restaura al reabrir WinTTS,
  marcando si hay cambios pendientes de escribir en disco.
* **Motor Piper funcional**: descarga real de los pesos `.onnx` desde Hugging Face con barra de
  progreso, verificacion de lo que hay realmente en disco, sintesis local con `piper.exe` y
  reproduccion del WAV generado. La velocidad se controla con `length_scale`.
* **Estado honesto del motor**: si falta `piper.exe`, la interfaz lo dice (pildora “SIN MOTOR” y aviso
  en la barra lateral) y la aplicacion **no** cambia de voz en silencio.
* **Persistencia de la configuracion de voz**: voz, volumen, velocidad y tono se guardan entre sesiones.

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

* 10 pruebas unitarias en Rust (antes 1), incluyendo el ciclo completo de Piper con un ejecutable
  simulado y la descarga real de un peso desde Hugging Face.
* `tsc && vite build` sin errores; `cargo test --lib` en verde.
* Flujo de guardado verificado sobre la aplicacion en ejecucion (escritura y relectura reales).

## [2.0.0] — 2026-08-31 — “Nougat Update”

### Resumen

Reescritura y modernización arquitectónica completa de WinTTS migrando desde WPF/C# hacia una plataforma nativa y multiplataforma basada en **Rust + Tauri 2.0**, **React 19**, **TypeScript** y **Vite**.

Se implementa la capacidad de arrastrar y soltar (Drag & Drop) archivos `.md` y `.txt` directamente sobre la ventana de la aplicación con retroalimentación visual inmediata. El motor de procesamiento en Rust realiza una limpieza instantánea de sintaxis Markdown, emojis y bloques de código, manteniendo la exclusión precisa de fragmentos marcados en ámbar.

La aplicación integra compatibilidad para voces del sistema operativo y una arquitectura preparada para motores neuronales locales como Piper TTS. Se mantiene el diseño visual original con paleta Dark Slate/Teal, controles de velocidad, tono y volumen, modo de vista previa Markdown enriquecida y exportación directa a formato WAV de alta fidelidad.

El código fuente del stack C#/WPF previo ha sido archivado y resguardado en la carpeta `archivado/`.

## [1.0.1] — 2026-07-16

### Resumen

Este parche amplió WinTTS con un ciclo de reproducción completo —pausa, reanudación, detención, velocidad y tono— y convirtió el editor en una herramienta de narración más práctica mediante lectura de selección y fragmentos marcados para omitir.

También incorporó exportación WAV local, cambio de voz durante la lectura activa, limpieza de sintaxis Markdown y omisión de emojis.

## [1.0.0] — 2026-01-20 — “Alfajor”

### Resumen

Primera versión pública de WinTTS en WPF/.NET con síntesis de voz 100% local, selector de voz, ajuste de volumen y diseño oscuro con acentos turquesa.
