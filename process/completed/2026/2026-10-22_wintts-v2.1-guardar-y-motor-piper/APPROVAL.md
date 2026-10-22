# Aprobación — WinTTS v2.1.0 “Nugget Update”

## Origen

El 2026-10-21, tras el analisis de la app v2.0.0, Biglex pidio explicitamente **“implementa”** sobre
la lista de hallazgos priorizados. Ese mensaje es la aprobacion de ejecucion de este alcance.

## Alcance aprobado

Cerrar las tres promesas a medias detectadas en el analisis, sin ampliar el producto:

1. Motor de voces neuronales real (descarga, verificacion, sintesis, reproduccion).
2. Guardar / abrir / guardar como con atajos y borrador persistente.
3. Correccion de los defectos de sintesis y exportacion detectados.

Quedan **fuera** de esta aprobacion y pasan al roadmap: inferencia ONNX propia, MP3 multiplataforma,
resaltado de palabra en la vista renderizada, reanudacion desde el punto de lectura, exportacion por
capitulos y atajos globales.

## Decisiones tomadas durante la ejecucion

| Decision | Motivo |
|---|---|
| Descarga de pesos en Rust con `reqwest` en vez del plugin HTTP del frontend | Evita serializar decenas de MB por IPC y permite progreso real por evento. |
| Verificacion de modelos por archivo en disco, no por lista en `localStorage` | La UI debe reflejar lo que existe de verdad. |
| Sin motor configurado, la app **no** recurre en silencio a la voz del sistema | Es el mismo criterio que se le critico a la v2.0.0. |
| Sin troceado defensivo del texto | Se midio que el corte de 15 s de Chromium no se reproduce en el motor actual. |
| Se corrigio el catalogo de Piper contra la API de Hugging Face | El catalogo anterior tinha entradas inexistentes y tamanos erroneos. |
| `debug = 0` en el perfil dev | Necesario para que el backend compile en esta maquina (toolchain `gnullvm`). |

## Estado

Ejecucion completada el 2026-10-22. Validacion en `VALIDATION.md`.
