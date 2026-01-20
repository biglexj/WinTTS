# WinTTS - Local Speech Engine

Una aplicación de escritorio nativa para Windows (WPF/C#) que convierte texto a voz (TTS) de forma local, con soporte para limpiar formato Markdown.

Software de Texto a Voz (TTS) local para Windows

## ✨ Características

- **Limpieza de Markdown**: Elimina automáticamente negritas, títulos, enlaces y bloques de código antes de hablar.
- **Voz del Sistema**: Utiliza las voces instaladas en tu Windows.
- **Hot-Swap de Voces**: Cambia de voz en tiempo real mientras la aplicación está leyendo.
- **Interfaz Moderna**: Diseño oscuro con acentos turquesa ("Ely VTuber" style).
- **Control de Volumen**: Ajuste preciso del volumen de salida.

## 🚀 Cómo empezar

### Requisitos
- .NET 10 (o posterior)
- Windows 10/11

### Instalación y Uso
1. Descarga o clona el repositorio.
2. Abre la carpeta `WinTTS` en una terminal.
3. Ejecuta los siguientes comandos:
   ```bash
   dotnet build
   dotnet run
   ```

## 🛠️ Tecnologías
- **Lenguaje**: C#
- **UI Framework**: WPF (Windows Presentation Foundation)
- **Speech Engine**: System.Speech.Synthesis

## 📚 Documentación

### Guías de Empaquetado y Distribución

- **[docs/publicar.md](docs/publicar.md)** - Guía completa de publicación
  - Ejecutable portable (EXE)
  - Paquete MSIX
  - Comparación de métodos
  - Publicación en WinGet y Microsoft Store

- **[docs/MSIX_GUIDE.md](docs/MSIX_GUIDE.md)** - Guía completa de MSIX
  - Proceso de creación paso a paso
  - Certificados y firma
  - Publicación en Microsoft Store
  - Solución de problemas

- **[docs/SCRIPTS_REFERENCE.md](docs/SCRIPTS_REFERENCE.md)** - Referencia de scripts
  - Scripts para MSIX
  - Scripts para EXE portable
  - Flujos de trabajo
  - Comandos útiles

- **[docs/MSIX_PACKAGING.md](docs/MSIX_PACKAGING.md)** - Guía rápida de MSIX

### Generar Paquetes

```powershell
# Ejecutable portable (EXE) - Rápido y simple
.\scripts\build-exe.ps1

# Paquete MSIX - Para Microsoft Store
.\scripts\build-msix.ps1
.\scripts\sign-package.ps1
```

## ✒️ Créditos
Creado por **@biglexj**
