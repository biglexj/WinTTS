# Referencia Completa de Scripts de WinTTS

## build-release.ps1

Flujo integral para una versión pública. Lee la versión de `WinTTS.csproj`, sincroniza el manifiesto, ejecuta build y pruebas, crea el EXE self-contained, calcula SHA-256, actualiza y valida WinGet, y finalmente publica commit, tag y GitHub Release.

```powershell
.\build-release.ps1 -LocalOnly
.\build-release.ps1 -SkipBuild
```

`-LocalOnly` omite Git y GitHub. `-SkipBuild` reutiliza exclusivamente `publish/exe/WinTTS.exe`, útil después de un ensayo local exitoso.

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Scripts para MSIX](#scripts-para-msix)
3. [Scripts para EXE Portable](#scripts-para-exe-portable)
4. [Scripts de Configuración](#scripts-de-configuración)
5. [Comparación de Métodos](#comparación-de-métodos)
6. [Flujos de Trabajo](#flujos-de-trabajo)

---

## Introducción

Este documento es una referencia completa de todos los scripts disponibles en el proyecto WinTTS para generar paquetes de distribución.

### Tipos de Paquetes

WinTTS puede distribuirse de dos formas:

1. **MSIX** - Paquete moderno para Microsoft Store
2. **EXE Portable** - Ejecutable autónomo para distribución directa

### Ubicación de los Scripts

Todos los scripts están en la carpeta `scripts/`:

```
scripts/
├── generate-assets.ps1      # Genera imágenes PNG para MSIX
├── build-msix.ps1           # Compila y empaqueta MSIX
├── sign-package.ps1         # Firma el paquete MSIX
├── install-dev-cert.ps1     # Instala certificado de desarrollo
├── create-and-sign.ps1      # Todo-en-uno para MSIX
├── build-exe.ps1            # Genera ejecutable portable
└── add-sdk-to-path.ps1      # Configura PATH del SDK
```

---

## Scripts para MSIX

### 1. generate-assets.ps1

**Propósito**: Genera automáticamente los assets de imágenes PNG requeridos por el paquete MSIX.

#### Qué hace

1. Lee el archivo `Icon/app_icon.ico`
2. Convierte el ícono a diferentes tamaños PNG usando System.Drawing
3. Guarda las imágenes en la carpeta `Image/`

#### Assets generados

| Archivo                 | Tamaño     | Uso                                 |
| ----------------------- | ---------- | ----------------------------------- |
| `Square44x44Logo.png`   | 44×44 px   | Ícono pequeño en la barra de tareas |
| `Square150x150Logo.png` | 150×150 px | Ícono del menú Inicio               |
| `Wide310x150Logo.png`   | 310×150 px | Tile ancho del menú Inicio          |
| `StoreLogo.png`         | 50×50 px   | Logo para la Microsoft Store        |

#### Uso

```powershell
# Uso básico
.\scripts\generate-assets.ps1
```

#### Cuándo usarlo

- ✅ La primera vez que empaquetas la aplicación
- ✅ Cuando actualizas el ícono de la aplicación
- ✅ Si la carpeta `Image/` está vacía o corrupta

#### Tecnología utilizada

- **System.Drawing** de .NET para manipulación de imágenes
- **Conversión ICO → PNG** con interpolación bicúbica para alta calidad
- **Transparencia** preservada en las imágenes

#### Ejemplo de salida

```
==================================================
  WinTTS - Generador de Assets de Imágenes
==================================================

📁 Ícono encontrado: D:\Proyectos\biglexj\WinTTS\Icon\app_icon.ico

Generando assets de imágenes...

  Generando Square44x44Logo.png (44x44)... ✅
  Generando Square150x150Logo.png (150x150)... ✅
  Generando Wide310x150Logo.png (310x150)... ✅
  Generando StoreLogo.png (50x50)... ✅

==================================================
  ✅ Proceso completado: 4/4 assets generados
==================================================

Assets generados en: D:\Proyectos\biglexj\WinTTS\Image
```

---

### 2. build-msix.ps1

**Propósito**: Script maestro que compila el proyecto y genera el paquete MSIX completo.

#### Qué hace (paso a paso)

##### [1/6] Verificar herramientas
- Busca `MSBuild` usando `vswhere.exe`
- Busca `makeappx.exe` en el Windows SDK
- Busca `signtool.exe` en el Windows SDK
- Valida que todas las herramientas estén disponibles

##### [2/6] Limpiar compilaciones anteriores
- Elimina la carpeta `bin/`
- Elimina la carpeta `obj/`
- Asegura una compilación limpia sin archivos antiguos

##### [3/6] Compilar el proyecto
- Ejecuta `msbuild` con configuración Release
- Compila el proyecto C# WPF
- Genera el ejecutable `WinTTS.exe` y todas las DLLs

##### [4/6] Preparar archivos para el paquete
- Crea la carpeta `publish/msix/package/`
- Copia todos los archivos compilados (DLLs, EXE, etc.)
- Copia el manifest y lo actualiza:
  - Reemplaza `$targetnametoken$` con `WinTTS`
  - Guarda como `AppxManifest.xml`
- Copia la carpeta `Image/` con los logos

##### [5/6] Generar el paquete MSIX
- Ejecuta `makeappx.exe pack`
- Crea el archivo `WinTTS.msix` (sin firmar)
- Tamaño aproximado: ~0.6 MB

##### [6/6] Firmar el paquete (opcional)
- Busca el certificado `WinTTS_Certificate.pfx`
- Si existe, firma el paquete con `signtool.exe`
- Si no existe, muestra advertencia

#### Uso

```powershell
# Uso básico
.\scripts\build-msix.ps1

# Con parámetros personalizados
.\scripts\build-msix.ps1 -Configuration Release -Platform x64 -SdkVersion "10.0.26100.0"
```

#### Parámetros

| Parámetro        | Tipo   | Default      | Descripción            |
| ---------------- | ------ | ------------ | ---------------------- |
| `-Configuration` | string | Release      | Debug o Release        |
| `-Platform`      | string | x64          | x64, x86, AnyCPU       |
| `-SdkVersion`    | string | 10.0.26100.0 | Versión del SDK a usar |

#### Salida

- `publish/msix/WinTTS.msix` - Paquete MSIX (~0.6 MB)
- `publish/msix/package/` - Archivos desempaquetados (para debug)

#### Cuándo usarlo

- ✅ Cada vez que quieras generar una nueva versión del paquete
- ✅ Después de hacer cambios en el código
- ✅ Antes de publicar en la Store o WinGet

---

### 3. sign-package.ps1

**Propósito**: Crea un certificado de desarrollo y firma el paquete MSIX (sin permisos de admin).

#### Qué hace (paso a paso)

##### [1/2] Crear certificado de desarrollo
1. Busca si existe `WinTTS_Dev_Certificate.pfx` y lo elimina
2. Crea un certificado autofirmado con:
   - **Subject**: `CN=biglexj`
   - **KeyUsage**: DigitalSignature
   - **Ubicación**: `Cert:\CurrentUser\My` (almacén del usuario)
   - **Validez**: 1 año (por defecto)
   - **Algoritmo**: RSA 2048 bits
3. Exporta el certificado a `WinTTS_Dev_Certificate.pfx`
4. Contraseña: vacía (para facilitar el desarrollo)

##### [2/2] Firmar el paquete MSIX
1. Busca el paquete en `publish/msix/WinTTS.msix`
2. Ejecuta `signtool.exe sign` con:
   - Algoritmo: SHA256
   - Certificado: `WinTTS_Dev_Certificate.pfx`
   - Modo: Firma automática (`/a`)
3. Verifica que la firma sea exitosa

#### Uso

```powershell
# Uso básico (Publisher por defecto: CN=biglexj)
.\scripts\sign-package.ps1

# Con Publisher personalizado
.\scripts\sign-package.ps1 -Publisher "CN=MiNombre"

# Con contraseña para el certificado
.\scripts\sign-package.ps1 -Password "MiPassword123"
```

#### Parámetros

| Parámetro    | Tipo   | Default    | Descripción                        |
| ------------ | ------ | ---------- | ---------------------------------- |
| `-Publisher` | string | CN=biglexj | Nombre del publisher               |
| `-Password`  | string | (vacío)    | Contraseña para el certificado PFX |

#### Importante

- ⚠️ Este script NO requiere permisos de administrador
- ⚠️ El certificado se crea en el almacén del usuario, no del sistema
- ⚠️ Después de firmar, necesitas instalar el certificado con `install-dev-cert.ps1`

#### Cuándo usarlo

- ✅ Después de ejecutar `build-msix.ps1`
- ✅ Cuando el paquete no está firmado
- ✅ Si cambiaste el Publisher en el manifest

---

### 4. install-dev-cert.ps1

**Propósito**: Instala el certificado de desarrollo en el almacén de confianza del sistema.

#### Qué hace

1. **Verifica permisos de administrador**
   - Este script SÍ requiere permisos de admin
   - Si no los tiene, muestra instrucciones

2. **Busca el certificado**
   - Busca `WinTTS_Dev_Certificate.pfx` en la raíz del proyecto
   - Valida que exista

3. **Importa el certificado**
   - Importa a `Cert:\LocalMachine\Root`
   - Esto es el almacén "Entidades de certificación raíz de confianza"
   - Hace que Windows confíe en el certificado

#### Uso

```powershell
# Opción 1: PowerShell como Administrador
.\scripts\install-dev-cert.ps1

# Opción 2: Con sudo (si lo tienes configurado)
sudo pwsh -File .\scripts\install-dev-cert.ps1
```

#### ¿Por qué requiere admin?

- Modificar el almacén `LocalMachine\Root` requiere permisos elevados
- Es una medida de seguridad de Windows
- Solo los administradores pueden agregar certificados de confianza al sistema

#### Cuándo usarlo

- ✅ Después de ejecutar `sign-package.ps1`
- ✅ Antes de instalar la aplicación con `Add-AppxPackage`
- ✅ Solo necesitas ejecutarlo UNA VEZ por certificado

#### Alternativa manual

Si no puedes usar el script:
1. Doble clic en `WinTTS_Dev_Certificate.pfx`
2. Selecciona "Equipo local" (requiere admin)
3. Deja la contraseña en blanco
4. Selecciona "Entidades de certificación raíz de confianza"
5. Finalizar

---

### 5. create-and-sign.ps1

**Propósito**: Script todo-en-uno que crea el certificado, firma el paquete E instala el certificado.

#### Qué hace

Combina las funciones de:
- `sign-package.ps1` - Crear certificado y firmar
- `install-dev-cert.ps1` - Instalar certificado

Todo en un solo paso.

#### Uso

```powershell
# Con sudo
sudo pwsh -File .\scripts\create-and-sign.ps1

# O en PowerShell como Administrador
.\scripts\create-and-sign.ps1
```

#### Parámetros

| Parámetro    | Tipo   | Default            | Descripción                    |
| ------------ | ------ | ------------------ | ------------------------------ |
| `-Publisher` | string | CN=biglexj         | Nombre del publisher           |
| `-Password`  | string | (vacío)            | Contraseña para el certificado |
| `-CertName`  | string | WinTTS_Certificate | Nombre del archivo .pfx        |

#### Cuándo usarlo

- ✅ Si prefieres un solo comando para todo
- ✅ En scripts de CI/CD
- ✅ Para configuración inicial rápida

#### Nota

Este script es más conveniente pero menos flexible que usar los scripts individuales.

---

## Scripts para EXE Portable

### 6. build-exe.ps1

**Propósito**: Genera un ejecutable portable de WinTTS sin necesidad del Windows SDK.

#### Qué hace (paso a paso)

##### [1/3] Verificar herramientas
- Verifica que .NET SDK esté instalado
- Muestra la versión de .NET disponible
- Si no está instalado, muestra enlace de descarga

##### [2/3] Limpiar compilaciones anteriores
- Elimina las carpetas `bin/` y `obj/`
- Asegura una compilación limpia

##### [3/3] Compilar y publicar
- Ejecuta `dotnet publish` con parámetros optimizados
- Genera un ejecutable portable en `publish/exe/`
- Incluye el runtime de .NET (self-contained)
- Empaqueta todo en un solo archivo

#### Uso

```powershell
# Uso básico (self-contained, archivo único)
.\scripts\build-exe.ps1

# Framework-dependent (requiere .NET instalado, más pequeño)
.\scripts\build-exe.ps1 -SelfContained:$false

# Para Windows 32 bits
.\scripts\build-exe.ps1 -Runtime win-x86

# Modo Debug
.\scripts\build-exe.ps1 -Configuration Debug

# Sin empaquetar en archivo único
.\scripts\build-exe.ps1 -SingleFile:$false
```

#### Parámetros

| Parámetro        | Tipo   | Default | Descripción                   |
| ---------------- | ------ | ------- | ----------------------------- |
| `-Configuration` | string | Release | Debug o Release               |
| `-Runtime`       | string | win-x64 | win-x64, win-x86, win-arm64   |
| `-SelfContained` | switch | $true   | Incluir .NET runtime          |
| `-SingleFile`    | switch | $true   | Empaquetar en un solo archivo |

#### Salida

- `publish/exe/WinTTS.exe` - Ejecutable portable (~150 MB)
- `publish/exe/WinTTS.pdb` - Símbolos de depuración (opcional)

#### Cuándo usarlo

- ✅ Para pruebas rápidas durante el desarrollo
- ✅ Para distribuir en GitHub Releases
- ✅ Para publicar en WinGet (antes de migrar a MSIX)
- ✅ Cuando no necesitas Microsoft Store

#### Tecnología utilizada

##### Self-Contained Deployment

El modo self-contained incluye el runtime de .NET dentro del ejecutable:

**Ventajas**:
- ✅ Los usuarios NO necesitan instalar .NET
- ✅ Funciona en cualquier Windows 10/11
- ✅ Versión específica de .NET garantizada

**Desventajas**:
- ❌ Tamaño más grande (~150 MB)
- ❌ Cada actualización de .NET requiere rebuild

##### Single-File Deployment

El modo single-file empaqueta todo en un solo .exe:

**Cómo funciona**:
1. El ejecutable contiene todos los archivos comprimidos
2. Al ejecutarse, extrae los archivos a una carpeta temporal
3. Ejecuta la aplicación desde la carpeta temporal
4. Al cerrar, limpia los archivos temporales

**Parámetros de optimización**:
- `PublishSingleFile=true` - Empaqueta en un solo archivo
- `IncludeNativeLibrariesForSelfExtract=true` - Incluye DLLs nativas
- `PublishReadyToRun=true` - Precompila para mejor rendimiento inicial

---

## Scripts de Configuración

### 7. add-sdk-to-path.ps1

**Propósito**: Agrega el Windows SDK al PATH del sistema de forma permanente.

#### Qué hace

1. **Verifica permisos de administrador**
   - Requiere admin para modificar variables del sistema

2. **Busca el SDK**
   - Busca en `C:\Program Files (x86)\Windows Kits\10\bin\`
   - Detecta la versión instalada (10.0.26100.0 o 10.0.22621.0)

3. **Agrega al PATH**
   - Modifica la variable de entorno `Path` del sistema
   - Agrega la ruta del SDK (arquitectura x64)

4. **Verifica la instalación**
   - Confirma que la ruta se agregó correctamente

#### Uso

```powershell
# Con sudo
sudo pwsh -File .\scripts\add-sdk-to-path.ps1

# Con parámetros personalizados
sudo pwsh -File .\scripts\add-sdk-to-path.ps1 -SdkVersion "10.0.22621.0" -Architecture "x86"
```

#### Parámetros

| Parámetro       | Tipo   | Default      | Descripción     |
| --------------- | ------ | ------------ | --------------- |
| `-SdkVersion`   | string | 10.0.26100.0 | Versión del SDK |
| `-Architecture` | string | x64          | x64, x86, arm64 |

#### Cuándo usarlo

- ✅ Después de instalar Visual Studio Build Tools
- ✅ Si `makeappx.exe` no se reconoce en la terminal
- ✅ Solo necesitas ejecutarlo UNA VEZ

#### Alternativa temporal

Si no quieres modificar el PATH del sistema:
```powershell
$env:Path += ';C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64'
```

---

## Comparación de Métodos

### EXE Portable vs MSIX

| Aspecto                         | EXE Portable    | MSIX                   |
| ------------------------------- | --------------- | ---------------------- |
| **Script principal**            | `build-exe.ps1` | `build-msix.ps1`       |
| **Herramientas requeridas**     | Solo .NET SDK   | .NET SDK + Windows SDK |
| **Certificado**                 | ❌ No requerido  | ✅ Requerido            |
| **Tamaño del paquete**          | ~150 MB         | ~0.6 MB                |
| **Tiempo de build**             | ~30 segundos    | ~1-2 minutos           |
| **Complejidad**                 | ⭐ Baja          | ⭐⭐⭐ Media              |
| **Microsoft Store**             | ❌ No compatible | ✅ Compatible           |
| **WinGet**                      | ✅ Compatible    | ✅ Compatible           |
| **Actualizaciones automáticas** | ❌ No            | ✅ Sí (Store)           |
| **Instalación**                 | ❌ Manual        | ✅ Limpia               |
| **Desinstalación**              | ❌ Manual        | ✅ Automática           |
| **Sandbox**                     | ❌ No            | ✅ Sí                   |
| **Requisitos del usuario**      | Windows 10/11   | Windows 10 1809+       |

### Tabla de Scripts por Método

| Método                     | Scripts Necesarios                                                                        | Requiere Admin               |
| -------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------- |
| **EXE Portable**           | `build-exe.ps1`                                                                           | ❌ No                         |
| **MSIX (pruebas locales)** | `generate-assets.ps1`<br>`build-msix.ps1`<br>`sign-package.ps1`<br>`install-dev-cert.ps1` | ✅ Sí (solo install-dev-cert) |
| **MSIX (Microsoft Store)** | `generate-assets.ps1`<br>`build-msix.ps1`                                                 | ❌ No                         |

---

## Flujos de Trabajo

### Flujo 1: Desarrollo y Pruebas Rápidas (EXE)

```powershell
# Generar EXE portable para pruebas rápidas
.\scripts\build-exe.ps1

# Ejecutar directamente
.\publish\exe\WinTTS.exe
```

**Tiempo total**: ~30 segundos

---

### Flujo 2: Pruebas Locales (MSIX)

```powershell
# 1. Generar assets (solo primera vez)
.\scripts\generate-assets.ps1

# 2. Compilar y empaquetar
.\scripts\build-msix.ps1

# 3. Firmar
.\scripts\sign-package.ps1

# 4. Instalar certificado (solo primera vez, requiere admin)
sudo pwsh -File .\scripts\install-dev-cert.ps1

# 5. Instalar aplicación
Add-AppxPackage ".\publish\msix\WinTTS.msix"
```

**Tiempo total**: ~2-3 minutos (primera vez)  
**Tiempo total**: ~1 minuto (builds subsecuentes)

---

### Flujo 3: Publicación en GitHub (EXE)

```powershell
# 1. Generar EXE
.\scripts\build-exe.ps1

# 2. Crear release en GitHub
# 3. Subir publish/exe/WinTTS.exe

# Los usuarios descargan y ejecutan directamente
```

---

### Flujo 4: Publicación en WinGet (EXE → MSIX)

```powershell
# Fase 1: Publicar con EXE (actual)
.\scripts\build-exe.ps1
# Subir a GitHub y crear manifest de WinGet

# Fase 2: Migrar a MSIX (futuro)
.\scripts\build-msix.ps1
.\scripts\sign-package.ps1
# Actualizar manifest de WinGet para usar MSIX
```

---

### Flujo 5: Publicación en Microsoft Store (MSIX)

```powershell
# 1. Generar assets (solo primera vez)
.\scripts\generate-assets.ps1

# 2. Actualizar manifest con valores de Microsoft
# (Editar Package.appxmanifest con Name y Publisher de Partner Center)

# 3. Compilar y empaquetar
.\scripts\build-msix.ps1

# 4. NO firmar (Microsoft lo hará)

# 5. Subir a Partner Center
# 6. Completar información de la aplicación
# 7. Enviar para certificación
```

---

### Flujo 6: Actualización de Versión

```powershell
# 1. Actualizar versión en Package.appxmanifest
# <Identity Version="1.0.1.0" />

# 2. Actualizar RELEASE_NOTES.md

# 3. Regenerar paquete
.\scripts\build-msix.ps1  # Para MSIX
# O
.\scripts\build-exe.ps1   # Para EXE

# 4. Publicar actualización
# - Microsoft Store: Nuevo envío en Partner Center
# - WinGet: wingetcreate update
# - GitHub: Nuevo release
```

---

## Solución de Problemas

### Error: "dotnet no reconocido" (build-exe.ps1)

**Causa**: .NET SDK no está instalado.

**Solución**:
```powershell
# Descargar e instalar .NET SDK
# https://dotnet.microsoft.com/download
```

---

### Error: "makeappx.exe no reconocido" (build-msix.ps1)

**Causa**: Windows SDK no está en el PATH.

**Solución**:
```powershell
# Agregar permanentemente
sudo pwsh -File .\scripts\add-sdk-to-path.ps1

# O temporalmente
$env:Path += ';C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64'
```

---

### Error: "Access denied" (install-dev-cert.ps1)

**Causa**: No tienes permisos de administrador.

**Solución**:
```powershell
# Usa sudo
sudo pwsh -File .\scripts\install-dev-cert.ps1

# O abre PowerShell como Administrador
```

---

### El EXE es muy grande

**Causa**: Modo self-contained incluye .NET runtime completo.

**Solución**:
```powershell
# Generar en modo framework-dependent (más pequeño)
.\scripts\build-exe.ps1 -SelfContained:$false

# Los usuarios necesitarán .NET 10.0 instalado
```

---

## Comandos Útiles

### Verificar Herramientas

```powershell
# Verificar .NET SDK
dotnet --version

# Verificar MSBuild
msbuild -version

# Verificar makeappx
makeappx.exe /?

# Verificar signtool
signtool.exe /?
```

### Gestión de Paquetes

```powershell
# Listar aplicaciones instaladas
Get-AppxPackage *WinTTS*

# Desinstalar
Get-AppxPackage *WinTTS* | Remove-AppxPackage

# Ver detalles
Get-AppxPackage *WinTTS* | Format-List
```

### Gestión de Certificados

```powershell
# Listar certificados del sistema
Get-ChildItem Cert:\LocalMachine\Root

# Buscar certificado específico
Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like "*biglexj*" }

# Ver detalles de un certificado
Get-PfxCertificate .\WinTTS_Dev_Certificate.pfx | Format-List
```

---

## Resumen de Scripts

| Script                 | Propósito                  | Requiere Admin | Tiempo | Uso Frecuente |
| ---------------------- | -------------------------- | -------------- | ------ | ------------- |
| `generate-assets.ps1`  | Genera imágenes PNG        | ❌ No           | ~5s    | Primera vez   |
| `build-msix.ps1`       | Compila y empaqueta MSIX   | ❌ No           | ~1m    | Cada build    |
| `sign-package.ps1`     | Firma el paquete MSIX      | ❌ No           | ~10s   | Cada build    |
| `install-dev-cert.ps1` | Instala certificado        | ✅ Sí           | ~5s    | Una vez       |
| `create-and-sign.ps1`  | Todo-en-uno MSIX           | ✅ Sí           | ~1m    | Primera vez   |
| `build-exe.ps1`        | Genera ejecutable portable | ❌ No           | ~30s   | Cada build    |
| `add-sdk-to-path.ps1`  | Configura PATH             | ✅ Sí           | ~5s    | Una vez       |

---

## Mejores Prácticas

### Para Desarrollo

1. **Usa EXE para pruebas rápidas**
   ```powershell
   .\scripts\build-exe.ps1
   ```

2. **Usa MSIX para pruebas de instalación**
   ```powershell
   .\scripts\build-msix.ps1
   .\scripts\sign-package.ps1
   ```

### Para Distribución

1. **GitHub Releases**: Usa EXE portable
2. **WinGet**: Empieza con EXE, migra a MSIX
3. **Microsoft Store**: Solo MSIX

### Para Automatización

1. **CI/CD**: Usa `build-exe.ps1` o `build-msix.ps1`
2. **Testing**: Automatiza con scripts de PowerShell
3. **Versionado**: Actualiza manifest automáticamente

---

**Creado**: 20/01/2026  
**Autor**: biglexj  
**Proyecto**: WinTTS  
**Versión**: 1.0.0
