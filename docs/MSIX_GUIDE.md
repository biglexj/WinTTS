# Guía Completa de MSIX para WinTTS

## 📋 Tabla de Contenidos

1. [Introducción a MSIX](#introducción-a-msix)
2. [Requisitos Previos](#requisitos-previos)
3. [Proceso de Creación](#proceso-de-creación)
4. [Certificados y Firma](#certificados-y-firma)
5. [Instalación Local](#instalación-local)
6. [Publicación en Microsoft Store](#publicación-en-microsoft-store)
7. [Actualización de Versiones](#actualización-de-versiones)
8. [Solución de Problemas](#solución-de-problemas)

---

## Introducción a MSIX

### ¿Qué es MSIX?

MSIX es el formato moderno de empaquetado de aplicaciones de Windows que ofrece:

- ✅ **Instalación limpia**: No deja archivos residuales
- ✅ **Desinstalación completa**: Elimina todos los archivos y configuraciones
- ✅ **Actualizaciones automáticas**: A través de Microsoft Store
- ✅ **Sandbox**: Aplicación aislada para mayor seguridad
- ✅ **Tamaño pequeño**: ~0.6 MB (sin incluir .NET runtime)
- ✅ **Distribución profesional**: Compatible con Microsoft Store y WinGet

### ¿Por qué usar MSIX?

**Para desarrolladores**:
- Proceso de actualización simplificado
- Distribución a través de Microsoft Store
- Firma digital automática (en la Store)
- Mejor experiencia de usuario

**Para usuarios**:
- Instalación con un clic
- Actualizaciones automáticas
- Desinstalación limpia
- Mayor seguridad (sandbox)

---

## Requisitos Previos

### Software Necesario

1. **Visual Studio Build Tools** (o Visual Studio completo)
   - Descarga: https://visualstudio.microsoft.com/downloads/
   - Componentes requeridos:
     - MSBuild
     - .NET Desktop Development

2. **Windows SDK 11**
   - Versión recomendada: 10.0.26100.0 o 10.0.22621.0
   - Incluye:
     - `makeappx.exe` - Para crear paquetes MSIX
     - `signtool.exe` - Para firmar paquetes

3. **.NET SDK 10.0** (o superior)
   - Descarga: https://dotnet.microsoft.com/download

### Verificar Instalación

```powershell
# Verificar MSBuild
msbuild -version

# Verificar makeappx
makeappx.exe /?

# Verificar .NET
dotnet --version
```

Si `makeappx` no se reconoce, ejecuta:
```powershell
.\scripts\add-sdk-to-path.ps1
```

---

## Proceso de Creación

### Paso 1: Generar Assets de Imágenes

Los paquetes MSIX requieren varios logos en formato PNG:

```powershell
.\scripts\generate-assets.ps1
```

**Assets generados**:
- `Square44x44Logo.png` (44×44 px) - Ícono pequeño
- `Square150x150Logo.png` (150×150 px) - Ícono del menú Inicio
- `Wide310x150Logo.png` (310×150 px) - Tile ancho
- `StoreLogo.png` (50×50 px) - Logo para la Store

Estos se generan automáticamente desde `Icon/app_icon.ico`.

### Paso 2: Configurar el Manifest

El archivo `Package.appxmanifest` contiene la configuración del paquete:

```xml
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
         xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
         xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities">

  <!-- Identidad del paquete -->
  <Identity
    Name="WinTTS.Project"
    Publisher="CN=biglexj"
    Version="1.0.0.0" />

  <!-- Propiedades -->
  <Properties>
    <DisplayName>WinTTS</DisplayName>
    <PublisherDisplayName>biglexj</PublisherDisplayName>
    <Logo>Image\StoreLogo.png</Logo>
  </Properties>

  <!-- Requisitos del sistema -->
  <Dependencies>
    <TargetDeviceFamily 
      Name="Windows.Desktop"
      MinVersion="10.0.17763.0"
      MaxVersionTested="10.0.19041.0" />
  </Dependencies>

  <!-- Idioma -->
  <Resources>
    <Resource Language="es-ES"/>
  </Resources>

  <!-- Aplicación -->
  <Applications>
    <Application 
      Id="App"
      Executable="WinTTS.exe"
      EntryPoint="Windows.FullTrustApplication">
      
      <uap:VisualElements
        DisplayName="WinTTS"
        Description="WinTTS Application"
        BackgroundColor="transparent"
        Square150x150Logo="Image\Square150x150Logo.png"
        Square44x44Logo="Image\Square44x44Logo.png">
        <uap:DefaultTile Wide310x150Logo="Image\Wide310x150Logo.png" />
      </uap:VisualElements>
    </Application>
  </Applications>

  <!-- Capacidades -->
  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
</Package>
```

**Campos importantes**:
- **Name**: Identificador único (no cambiar después de publicar)
- **Publisher**: Debe coincidir con el certificado
- **Version**: Incrementar en cada actualización
- **Language**: Código de idioma válido (es-ES, en-US, etc.)

### Paso 3: Compilar y Empaquetar

```powershell
.\scripts\build-msix.ps1
```

**Este script hace**:
1. Verifica que MSBuild y makeappx estén disponibles
2. Limpia compilaciones anteriores (bin/, obj/)
3. Compila el proyecto en modo Release
4. Copia archivos al directorio de empaquetado
5. Actualiza el manifest (reemplaza tokens)
6. Genera el paquete MSIX

**Resultado**: `publish/msix/WinTTS.msix` (~0.6 MB, sin firmar)

---

## Certificados y Firma

### ¿Por qué se necesita un certificado?

Windows **requiere** que todos los paquetes MSIX estén firmados digitalmente para:
- Verificar la identidad del desarrollador
- Garantizar que el paquete no ha sido modificado
- Proteger a los usuarios de software malicioso

### Tipos de Certificados

#### 1. Certificado de Desarrollo (Autofirmado)

**Uso**: Pruebas locales en tu PC

**Características**:
- ✅ Gratis
- ✅ Fácil de crear
- ❌ Solo funciona en tu PC (después de instalarlo)
- ❌ No es válido para distribución pública

**Crear y firmar**:
```powershell
.\scripts\sign-package.ps1
```

Esto crea:
- `WinTTS_Dev_Certificate.pfx` - Certificado autofirmado
- Firma el paquete MSIX con este certificado

#### 2. Certificado de Microsoft Store

**Uso**: Distribución pública a través de la Store

**Características**:
- ✅ Confianza automática en todos los PCs
- ✅ Microsoft firma automáticamente tu paquete
- ✅ No necesitas gestionar certificados
- ❌ Requiere cuenta de desarrollador ($19 USD/año)

**Proceso**:
1. Subes el paquete MSIX (sin firmar o firmado con certificado de desarrollo)
2. Microsoft lo firma con su certificado oficial
3. Los usuarios pueden instalarlo sin problemas

### Cadena de Confianza

#### Certificado de Desarrollo:
```
WinTTS.msix (firmado)
    ↓
WinTTS_Dev_Certificate.pfx (autofirmado)
    ↓
Cert:\LocalMachine\Root (instalado manualmente)
    ↓
Windows confía ✅
```

#### Certificado de Microsoft Store:
```
WinTTS.msix (firmado por Microsoft)
    ↓
Microsoft Store Certificate
    ↓
Microsoft Root CA (preinstalado en Windows)
    ↓
Windows confía ✅ (automáticamente)
```

---

## Instalación Local

### Para Pruebas en tu PC

#### Paso 1: Firmar el Paquete

```powershell
.\scripts\sign-package.ps1
```

Esto genera `WinTTS_Dev_Certificate.pfx` y firma el paquete.

#### Paso 2: Instalar el Certificado

```powershell
# Requiere permisos de administrador
sudo pwsh -File .\scripts\install-dev-cert.ps1
```

**Alternativa manual**:
1. Doble clic en `WinTTS_Dev_Certificate.pfx`
2. Selecciona "Equipo local" (requiere admin)
3. Deja la contraseña en blanco
4. Selecciona "Entidades de certificación raíz de confianza"
5. Finalizar

#### Paso 3: Instalar la Aplicación

```powershell
Add-AppxPackage ".\publish\msix\WinTTS.msix"
```

#### Verificar Instalación

```powershell
Get-AppxPackage *WinTTS*
```

#### Ejecutar la Aplicación

Busca "WinTTS" en el menú Inicio de Windows.

#### Desinstalar

```powershell
Get-AppxPackage *WinTTS* | Remove-AppxPackage
```

---

## Publicación en Microsoft Store

### Requisitos

1. **Cuenta de desarrollador de Microsoft**
   - Individual: $19 USD/año
   - Empresa: $99 USD/año
   - Registro: https://partner.microsoft.com/dashboard

2. **Paquete MSIX generado**

### Proceso Paso a Paso

#### 1. Reservar el Nombre de la Aplicación

1. Ve a [Microsoft Partner Center](https://partner.microsoft.com/dashboard)
2. Click en "Aplicaciones y juegos" → "Nueva aplicación"
3. Reserva el nombre "WinTTS"
4. Microsoft te proporcionará valores para el manifest

**Ejemplo de valores proporcionados**:
```xml
<Identity
  Name="12345biglexj.WinTTS"
  Publisher="CN=A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6"
  Version="1.0.0.0" />
```

#### 2. Actualizar el Manifest

Edita `Package.appxmanifest` con los valores de Microsoft:

```xml
<Identity
  Name="12345biglexj.WinTTS"
  Publisher="CN=A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6"
  Version="1.0.0.0" />

<Properties>
  <DisplayName>WinTTS</DisplayName>
  <PublisherDisplayName>biglexj</PublisherDisplayName>
  <Logo>Image\StoreLogo.png</Logo>
</Properties>
```

**⚠️ Importante**: Usa EXACTAMENTE los valores que Microsoft te proporciona.

#### 3. Regenerar el Paquete

```powershell
# Regenerar con los nuevos valores
.\scripts\build-msix.ps1

# NO es necesario firmar
# Microsoft lo firmará automáticamente
```

#### 4. Completar la Información de la Aplicación

En Partner Center, completa:

**Descripción**:
```
WinTTS es una aplicación de Text-to-Speech (TTS) para Windows que utiliza 
el motor de voz local del sistema. Convierte texto a voz de forma rápida 
y sencilla, ideal para accesibilidad, aprendizaje de idiomas, o simplemente 
para escuchar tus textos.

Características:
- Interfaz moderna y fácil de usar
- Utiliza las voces instaladas en Windows
- Control de volumen
- Soporte para formato Markdown
- Completamente gratis y sin anuncios
```

**Capturas de pantalla**:
- Mínimo: 1 captura
- Recomendado: 3-5 capturas
- Resolución: 1366×768 o superior
- Formato: PNG o JPG

**Categoría**: Productividad

**Clasificación por edades**: E (Everyone / Para todos)

**Política de privacidad**: 
- Si no recopilas datos: "Esta aplicación no recopila datos personales"
- Si tienes sitio web: URL de tu política de privacidad

#### 5. Subir el Paquete MSIX

1. Ve a "Envíos" → "Nuevo envío"
2. En "Paquetes", arrastra `publish/msix/WinTTS.msix`
3. Microsoft validará el paquete automáticamente
4. Espera a que aparezca ✅ "Validación exitosa"

#### 6. Enviar para Certificación

1. Revisa toda la información
2. Click en "Enviar para certificación"
3. Tiempo de revisión: **1-3 días hábiles**

#### 7. Publicación

Una vez aprobado:
- ✅ Se publica automáticamente en Microsoft Store
- ✅ Los usuarios pueden buscarlo como "WinTTS"
- ✅ Las actualizaciones se distribuyen automáticamente
- ✅ Aparece en tu perfil de desarrollador

### Monitoreo Post-Publicación

En Partner Center puedes ver:
- **Descargas**: Número de instalaciones
- **Calificaciones**: Estrellas y reseñas
- **Análisis**: Datos demográficos de usuarios
- **Informes de errores**: Crashes reportados

---

## Actualización de Versiones

### Incrementar Versión

Usa versionado semántico: `Major.Minor.Build.Revision`

**Cuándo incrementar**:
- **Major (1.x.x.x)**: Cambios incompatibles o rediseño completo
- **Minor (x.1.x.x)**: Nuevas funcionalidades
- **Build (x.x.1.x)**: Corrección de bugs
- **Revision (x.x.x.1)**: Builds internos (opcional)

### Proceso de Actualización

#### 1. Actualizar el Manifest

Edita `Package.appxmanifest`:

```xml
<!-- Antes -->
<Identity Version="1.0.0.0" />

<!-- Después -->
<Identity Version="1.0.1.0" />
```

#### 2. Actualizar Release Notes

Edita `RELEASE_NOTES.md`:

```markdown
## v1.0.1 (2026-01-25)

### Nuevas Características
- Agregado soporte para más voces

### Correcciones
- Corregido bug en el control de volumen

### Mejoras
- Optimizado rendimiento de la interfaz
```

#### 3. Regenerar el Paquete

```powershell
.\scripts\build-msix.ps1
```

#### 4. Publicar Actualización

**Para Microsoft Store**:
1. Ve a Partner Center
2. Crea un nuevo envío
3. Sube el nuevo paquete MSIX
4. Envía para certificación

**Para WinGet**:
```powershell
wingetcreate update biglexj.WinTTS --version 1.0.1 --urls https://github.com/biglexj/WinTTS/releases/download/v1.0.1/WinTTS.msix --submit
```

### Actualizaciones Automáticas

**Microsoft Store**:
- Los usuarios reciben actualizaciones automáticamente
- No necesitan hacer nada
- Se actualiza en segundo plano

**WinGet**:
- Los usuarios pueden actualizar con: `winget upgrade biglexj.WinTTS`
- O configurar actualizaciones automáticas

---

## Solución de Problemas

### Error: "makeappx.exe no reconocido"

**Causa**: El Windows SDK no está en el PATH.

**Solución**:
```powershell
# Agregar permanentemente (requiere admin)
sudo pwsh -File .\scripts\add-sdk-to-path.ps1

# O temporalmente (solo sesión actual)
$env:Path += ';C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64'
```

---

### Error: "Missing a required footprint file"

**Causa**: Faltan los assets de imágenes.

**Solución**:
```powershell
.\scripts\generate-assets.ps1
```

---

### Error: "0x800B0109 - certificado raíz no compatible"

**Causa**: El certificado no está instalado en el sistema.

**Solución**:
```powershell
sudo pwsh -File .\scripts\install-dev-cert.ps1
```

---

### Error: "0x80073CF6 - El paquete no se pudo registrar"

**Causa**: El idioma en el manifest no es válido.

**Solución**:
Edita `Package.appxmanifest`:
```xml
<!-- Incorrecto -->
<Resource Language="x-generate"/>

<!-- Correcto -->
<Resource Language="es-ES"/>
```

Luego regenera:
```powershell
.\scripts\build-msix.ps1
.\scripts\sign-package.ps1
```

---

### Error: "Publisher mismatch"

**Causa**: El Publisher en el manifest no coincide con el certificado.

**Solución**:

1. Verifica el Publisher en `Package.appxmanifest`:
   ```xml
   <Identity Publisher="CN=biglexj" />
   ```

2. Verifica el certificado:
   ```powershell
   Get-PfxCertificate .\WinTTS_Dev_Certificate.pfx | Select-Object Subject
   ```

3. Deben coincidir EXACTAMENTE (incluyendo mayúsculas/minúsculas)

---

### El paquete se instala pero no aparece en el menú Inicio

**Causa**: Problema con los assets de imágenes o el manifest.

**Solución**:
```powershell
# Regenerar assets
.\scripts\generate-assets.ps1

# Recompilar
.\scripts\build-msix.ps1
.\scripts\sign-package.ps1

# Reinstalar
Get-AppxPackage *WinTTS* | Remove-AppxPackage
Add-AppxPackage ".\publish\msix\WinTTS.msix"
```

---

### Error en Microsoft Store: "Package validation failed"

**Causas comunes**:
- Publisher no coincide con el de la cuenta
- Versión ya existe
- Faltan assets requeridos

**Solución**:
1. Verifica que uses los valores EXACTOS de Microsoft
2. Incrementa la versión
3. Asegúrate de tener todos los assets

---

## Comandos Útiles

### Gestión de Paquetes

```powershell
# Listar aplicaciones instaladas
Get-AppxPackage *WinTTS*

# Ver detalles completos
Get-AppxPackage *WinTTS* | Format-List

# Desinstalar
Get-AppxPackage *WinTTS* | Remove-AppxPackage

# Ver logs de instalación
Get-AppPackageLog -ActivityID <ActivityID>
```

### Gestión de Certificados

```powershell
# Listar certificados del sistema
Get-ChildItem Cert:\LocalMachine\Root

# Buscar certificado específico
Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*biglexj*" }

# Ver detalles de un certificado
Get-PfxCertificate .\WinTTS_Dev_Certificate.pfx | Format-List

# Eliminar certificado (requiere admin)
Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -eq "CN=biglexj" } | Remove-Item
```

### Verificación de Firma

```powershell
# Verificar si un paquete está firmado
Get-AuthenticodeSignature .\publish\msix\WinTTS.msix

# Ver detalles de la firma
Get-AuthenticodeSignature .\publish\msix\WinTTS.msix | Format-List
```

---

## Mejores Prácticas

### Desarrollo

1. **Versionado consistente**
   - Usa versionado semántico
   - Incrementa la versión en cada build
   - Documenta cambios en RELEASE_NOTES.md

2. **Testing**
   - Prueba localmente antes de publicar
   - Verifica en diferentes versiones de Windows
   - Prueba la instalación/desinstalación

3. **Seguridad**
   - No compartas el archivo .pfx en repositorios públicos
   - Usa `.gitignore` para excluir certificados
   - Para la Store, Microsoft gestiona los certificados

### Publicación

1. **Información completa**
   - Descripción clara y detallada
   - Capturas de pantalla de calidad
   - Política de privacidad (si aplica)

2. **Actualizaciones regulares**
   - Corrige bugs rápidamente
   - Agrega nuevas funcionalidades
   - Mantén la aplicación actualizada

3. **Comunicación**
   - Responde a reseñas de usuarios
   - Documenta cambios en cada versión
   - Mantén un changelog actualizado

---

## Recursos Adicionales

### Documentación Oficial

- [MSIX Documentation](https://docs.microsoft.com/windows/msix/)
- [Package a desktop app using Visual Studio](https://docs.microsoft.com/windows/msix/desktop/desktop-to-uwp-packaging-dot-net)
- [Sign an MSIX package](https://docs.microsoft.com/windows/msix/package/sign-app-package-using-signtool)
- [Microsoft Store Policies](https://docs.microsoft.com/windows/uwp/publish/store-policies)

### Herramientas

- [Windows SDK](https://developer.microsoft.com/windows/downloads/windows-sdk/)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- [Microsoft Partner Center](https://partner.microsoft.com/dashboard)

### Comunidad

- [MSIX Tech Community](https://techcommunity.microsoft.com/t5/msix/ct-p/MSIX)
- [Windows Dev Center](https://developer.microsoft.com/windows/)

---

**Creado**: 20/01/2026  
**Autor**: biglexj  
**Proyecto**: WinTTS  
**Versión**: 1.0.0
