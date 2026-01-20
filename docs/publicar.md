# Cómo Publicar WinTTS

Para generar un archivo único que cualquiera pueda ejecutar sin instalar nada más, sigue estos pasos:

## 🚀 Generar el Ejecutable Único (.exe)

Ejecuta este comando en la terminal (PowerShell) dentro de la carpeta del proyecto:

```powershell
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:PublishReadyToRun=true --output ./publish
```

### Explicación del comando:
- `-c Release`: Optimiza el código para rendimiento.
- `-r win-x64`: Indica que es para Windows de 64 bits.
- `--self-contained true`: Incluye el motor de .NET dentro del programa (no hace falta instalar .NET aparte).
- `-p:PublishSingleFile=true`: Empaqueta todo en un solo archivo `.exe`.
- `--output ./publish`: Guarda el resultado en la carpeta `publish`.

## 📦 Resultado
Encontrarás el archivo final en:
`d:\Proyectos\biglexj\WinTTS\publish\WinTTS.exe`

Este archivo es el que puedes compartir con cualquier persona. Solo necesitan Windows 10 u 11.
