# Tareas de Trabajo: Estandarización de Release y Publicación (GitHub + Store)

- [x] **Fase 1: Capturas de pantalla e integración en README**
  - [x] Renombrar capturas en `docs/screenshots/` a nombres semánticos `.webp`.
  - [x] Eliminar capturas PNG antiguas.
  - [x] Actualizar `README.md` con las imágenes y texto actualizado de la UI v2.0.0.
  - [x] Actualizar `Image/preview.png` con la captura principal.

- [x] **Fase 2: Pipeline de empaquetado dual (EXE + MSIX)**
  - [x] `Build-Installer.ps1` genera `release/WinTTS-Setup-2.0.0.exe`.
  - [x] `build-msix.ps1` genera `release/WinTTS-Windows-x64-2.0.0.msix`.
  - [x] Orquestador `scripts/build-release.ps1` genera ambos artefactos, actualiza `SHA256SUMS.txt` y `BUILD_INFO.json`.
  - [x] Actualizar `scripts/mise-task.ts` para que `mise release` ejecute la generación de ambos artefactos.

- [x] **Fase 3: Publicador oficial GitHub + Aurora (`mise publish`)**
  - [x] Crear módulo de publicación `scripts/release/publish-wintts.ts` compatible con el estándar de `Aurora---Blog`.
  - [x] Conectar `scripts/mise-task.ts` para delegar `mise publish` a `publish-wintts.ts`.
  - [x] Validar compatibilidad con los argumentos `--plan`, `--check`, `--resume`, `github` y `all`.

- [x] **Fase 4: Validación integral**
  - [x] Ejecutar `mise release --plan`.
  - [x] Ejecutar `mise publish --plan`.
  - [x] Ejecutar `mise publish --check`.
  - [x] Completar `VALIDATION.md` y `APPROVAL.md`.
