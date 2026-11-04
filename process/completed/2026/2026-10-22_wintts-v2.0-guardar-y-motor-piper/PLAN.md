# Plan — WinTTS v2.0.0 “Nougat & Nugget Update”

> Objetivo: cerrar las promesas a medias que el análisis del 2026-10-21 destapo en la app, sin
> añadir alcance nuevo ni romper la promesa de 100% offline.

## Contexto

La app WinTTS Rust + Tauri 2.0 (la que se iba a publicar como v2.0.0) cumplia su objetivo de leer texto
en voz alta, pero dejaba tres cables sueltos:

1. **El motor de voces neuronales era decorativo.** El catalogo mostraba modelos Piper, la descarga
   se simulaba con un `setTimeout`, la lectura seguia usando el motor del WebView (que nunca encuentra
   una voz llamada “Piper Neural — …”) y la interfaz mostraba la pilula “ACTIVA”. Elegir una voz
   neural no cambiaba un solo decibel.
2. **El editor no guardaba.** El comando `save_text_file` existia y estaba registrado en Rust, pero
   ningun codigo del frontend lo invocaba. Las ediciones se perdian al cerrar.
3. **La exportacion WAV fallaba por defecto.** `build_ssml` generaba `pitch="0st"`, valor invalido de
   SSML, y la sintetizacion de Windows devolvia `0x80131537` con el tono por defecto (0).

Ademas, el analisis habia medido que el “corte de locucion a los 15 s” de Chromium **no se reproduce**
en el motor actual, por lo que no se planteo trocear el texto.

## Alcance aprobado

- Cerrar el motor Piper de verdad: descarga, verificacion en disco, sintesis y reproduccion.
- Abrir, guardar y guardar como, con borrador persistente y atajos de teclado.
- Corregir los defectos detectados en el motor de sintesis y en la exportacion.
- Mantener la honestidad de la interfaz: si una capacidad no esta disponible, se dice.

## Fuera de alcance

- Modelos de IA generativa (costo por token descontrolado con documentos largos).
- TTS en la nube (rompe la promesa de privacidad).
- Inferencia ONNX propia (sustituir `piper.exe` por ONNX Runtime) — queda en el roadmap.
- Resaltado de palabra en la vista renderizada — queda en el roadmap.

## Criterios de aceptacion

- El documento se abre, se guarda y se guarda con otro nombre; el borrador sobrevive al cierre.
- Las omisiones siguen apuntando al texto correcto despues de editar.
- Un modelo Piper descargado aparece en el selector y la voz se sintetiza con `piper.exe`.
- Sin motor configurado, la interfaz lo dice y la app no recurre en silencio a otra voz.
- La exportacion WAV funciona con el tono por defecto y con el idioma de la voz elegida.
- `cargo test --lib` en verde y `tsc && vite build` sin errores.
