# Guía de Publicación: WinTTS

Esta guía detalla el proceso para publicar **WinTTS** en la Microsoft Store y añadirlo al repositorio oficial de **WinGet**.

## 1. Microsoft Store (MSIX)

La Microsoft Store requiere que la aplicación esté empaquetada en formato MSIX.

### Costos y Alternativas
- **Crear MSIX:** **Gratis**. Puedes generarlo con Visual Studio sin pagar.
- **Instalación Local:** **Gratis**. Puedes instalar el MSIX en tu PC para pruebas.
- **Publicar en Store:** **De pago** ($19 USD aprox). Microsoft firma el paquete por ti.
- **Distribución fuera de Store:** Requiere un certificado. Puedes crear uno propio (Self-Signed) **gratis**, pero tus usuarios verán una advertencia de seguridad a menos que instalen tu certificado primero.

### Opción Recomendada: MSIX Packaging Tool (GUI)
Dado que tu entorno actual no tiene instalados los componentes de empaquetado de Visual Studio (que son pesados), la forma más fácil y gratuita de crear el MSIX para la Store es:

1. **Descarga:** Busca "MSIX Packaging Tool" en la Microsoft Store e instálala (es de Microsoft y es gratis).
2. **Uso:** 
   - Ejecuta tu app una vez para asegurarte que funciona.
   - Abre la herramienta y selecciona "Application package".
   - Sigue el asistente: selecciona el ejecutable `WinTTS.exe` que generamos con `dotnet publish`.
   - La herramienta creará el `.msix` por ti sin necesidad de configurar archivos `.wapproj`.

---

## 2. Windows Package Manager (WinGet)

Para que los usuarios puedan instalar WinTTS con `winget install WinTTS`.

> [!NOTE]
> **Costo:** WinGet es **totalmente gratuito**. Solo necesitas una cuenta de GitHub para subir el paquete al repositorio oficial. No requiere cuenta de desarrollador de Microsoft.

### Pasos para Añadir el Paquete
1. **Hospedaje del Instalador:** Asegúrate de tener una versión pública de tu instalador (ej. una Release en GitHub con el archivo `.msix` o `.exe`).
2. **Generar Manifiesto:**
   Instala la herramienta oficial:
   ```powershell
   winget install wingetcreate
   ```
   Corre el comando para crear el manifiesto:
   ```powershell
   wingetcreate new <URL_DIRECTA_AL_INSTALADOR_DE_GITHUB>
   ```
3. **Validación:**
   ```powershell
   winget validate <ruta_del_manifiesto>
   ```
4. **Envío:**
   Sigue las instrucciones de `wingetcreate` para enviar el Pull Request al repositorio [winget-pkgs](https://github.com/microsoft/winget-pkgs).

---

## ¿Qué sigue ahora? (Siguientes Pasos)

### 1. Generar el ejecutable (Publish)
Ejecuta este comando para crear una versión lista para usar:
```powershell
dotnet publish WinTTS.csproj -c Release -r win-x64 --self-contained -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true
```
Esto creará un único archivo `.exe` en `bin/Release/net10.0-windows/win-x64/publish/`.

### 2. Crear el Manifiesto de WinGet
En tu terminal vemos que ya iniciaste `wingetcreate`. Aquí tienes cómo responder a las preguntas:

- **PackageIdentifier:** Usa `BiglexJ.WinTTS` (es el estándar: Autor.NombreApp).
- **PackageVersion:** `1.0.0` (o la versión que estés subiendo).
- **PackageName:** `WinTTS`
- **PublisherName:** `BiglexJ`
- **License:** `MIT` (o la que prefieras).
- **ShortDescription:** Una descripción breve (ej. "WinTTS: Local Speech Engine").
- **InstallerType:** selecciona `exe` (o lo detectará automáticamente).
- **Silent & SilentWithProgress:** Pon los comandos si tu instalador los tiene (si es un "Single File" de dotnet, a veces no necesita nada extra).

### 3. Envío (Pull Request)
Al final, la herramienta te preguntará si quieres enviar el Pull Request (PR) a GitHub. Necesitarás loguearte con tu cuenta de GitHub cuando te lo pida.
