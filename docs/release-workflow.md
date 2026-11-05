# Flujo de release y publicación de WinTTS

- Estado: base
- Última actualización: 2026-11-03
- Alcance: contrato local de preparación de artefactos y publicación.

Las bases compartidas de versionado, inmutabilidad y publicación están en Core: [base de lanzamientos](../../Docs/global/releases/release-baseline.md) y [protocolo de lanzamiento](../../Docs/global/releases/protocolo_lanzamiento_actualizacion.md). Este documento describe únicamente cómo se ejecutan en WinTTS.

## Separación entre preparación y publicación

| Acción | Tarea | Efecto |
|---|---|---|
| Preparar artefactos | `mise release` | Compila, empaqueta y escribe los artefactos en `release/`. **No publica**: no crea tag, no sube nada y no contacta servicios externos. |
| Publicar | `mise publish` | Única vía de publicación: crea el tag, sube la release a GitHub y, si procede, sincroniza la ficha del producto en Aurora. Exige autorización explícita. |

## Preparación: `mise release`

1. Ejecuta `scripts/build-release.ps1`, que a su vez invoca:
   - `scripts/build-exe.ps1` → ejecutable empaquetado.
   - `scripts/packaging/Build-Installer.ps1` → instalador Inno Setup (plantilla Biglex Modern 2.0).
   - `scripts/build-msix.ps1` → paquete de Microsoft Store (`.msix`).
2. Genera `SHA256SUMS.txt` y `BUILD_INFO.json` en `release/`.
3. Prepara los manifiestos WinGet de `packaging/winget/` **sin publicarlos**: `InstallerUrl` e `InstallerSha256` deben apuntar al artefacto final.

Artefactos públicos de la versión: instalador `.exe`, paquete `.msix` y `SHA256SUMS.txt`. `release/` no se versiona.

## Publicación: `mise publish`

`scripts/release/publish-wintts.ts` es la implementación. Antes de publicar, comprueba que `package.json`, `src-tauri/tauri.conf.json` y `src-tauri/Cargo.toml` declaran la misma versión.

Modos disponibles:

- `mise publish --plan`: muestra el plan de publicación sin ejecutar acciones, sin escribir y sin consultar la red.
- `mise publish --check`: verificación de solo lectura de requisitos locales y remotos.
- `mise publish`: publicación real; requiere confirmación interactiva y autorización explícita.

Canales: `github` publica en GitHub Releases; `all` añade la sincronización de la ficha en la web de Aurora.

## Credenciales

- `AURORA_RELEASE_TOKEN`: credencial **opcional** para sincronizar la ficha del producto. Solo la usa `mise publish`; nunca se versiona, se imprime ni se incluye en los artefactos.
- El certificado de firma se referencia por parámetro (`-CertificatePath`, `-CertificatePassword`); los `.pfx` están excluidos de Git.

## Manifiestos WinGet

`packaging/winget/` está **preparado y sin publicar**. Publicar un manifiesto exige que apunte al artefacto definitivo de la release; un hash provisional invalida la instalación del usuario.

## Comprobación proporcional

Para verificar el contrato de este flujo basta ejecutar `mise release --plan` y `mise publish --plan`, y comprobar que ninguna de las dos tareas escribe ni publica. No se ejecuta `mise publish` ni una instalación real para comprobar que el comando existe.

## Referencias

- [Arquitectura del proyecto](architecture.md)
- [Migración de empaquetados anteriores](../packaging/windows/MIGRATION.md)
- [Manifiestos WinGet](../packaging/winget/README.md)
