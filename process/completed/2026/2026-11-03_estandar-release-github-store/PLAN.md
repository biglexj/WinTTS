# Plan de Trabajo: Estandarización de Release y Publicación (GitHub + Microsoft Store)

- **Objetivo**: Implementar el estándar unificado de release y publicación del ecosistema Biglex en WinTTS, soportando generación de instalador Inno Setup (`.exe`), paquete para Microsoft Store (`.msix`), hashes SHA-256, manifiestos WinGet, publicación atómica en GitHub Releases (`gh`), sincronización opcional con la web de Aurora y actualización del `README.md` con las nuevas capturas de pantalla de la interfaz v2.0.0.
- **Fecha de inicio**: 2026-11-03
- **Estado**: Activo
- **Responsable**: Biglex J / Antigravity Agent

---

## 1. Análisis y Alineación con Estándares Core (Docs)

### 1.1 Estándares de Referencia
* `Docs/global/releases/release-baseline.md`: Invarianza de versión, una sola fuente de verdad, publicación inmutable, notas públicas en `RELEASE_MESSAGE.md`.
* `Docs/global/releases/web-release-message-standard.md`: Contrato de publicación web, fallback GitHub Releases, SemVer estricto, SHA-256.
* `Aurora---Blog/scripts/release/`: Modelo de referencia con `publish-app.ts`, `publish-policy.ts`, `--plan`, `--check`, `--resume`, verificación atómica y sin secrets expuestos.

### 1.2 Particularidades de WinTTS
* **Dualidad de Distribución Windows**:
  1. **Instalador Oficial de Escritorio**: `WinTTS-Setup-2.0.0.exe` (generado vía Inno Setup con la plantilla `BiglexModernUI.iss`).
  2. **Paquete Microsoft Store**: `WinTTS-Windows-x64-2.0.0.msix` (generado vía `makeappx.exe` a partir de `Package.appxmanifest`).
* **Canal GitHub Releases**: Aloja `WinTTS-Setup-2.0.0.exe`, `WinTTS-Windows-x64-2.0.0.msix` y `SHA256SUMS.txt`.
* **Sincronización Web Aurora**: Compatible con el endpoint `/api/admin/developer-app-releases` para cuando se habilite el token.

---

## 2. Fases de Ejecución

### Fase 1: Organización de Recursos Visuales y README
1. Renombrar las capturas en `docs/screenshots/` con nombres canónicos semánticos:
   - `wintts-main-editor.webp`
   - `wintts-settings-piper.webp`
   - `wintts-settings-preferences.webp`
2. Eliminar capturas PNG obsoletas (`narration_editor_empty.png`, `narration_editor_markdown.png`).
3. Actualizar `README.md` con las capturas de pantalla integradas en carrusel/galería y descripción actualizada de la UI v2.0.0 (sin la barra inferior eliminada).

### Fase 2: Script Unificado de Compilación y Empaquetado (`mise release`)
1. Centralizar y armonizar `scripts/build-release.ps1` y `scripts/mise-task.ts`:
   - Compilación Release de frontend y backend (`tauri build --no-bundle`).
   - Generación del instalador oficial Inno Setup (`WinTTS-Setup-2.0.0.exe`).
   - Generación del paquete Microsoft Store (`WinTTS-Windows-x64-2.0.0.msix`).
   - Generación de `BUILD_INFO.json` y `SHA256SUMS.txt` en `release/`.
   - Actualización de los manifiestos WinGet (`packaging/winget/`).

### Fase 3: Script de Publicación Oficial (`mise publish`)
1. Desarrollar `scripts/release/publish-wintts.ts` (siguiendo el estándar de oro de `Aurora---Blog`):
   - Soporte para `--plan` (simulación de pasos sin red ni escritura).
   - Soporte para `--check` (verificación de estado local/remoto sin publicar).
   - Soporte para `--resume` (continuación de borrador o re-verificación).
   - Verificación de versión unificada (package.json, tauri.conf.json, Cargo.toml).
   - Verificación de Git (árbol limpio, commit existente en remoto).
   - Creación del tag anotado `v2.0.0` y GitHub Release con `gh release create`.
   - Carga de assets (`.exe`, `.msix`, `SHA256SUMS.txt`).
   - Sincronización con Aurora si existe `AURORA_RELEASE_TOKEN`.

### Fase 4: Validación y Pruebas
1. Ejecutar `mise release --plan` y `mise publish --plan`.
2. Ejecutar `mise publish --check` para verificar todas las precondiciones.
3. Validar TypeScript y compilación sin errores.
