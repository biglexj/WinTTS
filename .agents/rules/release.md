---
trigger: always_on
description: Versionado, validación y publicación de WinTTS
---

# Releases

- `WinTTS.csproj` define la versión de producto; sincronizar `AssemblyVersion`, `FileVersion` y `Package.appxmanifest`.
- No crear otro parche si la versión activa todavía no fue publicada. Nunca usar un parche superior a `.9`.
- Antes de publicar: restaurar, compilar Release, ejecutar todas las pruebas y generar hashes SHA-256.
- Los artefactos viven en `release/` y no se versionan. GitHub Releases recibe el EXE portable y `SHA256SUMS.txt`.
- Actualizar los manifiestos WinGet con versión, URL y hash exactos del artefacto final.
- Usar un único commit de release, tag anotado `vX.Y.Z` y push atómico de commit + tag.
- Crear el GitHub Release desde `RELEASE_MESSAGE.md`. Nunca subir certificados `.pfx`, contraseñas ni secretos.
- Si alguna validación falla, detener el release antes del commit y conservar evidencia del error.
