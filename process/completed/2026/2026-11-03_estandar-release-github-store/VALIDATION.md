# Registro de Validación: Estandarización de Release y Publicación

## 1. Evidencia de Capturas y README
* **Capturas Canónicas**:
  - `docs/screenshots/wintts-main-editor.webp` (96 KB)
  - `docs/screenshots/wintts-settings-piper.webp` (183 KB)
  - `docs/screenshots/wintts-settings-preferences.webp` (135 KB)
* **README.md**:
  - Actualizado con las tres capturas de pantalla integradas con `<img width="..." />`.
  - Descripción de interfaz actualizada eliminando la mención de la barra inferior.
  - Tabla de comandos Mise actualizada con empaquetado dual (.exe y .msix).
* **Image/preview.png**: Actualizado con el frame real de `wintts-main-editor.webp`.

## 2. Evidencia de Empaquetado Dual (Inno Setup EXE + MSIX Store)
* **Pipeline Orquestado** (`scripts/build-release.ps1`):
  1. Ejecución de pruebas unitarias (`cargo test --lib`).
  2. Generación del instalador de escritorio Inno Setup (`WinTTS-Setup-2.0.0.exe`).
  3. Generación del paquete Microsoft Store (`WinTTS-Windows-x64-2.0.0.msix`).
  4. Generación de `BUILD_INFO.json` con `bundleMode: inno+msix` y hashes SHA-256 de ambos artefactos.
  5. Actualización atómica de `SHA256SUMS.txt` y manifiestos WinGet (`packaging/winget/`).

## 3. Evidencia de Tareas Mise y Publicación
* **`bun run scripts/mise-task.ts publish --plan`**:
  - Salida: Código 0. Muestra las 8 etapas previstas (validación de versión, Git, artefactos, RELEASE_MESSAGE.md, tag, GitHub release y sincronización con Aurora).
* **`bun run scripts/mise-task.ts publish --check`**:
  - Salida: Código 0.
  - Verifica rama `main` y tag `v2.0.0` libre.
  - Verifica `RELEASE_MESSAGE.md` sanitizado sin fugas de datos locales ni regex conflicts.
  - Verifica `WinTTS-Setup-2.0.0.exe` (6.35 MB) y `WinTTS-Windows-x64-2.0.0.msix` (5.30 MB).
  - Verifica `SHA256SUMS.txt` coincidente al 100%.
