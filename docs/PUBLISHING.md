# Guía de Publicación de WinTTS

Esta guía explica cómo generar diferentes tipos de paquetes para distribuir WinTTS.

## Publicación automatizada recomendada

El flujo principal sincroniza la versión, compila, ejecuta pruebas, genera el EXE portable y su SHA-256, valida los manifiestos WinGet y, fuera del modo local, crea el commit, tag y GitHub Release:

```powershell
# Ensayo completo sin modificar Git ni GitHub
.\build-release.ps1 -Version 1.0.1 -LocalOnly

# Publicación del binario ya validado localmente
.\build-release.ps1 -Version 1.0.1 -SkipBuild
```

El segundo comando requiere autenticación activa de Git y GitHub CLI. Los certificados `.pfx` nunca se adjuntan al release.

## 📋 Tabla de Contenidos

1. [Ejecutable Portable (EXE)](#ejecutable-portable-exe)
2. [Paquete MSIX](#paquete-msix)
3. [Comparación de Métodos](#comparación-de-métodos)
4. [Publicación en WinGet](#publicación-en-winget)
5. [Publicación en Microsoft Store](#publicación-en-microsoft-store)

---

## Ejecutable Portable (EXE)

### ✅ Ventajas
- ✅ **Más simple**: No requiere Windows SDK
- ✅ **Rápido**: Ideal para pruebas y desarrollo
- ✅ **Portable**: Un solo archivo .exe
- ✅ **Compatible**: Funciona en cualquier Windows 10/11

### ❌ Desventajas
- ❌ No se puede publicar en Microsoft Store
- ❌ No tiene actualizaciones automáticas
- ❌ Tamaño más grande (~150 MB con .NET incluido)
- ❌ No está aislado (sandbox)

### 🚀 Método 1: Usando el Script (Recomendado)

```powershell
# Generar ejecutable portable
.\scripts\build-exe.ps1
```

El ejecutable se generará en: `publish/exe/WinTTS.exe`

### 🚀 Método 2: Comando Manual

```powershell
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:PublishReadyToRun=true --output ./publish/exe
```

### Explicación de Parámetros

- `-c Release`: Compila en modo Release (optimizado)
- `-r win-x64`: Runtime para Windows 64 bits
- `--self-contained true`: Incluye .NET runtime (no requiere instalación)
- `-p:PublishSingleFile=true`: Empaqueta todo en un solo archivo
- `-p:IncludeNativeLibrariesForSelfExtract=true`: Incluye librerías nativas
- `-p:PublishReadyToRun=true`: Precompila para mejor rendimiento
- `--output ./publish/exe`: Directorio de salida

### Opciones del Script

```powershell
# Ejecutable self-contained (incluye .NET)
.\scripts\build-exe.ps1

# Ejecutable framework-dependent (requiere .NET instalado, más pequeño)
.\scripts\build-exe.ps1 -SelfContained:$false

# Para Windows 32 bits
.\scripts\build-exe.ps1 -Runtime win-x86

# Modo Debug
.\scripts\build-exe.ps1 -Configuration Debug
```

### 📦 Resultado

- **Ubicación**: `publish/exe/WinTTS.exe`
- **Tamaño**: ~150 MB (self-contained) o ~1 MB (framework-dependent)
- **Requisitos**: Windows 10/11 (64 bits)

---

## Paquete MSIX

### ✅ Ventajas
- ✅ **Microsoft Store**: Se puede publicar en la Store
- ✅ **Actualizaciones automáticas**: A través de la Store
- ✅ **Instalación limpia**: No deja archivos residuales
- ✅ **Sandbox**: Aplicación aislada y segura
- ✅ **Tamaño pequeño**: ~0.6 MB

### ❌ Desventajas
- ❌ Requiere Windows SDK
- ❌ Requiere certificado digital
- ❌ Proceso más complejo

### 🚀 Generación del Paquete MSIX

#### Paso 1: Generar Assets de Imágenes (solo primera vez)

```powershell
.\scripts\generate-assets.ps1
```

#### Paso 2: Compilar y Empaquetar

```powershell
.\scripts\build-msix.ps1
```

#### Paso 3: Firmar el Paquete

```powershell
.\scripts\sign-package.ps1
```

#### Paso 4: Instalar Certificado (solo primera vez, requiere admin)

```powershell
sudo pwsh -File .\scripts\install-dev-cert.ps1
```

#### Paso 5: Instalar la Aplicación (para pruebas locales)

```powershell
Add-AppxPackage ".\publish\msix\WinTTS.msix"
```

### 📦 Resultado

- **Ubicación**: `publish/msix/WinTTS.msix`
- **Tamaño**: ~0.6 MB
- **Requisitos**: Windows 10 versión 1809 o superior

### 📚 Documentación Detallada

Para más información sobre el proceso MSIX, consulta:
- `docs/MSIX_PACKAGING.md` - Guía rápida
- `docs/CERTIFICACION_Y_SCRIPTS.md` - Guía detallada de certificación

---

## Comparación de Métodos

| Característica      | EXE Portable    | MSIX                      |
| ------------------- | --------------- | ------------------------- |
| **Simplicidad**     | ⭐⭐⭐⭐⭐ Muy fácil | ⭐⭐⭐ Moderado              |
| **Tamaño**          | ~150 MB         | ~0.6 MB                   |
| **Requisitos**      | Solo .NET SDK   | Windows SDK + Certificado |
| **Microsoft Store** | ❌ No            | ✅ Sí                      |
| **WinGet**          | ✅ Sí            | ✅ Sí                      |
| **Actualizaciones** | ❌ Manual        | ✅ Automáticas (Store)     |
| **Instalación**     | ❌ Manual        | ✅ Limpia                  |
| **Sandbox**         | ❌ No            | ✅ Sí                      |
| **Firma digital**   | ❌ Opcional      | ✅ Requerida               |
| **Tiempo de build** | ~30 segundos    | ~1-2 minutos              |

### ¿Cuál usar?

**Usa EXE Portable si**:
- ✅ Quieres probar rápidamente
- ✅ Distribución directa (descarga desde GitHub)
- ✅ No necesitas Microsoft Store
- ✅ Simplicidad es prioridad

**Usa MSIX si**:
- ✅ Quieres publicar en Microsoft Store
- ✅ Quieres actualizaciones automáticas
- ✅ Necesitas instalación/desinstalación limpia
- ✅ Quieres aprovechar el sandbox de Windows

---

## Publicación en WinGet

WinGet acepta tanto paquetes EXE como MSIX.

### Estado Actual del Proyecto

- ✅ **PR Enviado**: #331954 (con paquete EXE)
- ⏳ **Estado**: Pendiente de aprobación
- 🔄 **Próximo paso**: Actualizar a MSIX cuando sea aprobado

### Actualizar de EXE a MSIX en WinGet

Una vez que el PR actual sea aprobado, puedes actualizar el paquete a MSIX:

#### 1. Generar el paquete MSIX

```powershell
.\scripts\build-msix.ps1
.\scripts\sign-package.ps1
```

#### 2. Subir el MSIX a GitHub Releases

```powershell
# Crear un nuevo release en GitHub
# Subir el archivo: publish/msix/WinTTS.msix
```

#### 3. Actualizar el manifest de WinGet

```powershell
# Usar wingetcreate para actualizar
wingetcreate update biglexj.WinTTS --version 1.0.1 --urls https://github.com/biglexj/WinTTS/releases/download/v1.0.1/WinTTS.msix --submit
```

#### 4. Cambiar el instalador en el manifest

El manifest cambiará de:

```yaml
# Antes (EXE)
InstallerType: exe
InstallerSwitches:
  Silent: /S
  SilentWithProgress: /S
```

A:

```yaml
# Después (MSIX)
InstallerType: msix
SignatureSha256: <hash del certificado>
```

### Ventajas de MSIX en WinGet

- ✅ Instalación más limpia
- ✅ Desinstalación automática
- ✅ Actualizaciones más confiables
- ✅ Menor tamaño de descarga

---

## Publicación en Microsoft Store

### Requisitos Previos

1. **Cuenta de desarrollador de Microsoft**
   - Costo: $19 USD/año (individual) o $99 USD/año (empresa)
   - Registro: [Microsoft Partner Center](https://partner.microsoft.com/dashboard)

2. **Paquete MSIX generado**
   ```powershell
   .\scripts\build-msix.ps1
   ```

### Proceso de Publicación

#### 1. Reservar el Nombre de la Aplicación

1. Ve a [Microsoft Partner Center](https://partner.microsoft.com/dashboard)
2. Click en "Aplicaciones y juegos" → "Nueva aplicación"
3. Reserva el nombre "WinTTS"
4. Microsoft te proporcionará valores para el manifest:

```xml
<Identity
  Name="12345biglexj.WinTTS"
  Publisher="CN=A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6"
  Version="1.0.0.0" />
```

#### 2. Actualizar el Manifest

Edita `Package.appxmanifest` con los valores proporcionados por Microsoft:

```xml
<Identity
  Name="12345biglexj.WinTTS"
  Publisher="CN=A1B2C3D4-E5F6-G7H8-I9J0-K1L2M3N4O5P6"
  Version="1.0.0.0" />
```

#### 3. Regenerar el Paquete

```powershell
# Regenerar con los nuevos valores
.\scripts\build-msix.ps1

# NO es necesario firmar (Microsoft lo hará)
```

#### 4. Completar la Información de la Aplicación

En Partner Center, completa:

- **Descripción**: Descripción detallada de WinTTS
- **Capturas de pantalla**: Al menos 1 captura (recomendado: 3-5)
- **Categoría**: Productividad
- **Clasificación por edades**: E (Everyone)
- **Política de privacidad**: URL o declaración (si aplica)

#### 5. Subir el Paquete MSIX

1. Ve a "Envíos" → "Nuevo envío"
2. En "Paquetes", arrastra `WinTTS.msix`
3. Microsoft validará el paquete automáticamente

#### 6. Enviar para Certificación

1. Revisa toda la información
2. Click en "Enviar para certificación"
3. Tiempo de revisión: 1-3 días hábiles

#### 7. Publicación

Una vez aprobado:
- ✅ Se publica automáticamente en Microsoft Store
- ✅ Los usuarios pueden instalarlo buscando "WinTTS"
- ✅ Las actualizaciones se distribuyen automáticamente

### Actualizaciones Futuras

Para publicar una nueva versión:

1. Incrementa la versión en `Package.appxmanifest`:
   ```xml
   <Identity Version="1.0.1.0" />
   ```

2. Regenera el paquete:
   ```powershell
   .\scripts\build-msix.ps1
   ```

3. Crea un nuevo envío en Partner Center
4. Sube el nuevo paquete
5. Envía para certificación

---

## Scripts Disponibles

### Generación de Paquetes

| Script                 | Propósito                  | Requiere Admin | Tiempo |
| ---------------------- | -------------------------- | -------------- | ------ |
| `build-exe.ps1`        | Genera ejecutable portable | ❌ No           | ~30s   |
| `generate-assets.ps1`  | Genera imágenes PNG        | ❌ No           | ~5s    |
| `build-msix.ps1`       | Compila y empaqueta MSIX   | ❌ No           | ~1m    |
| `sign-package.ps1`     | Firma el paquete MSIX      | ❌ No           | ~10s   |
| `install-dev-cert.ps1` | Instala certificado        | ✅ Sí           | ~5s    |

### Flujo de Trabajo Recomendado

#### Para Desarrollo y Pruebas Rápidas

```powershell
# Generar EXE portable
.\scripts\build-exe.ps1

# Ejecutar directamente
.\publish\exe\WinTTS.exe
```

#### Para Publicación en WinGet (EXE)

```powershell
# 1. Generar EXE
.\scripts\build-exe.ps1

# 2. Crear release en GitHub
# 3. Actualizar manifest de WinGet
```

#### Para Publicación en Microsoft Store (MSIX)

```powershell
# 1. Generar assets (solo primera vez)
.\scripts\generate-assets.ps1

# 2. Compilar y empaquetar
.\scripts\build-msix.ps1

# 3. Subir a Partner Center (sin firmar)
```

#### Para Pruebas Locales (MSIX)

```powershell
# 1. Compilar y empaquetar
.\scripts\build-msix.ps1

# 2. Firmar
.\scripts\sign-package.ps1

# 3. Instalar certificado (solo primera vez)
sudo pwsh -File .\scripts\install-dev-cert.ps1

# 4. Instalar aplicación
Add-AppxPackage ".\publish\msix\WinTTS.msix"
```

---

## Versionado

Usa versionado semántico: `Major.Minor.Patch.Revision`

### Incrementar Versión

1. **Edita `Package.appxmanifest`** (para MSIX):
   ```xml
   <Identity Version="1.0.1.0" />
   ```

2. **Edita `WinTTS.csproj`** (opcional, para EXE):
   ```xml
   <PropertyGroup>
     <Version>1.0.1</Version>
   </PropertyGroup>
   ```

3. **Actualiza `RELEASE_NOTES.md`** con los cambios

### Cuándo Incrementar

- **Major (1.x.x.x)**: Cambios incompatibles o rediseño completo
- **Minor (x.1.x.x)**: Nuevas funcionalidades
- **Patch (x.x.1.x)**: Corrección de bugs
- **Revision (x.x.x.1)**: Builds internos (opcional)

---

## Recursos Adicionales

### Documentación del Proyecto

- `docs/MSIX_PACKAGING.md` - Guía de empaquetado MSIX
- `docs/CERTIFICACION_Y_SCRIPTS.md` - Guía detallada de certificación
- `RELEASE_NOTES.md` - Historial de cambios

### Enlaces Útiles

- [Microsoft Partner Center](https://partner.microsoft.com/dashboard)
- [WinGet Package Repository](https://github.com/microsoft/winget-pkgs)
- [.NET Publishing Documentation](https://docs.microsoft.com/dotnet/core/deploying/)
- [MSIX Documentation](https://docs.microsoft.com/windows/msix/)

---

**Última actualización**: 20/01/2026  
**Autor**: biglexj  
**Proyecto**: WinTTS  
**Versión**: 1.0.0
