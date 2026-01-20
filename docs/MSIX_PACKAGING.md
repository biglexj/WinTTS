# Guía Rápida de Empaquetado MSIX

Esta es una guía rápida para generar paquetes MSIX de WinTTS. Para información más detallada, consulta la [Guía Completa de MSIX](MSIX_GUIDE.md).

## 🚀 Inicio Rápido

### Requisitos Previos

- Visual Studio Build Tools con Windows SDK
- .NET SDK 10.0 o superior
- PowerShell 7+

### Generar Paquete MSIX

```powershell
# 1. Generar assets de imágenes (solo primera vez)
.\scripts\generate-assets.ps1

# 2. Compilar y empaquetar
.\scripts\build-msix.ps1

# 3. Firmar el paquete
.\scripts\sign-package.ps1

# 4. Instalar certificado (solo primera vez, requiere admin)
sudo pwsh -File .\scripts\install-dev-cert.ps1

# 5. Instalar la aplicación
Add-AppxPackage ".\publish\msix\WinTTS.msix"
```

## 📦 Resultado

- **Paquete**: `publish/msix/WinTTS.msix` (~0.6 MB)
- **Certificado**: `WinTTS_Dev_Certificate.pfx`

## 📚 Documentación Completa

Para más información, consulta:

### Guías Principales

- **[MSIX_GUIDE.md](MSIX_GUIDE.md)** - Guía completa de MSIX
  - Introducción a MSIX
  - Requisitos previos
  - Proceso de creación paso a paso
  - Certificados y firma
  - Instalación local
  - Publicación en Microsoft Store
  - Actualización de versiones
  - Solución de problemas

- **[SCRIPTS_REFERENCE.md](SCRIPTS_REFERENCE.md)** - Referencia de scripts
  - Scripts para MSIX
  - Scripts para EXE portable
  - Scripts de configuración
  - Comparación de métodos
  - Flujos de trabajo
  - Solución de problemas

- **[publicar.md](publicar.md)** - Guía de publicación
  - Ejecutable portable (EXE)
  - Paquete MSIX
  - Comparación de métodos
  - Publicación en WinGet
  - Publicación en Microsoft Store

### Documentación Adicional

- **[PUBLISHING.md](PUBLISHING.md)** - Documentación de publicación (inglés)
- **[RELEASE_NOTES.md](../RELEASE_NOTES.md)** - Notas de versión
- **[README.md](../README.md)** - Información general del proyecto

## 🔧 Scripts Disponibles

| Script                 | Descripción                        |
| ---------------------- | ---------------------------------- |
| `generate-assets.ps1`  | Genera imágenes PNG desde el ícono |
| `build-msix.ps1`       | Compila y empaqueta MSIX           |
| `sign-package.ps1`     | Firma el paquete MSIX              |
| `install-dev-cert.ps1` | Instala certificado de desarrollo  |
| `build-exe.ps1`        | Genera ejecutable portable         |
| `add-sdk-to-path.ps1`  | Configura PATH del SDK             |

Para detalles de cada script, consulta [SCRIPTS_REFERENCE.md](SCRIPTS_REFERENCE.md).

## ⚡ Comandos Útiles

```powershell
# Listar aplicaciones instaladas
Get-AppxPackage *WinTTS*

# Desinstalar aplicación
Get-AppxPackage *WinTTS* | Remove-AppxPackage

# Verificar firma del paquete
Get-AuthenticodeSignature .\publish\msix\WinTTS.msix

# Ver certificados instalados
Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*biglexj*" }
```

## 🆘 Solución de Problemas Comunes

### makeappx.exe no reconocido

```powershell
sudo pwsh -File .\scripts\add-sdk-to-path.ps1
```

### Error de certificado al instalar

```powershell
sudo pwsh -File .\scripts\install-dev-cert.ps1
```

### Faltan imágenes

```powershell
.\scripts\generate-assets.ps1
```

Para más problemas y soluciones, consulta [MSIX_GUIDE.md](MSIX_GUIDE.md#solución-de-problemas).

---

**Creado**: 20/01/2026  
**Autor**: biglexj  
**Proyecto**: WinTTS
