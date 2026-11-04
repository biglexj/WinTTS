# Validación — WinTTS v2.0.0 “Nougat & Nugget Update”

## Pruebas automaticas

| Comprobación | Resultado |
|---|---|
| `cargo test --lib` | **14/14 en verde** (antes: 1) |
| `tsc && vite build` | Sin errores · bundle 293 kB (gzip 88 kB) |

Cobertura de las pruebas nuevas en Rust:

* `list_installed_models_requires_onnx_and_json` — un `.onnx` sin su `.onnx.json` no cuenta como modelo.
* `list_installed_models_on_missing_dir_is_empty` — una carpeta inexistente no rompe el listado.
* `engine_available_rejects_blank_and_missing` — ruta vacia o inexistente = motor no disponible.
* `synthesize_reports_missing_binary` / `synthesize_reports_missing_model` — los errores son explicitos.
* `synthesize_with_fake_piper_writes_audio` — **ciclo completo de Piper** con un ejecutable simulado: se
  comprueba el arranque del proceso, el envio del texto por stdin, el argumento `--output_file` y la
  existencia del WAV resultante.
* `download_to_file_writes_file_and_reports_progress` — descarga real de un peso desde Hugging Face,
  con verificacion del archivo escrito y del progreso reportado.
* `resolve_culture_falls_back_without_voice` / `resolve_culture_uses_voice_culture_when_known` — el
  idioma del SSML sigue a la voz.
* `build_ssml_omits_pitch_when_zero` — **bloquea la regresion** que rompia la exportacion WAV.
* `build_ssml_uses_relative_pitch`, `build_ssml_clamps_pitch_and_defaults_culture`,
  `build_ssml_escapes_xml`.

## Comprobaciones sobre la aplicacion en ejecucion

La app se lanzo con el WebView2 en modo depuracion (`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS`) para
inspeccionarla y ejecutar sus comandos reales.

1. **Interfaz**: la barra del editor muestra `Abrir`, `Guardar`, `Guardar como`, `Leer seleccion`,
   `Omitir seleccion`, `Volver a incluir` y `Limpiar omisiones`. El nombre del documento aparece con
   el indicador de cambios sin guardar.
2. **Aviso honesto del motor**: sin `piper.exe` configurado, la barra lateral muestra el aviso
   “Para usar las voces neuronales indica la ruta de `piper.exe`…” y el selector de voz neural no
   ofrece ninguna voz (no hay modelos instalados).
3. **Guardado real por IPC**: `save_text_file` + `read_text_file` escribieron y releyeron un `.md` en
   disco con el contenido exacto; se verifico el archivo desde el sistema de archivos.
4. **Exportacion WAV**: se exporto con los tonos 0, 5 y -3. El tono 0 fallaba con
   `0x80131537` (SSML invalido); tras la correccion los tres casos funcionan. El idioma exportado
   sigue a la voz elegida.
5. **Protocolo de recursos**: el WAV generado en la carpeta de cache de la app se reprodujo desde el
   WebView a traves del protocolo `asset://`, que es el mecanismo que usa el motor neural.

## Verificacion previa que evito un arreglo innecesario

Antes de proponer trocear el texto se midio el motor de voz en Chromium (mismo nucleo que WebView2):

* Un unico `speak()` con **4 498 caracteres** se leyo completo: 117,5 s, 828 eventos `onboundary`,
  `charIndex` final 4492/4498.
* Con **1 248 caracteres**: 77,2 s, 230 eventos, completo. Identico con y sin keepalive.

El “corte de locucion a los 15 s” **no se reproduce** en el motor actual, asi que no se implemento
troceado defensivo. La sonda quedo en `test/` (ignorado por git) por si hay que repetirla.

## Contraste del catalogo de Piper

El catalogo se contrasto contra la API de Hugging Face (`rhasspy/piper-voices`), no de memoria:

* 17 de 20 entradas existen tal cual estaban.
* `es_ES-carlfm-high`, `es_ES-carlfm-medium` e `it_IT-riccardo-medium` **no existen**: esas voces solo
  tienen calidad `x_low`. Se sustituyeron por `es_ES-carlfm-x_low` e `it_IT-riccardo-x_low`.
* Todos los tamanos de archivo estaban mal (el catalogo decia 38-43 MB donde el peso real ocupa
  60-115 MB). Se corrigieron con las medidas reales.

## Incidencia del entorno (no del codigo)

La reconstruccion completa del backend en esta maquina fallaba con:

```
error: process didn't exit successfully (exit code: 0xc0000409, STATUS_STACK_BUFFER_OVERRUN)
```

Diagnostico:

1. El toolchain activo es `stable-x86_64-pc-windows-gnullvm`. El de MSVC (`stable-x86_64-pc-windows-msvc`)
   **no enliza** en esta maquina porque no hay `link.exe` (Visual C++ Build Tools no instalados):
   `error: linker 'link.exe' not found`. Los artefactos anteriores del repo venian de otra maquina.
2. Con `gnullvm`, rustc desborda la pila de su hilo principal al generar la informacion de depuracion
   de crates grandes (`windows`, `icu_properties`, `tao`, `tauri-utils`, `webview2-com-sys`).
3. `RUST_MIN_STACK` **no** lo corrige: solo afecta a los hilos que rustc crea, no al principal.
4. La causa real es la generacion de depuracion: con `CARGO_PROFILE_DEV_DEBUG=0` los mismos crates
   compilan sin problemas.

Correccion aplicada en `src-tauri/Cargo.toml`:

```toml
[profile.dev]
debug = 0

[profile.dev.package."*"]
debug = 0
```

El perfil de release ya venia sin informacion de depuracion. Con este perfil, `cargo build` y
`cargo test --lib` son estables en esta maquina.
