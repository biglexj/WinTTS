# Tareas — WinTTS v2.1.0 “Nugget Update”

## Backend (Rust)

- [x] `services/piper.rs`: listar modelos **realmente presentes** en disco (`.onnx` + `.onnx.json`).
- [x] `services/piper.rs`: detectar si el ejecutable de Piper esta configurado.
- [x] `services/piper.rs`: descargar pesos con streaming y progreso por evento (`piper://download-progress`).
- [x] `services/piper.rs`: sintesis con `piper.exe` (texto por stdin, WAV por `--output_file`, `length_scale` para la velocidad).
- [x] `services/piper.rs`: eliminar un modelo y su configuracion.
- [x] `services/tts.rs`: idioma del SSML acorde a la voz elegida (`resolve_culture`).
- [x] `services/tts.rs`: `transcode_wav_to_mp3` reutilizable y `export_wav_file` para entregar un WAV ya sintetizado.
- [x] `services/tts.rs`: MP3 en plataformas sin Media Foundation informa del limite en vez de escribir un WAV con extension `.mp3`.
- [x] `services/preprocessor.rs`: `build_ssml` ya no genera `pitch="0st"` (SSML invalido).
- [x] `commands/file_ops.rs`: lectura tolerante de archivos no UTF-8 y creacion de carpeta al guardar.
- [x] `commands/piper.rs` + `lib.rs`: registrar los comandos nuevos.

## Frontend (React + TypeScript)

- [x] `types/index.ts`: catalogo de Piper contrastado con Hugging Face (entradas y tamanos reales).
- [x] `types/index.ts`: rutas de descarga de pesos y configuracion.
- [x] `services/tauriBridge.ts`: guardar, abrir y guardar como; API de Piper; persistencia de la configuracion de voz.
- [x] `hooks/useDocument.ts`: ruta del documento, estado “sin guardar”, guardar / guardar como / abrir, borrador persistente.
- [x] `hooks/useDocument.ts`: reajuste de las omisiones al editar (`rebaseSkippedRanges`).
- [x] `hooks/usePiper.ts`: estado real del motor, descarga con progreso, desinstalacion, carpeta efectiva.
- [x] `hooks/useSpeech.ts`: motor dual (WebView para las voces del sistema, WAV de Piper para las neuronales).
- [x] `App.tsx`: atajos `Ctrl+S`, `Ctrl+Shift+S`, `Ctrl+O`; exportacion con el WAV de Piper; aviso cuando la voz seleccionada deja de existir.
- [x] `components/NarrationEditor`: botones Abrir / Guardar / Guardar como y nombre del documento.
- [x] `components/SettingsModal/PiperTab`: descarga real, progreso, boton “Probar motor” y estado real.
- [x] `components/SettingsSidebar`: pilida “SIN MOTOR” y aviso cuando el motor no esta configurado.

## Documentacion

- [x] `README.md`: capacidades reales, atajos y seccion del motor neural.
- [x] `RELEASE_NOTES.md`: entrada `2.1.0`.
- [x] `ROADMAP.md`: pendientes reorganizados y completados marcados.
