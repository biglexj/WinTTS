# Actualización del PR de WinGet - Solución Completa

## 🎯 Problema Resuelto

**Error original**: `TRUST_E_NOSIGNATURE (0x800B0100)` - El paquete MSIX no tenía firma digital válida.

**Solución**: Cambiar de instalador MSIX a **ejecutable portable EXE**, que no requiere firma digital.

---

## ✅ Cambios Implementados

### Archivo: `biglexj.WinTTS.installer.yaml`

```yaml
# Created using wingetcreate 1.10.3.0
# yaml-language-server: $schema=https://aka.ms/winget-manifest.installer.1.10.0.schema.json

PackageIdentifier: biglexj.WinTTS
PackageVersion: 1.0.0
Platform:
  - Windows.Desktop
MinimumOSVersion: 10.0.17763.0
InstallerType: portable
Commands:
  - wintts
Installers:
  - Architecture: x64
    InstallerUrl: https://github.com/biglexj/WinTTS/releases/download/v1.0.0/WinTTS.exe
    InstallerSha256: C94C360FB0C00DEC667ADCF87AA8152A65BC715F15DC4389DE90B0F1E72634FE
ManifestType: installer
ManifestVersion: 1.10.0
```

### Resumen de Cambios

| Campo               | Antes (MSIX)                   | Ahora (EXE)           |
| ------------------- | ------------------------------ | --------------------- |
| `InstallerType`     | `msix`                         | `portable`            |
| `InstallerUrl`      | `.../WinTTS.msix`              | `.../WinTTS.exe`      |
| `InstallerSha256`   | `A4A86427181C570F...`          | `C94C360FB0C00DEC...` |
| `Scope`             | `user`                         | *(eliminado)*         |
| `InstallModes`      | `interactive, silent`          | *(eliminado)*         |
| `UpgradeBehavior`   | `install`                      | *(eliminado)*         |
| `PackageFamilyName` | `biglexj.WinTTS_ppytjz2en1wwy` | *(eliminado)*         |
| `Commands`          | *(no existía)*                 | `wintts`              |

---

## 🚀 Cómo Actualizar el PR #331954

### Opción 1: Script Automático (Más Fácil)

```powershell
cd d:\Proyectos\biglexj\WinTTS
.\scripts\update-winget-pr-complete.ps1
```

El script te guiará paso a paso para:
1. Clonar tu fork (si no lo tienes)
2. Encontrar el branch del PR
3. Copiar los manifiestos actualizados
4. Hacer commit y push

### Opción 2: Edición Directa en GitHub (Más Rápido)

1. **Ve al PR**: https://github.com/microsoft/winget-pkgs/pull/331954
2. **Haz clic en "Files changed"**
3. **Encuentra** `biglexj.WinTTS.installer.yaml`
4. **Haz clic en el ícono de editar** (⋯ → Edit file)
5. **Reemplaza** todo el contenido con el código YAML de arriba
6. **Commit** con el mensaje:
   ```
   Update to portable EXE installer (fixes signature error)
   ```

### Opción 3: Git Manual

```bash
# 1. Clonar tu fork
git clone https://github.com/biglexj/winget-pkgs.git
cd winget-pkgs

# 2. Encontrar el branch del PR
git fetch origin
git branch -a | grep WinTTS
git checkout <nombre-del-branch>

# 3. Editar el archivo
# Ruta: manifests/b/biglexj/WinTTS/1.0.0/biglexj.WinTTS.installer.yaml
# Reemplazar con el contenido de arriba

# 4. Commit y push
git add .
git commit -m "Update to portable EXE installer (fixes signature error)"
git push origin <nombre-del-branch>
```

---

## 📋 Mensaje de Commit Sugerido

```
Update to portable EXE installer (fixes signature validation error)

- Changed InstallerType from msix to portable
- Updated InstallerUrl to use WinTTS.exe
- Updated InstallerSha256 to C94C360FB0C00DEC667ADCF87AA8152A65BC715F15DC4389DE90B0F1E72634FE
- Removed MSIX-specific fields (Scope, InstallModes, UpgradeBehavior, PackageFamilyName)
- Added Commands field for portable installer

This resolves the TRUST_E_NOSIGNATURE (0x800B0100) error since EXE files
don't require digital certificate validation like MSIX packages.
```

---

## 💬 Comentario Opcional para el PR

Puedes agregar este comentario en el PR para explicar el cambio:

```markdown
Updated the installer type from MSIX to portable EXE to resolve the signature validation error.

**Changes:**
- ✅ Changed `InstallerType` from `msix` to `portable`
- ✅ Updated installer URL to use `WinTTS.exe` instead of `WinTTS.msix`
- ✅ Updated SHA256 hash to match the EXE file
- ✅ Removed MSIX-specific fields
- ✅ Added `Commands` field for portable installer

**Why this works:**
Portable EXE installers don't require digital certificate validation, which eliminates the `TRUST_E_NOSIGNATURE` error. The EXE is already available in the GitHub release.

The manifest has been validated locally with `winget validate` and passes successfully.
```

---

## ✅ Verificación

Después de actualizar el PR:

1. **Espera unos minutos** para que GitHub procese el push
2. **Ve al PR**: https://github.com/microsoft/winget-pkgs/pull/331954
3. **Verifica** que los cambios se reflejen en "Files changed"
4. **Espera** a que la validación automática se ejecute nuevamente
5. **La validación debería pasar** sin errores de firma

---

## 🎉 Resultado Esperado

Una vez que el PR sea aprobado y mergeado, los usuarios podrán instalar WinTTS con:

```powershell
winget install biglexj.WinTTS
```

El instalador portable:
- ✅ Se descargará automáticamente
- ✅ Se copiará a una ubicación del PATH
- ✅ Estará disponible como comando `wintts` en la terminal
- ✅ No requerirá permisos de administrador
- ✅ No tendrá problemas de firma digital

---

## 📚 Archivos Relacionados

- **Manifiesto actualizado**: `d:\Proyectos\biglexj\WinTTS\manifests-msix\biglexj.WinTTS.installer.yaml`
- **Script de actualización**: `d:\Proyectos\biglexj\WinTTS\scripts\update-winget-pr-complete.ps1`
- **Documentación**: `d:\Proyectos\biglexj\WinTTS\docs\WINGET_SIGNATURE_FIX.md`
- **PR de WinGet**: https://github.com/microsoft/winget-pkgs/pull/331954
- **Release de GitHub**: https://github.com/biglexj/WinTTS/releases/tag/v1.0.0
