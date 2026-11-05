---
trigger: always_on
---

# Instrucciones del proyecto — WinTTS

## Documentación Core — entrada compartida

Consultar primero [Documentación Core](../../../Docs/README.md) y seleccionar solo los módulos pertinentes. Los estándares compartidos se mantienen allí; este archivo conserva el alcance y los contratos específicos de WinTTS.

- [Calidad y entrega proporcionales](../../../Docs/global/quality/quality-baseline.md): build para ajustes visuales pequeños; pruebas pertinentes para elementos, lógica o páginas nuevos y cambios grandes; revisión acotada para documentación.
- [Procesos según alcance](../../../Docs/global/documentation/process-workflow.md): no añadir fases, archivos ni nuevas aprobaciones por rutina a ajustes pequeños ya autorizados.
- [Diseño común](../../../Docs/global/design/design_system.md) y [textos de interfaz](../../../Docs/global/design/interface-writing.md): contenido preciso, espacio útil, mínimo scroll innecesario, fondo global y presets compartidos, conservando la identidad del producto.
- [Estilo de comunicación](../../../Docs/global/agents/communication-style.md): registro «Scientific Elegant» en resúmenes y cierres de sesión; no se aplica a la interfaz ni a la documentación entregable.
- [Reglas de trabajo del agente](../../../Docs/global/documentation/agent-working-rules.md): entrada única, límite de 12.000 caracteres por archivo de reglas y commits de resguardo.
- [Comandos mediante Mise](../../../Docs/global/architecture/mise-command-standard.md) y [scripts y alias](../../../Docs/global/architecture/command-scripts-standard.md): `dev`, `build`, `check`, `test`, `release` y `publish`.
- [Base de lanzamientos](../../../Docs/global/releases/release-baseline.md) y [protocolo de lanzamiento](../../../Docs/global/releases/protocolo_lanzamiento_actualizacion.md): versionado, artefactos, inmutabilidad y orden operativo.
- [Soporte oficial y «Acerca de»](../../../Docs/features/official-support/official-support-baseline.md): autoría, licencia y enlaces oficiales del producto.
- [Modelos de IA](../../../Docs/features/ai-models/README.md): criterio de selección y registro; WinTTS no consume modelos de IA (ver decisión local).
- [Instaladores](../../../Docs/features/installer/README.md) e [instalación en Windows](../../../Docs/platforms/windows/installer.md): empaquetado, identidad y desinstalación.
- [Diagnostics reutilizables](../../../Docs/troubleshooting/README.md) y [promoción a Core](../../../Docs/global/documentation/core-promotion-workflow.md): documentar en Core los fallos confirmados o aprendizajes generalizables y enlazarlos desde el proyecto; mantener locales los detalles exclusivos.

En estos criterios comunes, aplicar las bases vigentes enlazadas en lugar de copias históricas de este archivo. Respetar la dirección actual de Biglex y los contratos específicos del producto; ante una contradicción, comprobar la implementación vigente y resolverla explícitamente. Las skills generales importadas son apoyo técnico, no una autoridad para redefinir estas reglas.

## Contratos locales de WinTTS

### Alcance del producto

- WinTTS es un lector y sintetizador de voz **100 % local y privado**: backend **Rust + Tauri 2.0**, frontend **React 19 + TypeScript + Vite 6**.
- No se incorporan servicios en la nube ni modelos de IA generativa en el flujo de lectura: es una decisión de producto registrada en [ROADMAP.md](../../ROADMAP.md). Cualquier propuesta que la cambie requiere decisión explícita del usuario.

### Motor de síntesis de voz

- Voces del sistema operativo (Windows SpeechSynthesis) y, de forma opcional, voces neuronales **Piper TTS**.
- El motor Piper es **opcional**: mientras no está operativo, la sección de voz neural no se muestra en la interfaz, porque no falta nada.
- El binario de Piper se instala desde la propia aplicación, se **verifica por hash** del ejecutable oficial y reside en la carpeta de datos; los pesos `.onnx` se descargan de Hugging Face.
- La validación del motor se hace por **hash del binario**, nunca por antigüedad del artefacto ni por la fecha del instalador.
- La exportación a MP3 en Windows depende de Media Foundation; WAV es el formato universal.

### Estructura del proyecto

- [Arquitectura del proyecto](../../docs/architecture.md): árbol real de carpetas, ubicación de scripts, artefactos y límites de tamaño.
- Los scripts ejecutables viven **solo en `scripts/`**; en la raíz no hay lanzadores ni scripts.
- La planificación técnica vive en `process/active/YYYY-MM-DD_objetivo/` con `PLAN.md`, `TASKS.md`, `VALIDATION.md` y `APPROVAL.md`, y se traslada a `process/completed/YYYY/` al cerrarse. No se crean plan, bitácora ni tareas sueltos en la raíz.
- Límite local de tamaño: ningún archivo `.tsx`, `.ts` o `.rs` supera las **400 líneas**; los módulos grandes se dividen por subcarpeta semántica.

### Versión, variables y configuración

- **Fuente de verdad única de la versión**: `package.json`, `src-tauri/tauri.conf.json` y `src-tauri/Cargo.toml` deben declarar el mismo valor; `scripts/release/publish-wintts.ts` lo verifica antes de publicar.
- `AURORA_RELEASE_TOKEN`: credencial **opcional** para sincronizar la ficha del producto en la web de Aurora. Solo la usa `mise publish`; nunca se versiona, se imprime ni se incluye en artefactos.
- `TAURI_DEV_HOST`: la usa Vite para exponer el servidor de desarrollo a otro dispositivo.

### Release y publicación

- [Flujo local de release](../../docs/release-workflow.md): contrato local, artefactos y comprobaciones.
- `mise release` **prepara** artefactos en `release/` y **no publica**; `mise publish` es la única vía de publicación y exige autorización explícita y confirmación interactiva.
- `release/` no se versiona (`.gitignore`). Los artefactos públicos son el instalador Inno Setup `.exe`, el paquete `.msix` y `SHA256SUMS.txt`.
- Los manifiestos WinGet de [packaging/winget/](../../packaging/winget/README.md) están **preparados y sin publicar**: `InstallerUrl` e `InstallerSha256` deben apuntar al artefacto final que se publica.
- La migración desde los empaquetados anteriores (NSIS, MSIX, portable) está documentada en [packaging/windows/MIGRATION.md](../../packaging/windows/MIGRATION.md) y nunca borra datos del usuario.

### Licencia y autoría

- Licencia **MIT**, autoría `biglexj` (2026). Autoría, licencia y enlaces oficiales de apoyo: [soporte oficial de Core](../../../Docs/features/official-support/official-support-baseline.md) y [README.md](../../README.md).
