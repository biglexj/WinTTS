# Guía de Empaquetado MSIX para WinTTS

## ✅ Proceso Completado

Se ha generado exitosamente el paquete MSIX de WinTTS.

### 📦 Información del Paquete

- **Nombre**: WinTTS.msix
- **Ubicación**: `D:\Proyectos\biglexj\WinTTS\publish\msix\WinTTS.msix`
- **Tamaño**: ~0.60 MB
- **Fecha de creación**: 20/01/2026

## 🛠️ Scripts Creados

Se crearon los siguientes scripts para automatizar el proceso:

### 1. `scripts/generate-assets.ps1`
Genera automáticamente los assets de imágenes PNG requeridos por el paquete MSIX a partir del ícono `.ico` existente.

**Uso**:
```powershell
.\scripts\generate-assets.ps1
```

**Assets generados**:
- `Square44x44Logo.png` (44x44)
- `Square150x150Logo.png` (150x150)
- `Wide310x150Logo.png` (310x150)
- `StoreLogo.png` (50x50)

### 2. `scripts/build-msix.ps1`
Script maestro que compila el proyecto y genera el paquete MSIX completo.

**Uso**:
```powershell
.\scripts\build-msix.ps1
```

**Parámetros opcionales**:
```powershell
.\scripts\build-msix.ps1 -Configuration Release -Platform x64 -SdkVersion "10.0.26100.0"
```

**Proceso que ejecuta**:
1. Verifica que MSBuild y las herramientas del SDK estén disponibles
2. Limpia compilaciones anteriores
3. Compila el proyecto en modo Release
4. Prepara los archivos para el paquete
5. Genera el paquete MSIX
6. Firma el paquete (si existe el certificado)

### 3. `scripts/add-sdk-to-path.ps1`
Agrega el Windows SDK al PATH del sistema (requiere permisos de administrador).

**Uso**:
```powershell
# Como administrador
.\scripts\add-sdk-to-path.ps1
```

### 4. `scripts/sign-msix.ps1`
Firma el paquete MSIX con el certificado (ya existía).

### 5. `scripts/install-certificate.ps1`
Instala el certificado de prueba en el sistema (ya existía).

## 📋 Próximos Pasos

### Opción A: Instalación Local (Pruebas)

1. **Instalar el certificado** (solo la primera vez):
   ```powershell
   .\scripts\install-certificate.ps1
   ```

2. **Instalar la aplicación**:
   ```powershell
   Add-AppxPackage ".\publish\msix\WinTTS.msix"
   ```

3. **Desinstalar** (si es necesario):
   ```powershell
   Get-AppxPackage *WinTTS* | Remove-AppxPackage
   ```

### Opción B: Publicación en Microsoft Store

1. **Accede a Microsoft Partner Center**:
   - URL: https://partner.microsoft.com/dashboard
   - Inicia sesión con tu cuenta de desarrollador

2. **Crea una nueva aplicación** (si aún no lo has hecho):
   - Ve a "Aplicaciones y juegos" > "Nueva aplicación"
   - Reserva el nombre "WinTTS"

3. **Sube el paquete MSIX**:
   - Ve a "Envíos" > "Nuevo envío"
   - En "Paquetes", sube `WinTTS.msix`
   - **IMPORTANTE**: Microsoft firmará automáticamente el paquete con su propio certificado

4. **Completa la información requerida**:
   - Descripción de la aplicación
   - Capturas de pantalla
   - Categoría
   - Clasificación por edades
   - Política de privacidad (si aplica)

5. **Envía para certificación**:
   - Revisa toda la información
   - Click en "Enviar para certificación"
   - El proceso de revisión puede tomar de 1 a 3 días hábiles

## 🔧 Configuración del Entorno

### Windows SDK
El SDK de Windows 11 (10.0.26100.0) debe estar instalado y agregado al PATH:

```
C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64
```

### Herramientas Requeridas
- ✅ Visual Studio Build Tools
- ✅ Windows SDK 10.0.26100.0
- ✅ MSBuild
- ✅ makeappx.exe
- ✅ signtool.exe

## 📝 Notas Importantes

### Certificado de Firma
- **Para pruebas locales**: Usa el certificado autofirmado `WinTTS_Certificate.pfx`
- **Para Microsoft Store**: Microsoft firma automáticamente con su certificado, NO necesitas firmar el paquete antes de subirlo

### Manifest (Package.appxmanifest)
El manifest contiene la configuración del paquete:
- **Identity Name**: `WinTTS.Project`
- **Publisher**: `CN=BiglexJ`
- **Version**: `1.0.0.0`

**IMPORTANTE**: Para publicar en la Store, deberás actualizar estos valores con los que te proporcione Microsoft Partner Center al reservar el nombre de la aplicación.

### Actualización de Versión
Para generar una nueva versión, actualiza el número de versión en `Package.appxmanifest`:
```xml
<Identity Version="1.0.1.0" />
```

Luego ejecuta nuevamente:
```powershell
.\scripts\build-msix.ps1
```

## 🐛 Solución de Problemas

### Error: "makeappx.exe no reconocido"
**Solución**: Recarga el PATH en la sesión actual:
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### Error: "Missing a required footprint file"
**Solución**: Asegúrate de que existan todos los assets de imágenes:
```powershell
.\scripts\generate-assets.ps1
```

### Error al instalar el paquete localmente
**Solución**: Instala primero el certificado:
```powershell
.\scripts\install-certificate.ps1
```

## 📚 Referencias

- [Documentación de MSIX](https://docs.microsoft.com/windows/msix/)
- [Microsoft Partner Center](https://partner.microsoft.com/dashboard)
- [Guía de publicación en Microsoft Store](https://docs.microsoft.com/windows/uwp/publish/)

---

**Creado**: 20/01/2026  
**Autor**: BiglexJ  
**Proyecto**: WinTTS
