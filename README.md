# 🎙️ WinTTS — Local Speech Engine

WinTTS es una aplicación de escritorio nativa para Windows (WPF/C#) diseñada para la síntesis de texto a voz (TTS) de forma 100% local y privada. Su principal característica es la capacidad de limpiar automáticamente el formato Markdown (negritas, enlaces, títulos y código) antes de iniciar la lectura, ofreciendo una experiencia fluida y sin distracciones auditivas.

Con un diseño oscuro moderno y elegante con acentos turquesa, la aplicación permite seleccionar dinámicamente entre las voces instaladas en Windows, controlar la reproducción, renderizar Markdown y exportar audio WAV, todo funcionando offline y garantizando la privacidad de tus datos.

---

## ✨ Características Principales

* **Vista Markdown**: Renderiza títulos, listas, citas, énfasis y código; el modo fuente resalta en ámbar lo que no será narrado.
* **Voz del Sistema**: Utiliza las voces nativas instaladas en tu Windows (100% local y offline).
* **Cambio de voz durante la lectura**: Retoma la narración tras la última palabra procesada con la nueva voz.
* **Interfaz Moderna**: Diseño minimalista oscuro con acentos turquesa ("Ely VTuber" style) para evitar la fatiga visual.
* **Control completo**: Reproducir, pausar, reanudar, detener, ajustar volumen, velocidad y tono.
* **Selección y omisiones**: Lee únicamente un rango o marca fragmentos que no deben narrarse ni exportarse.
* **Exportación WAV**: Genera audio local con la misma preparación y configuración de la previsualización.

---

## 🚀 Cómo empezar

### Requisitos
* **.NET 10** o posterior
* **Windows 10 / 11**

### Instalación y Uso rápido
1. Descarga o clona este repositorio.
2. Abre la carpeta del proyecto en una terminal.
3. Ejecuta los siguientes comandos:
   ```bash
   dotnet build .\WinTTS.csproj
   dotnet run --project .\WinTTS.csproj
   ```

---

## 🛠️ Tecnologías
* **Lenguaje**: C#
* **UI Framework**: WPF (Windows Presentation Foundation)
* **Speech Engine**: `System.Speech.Synthesis`

---

## 📚 Documentación y Empaquetado

### Guías detalladas
* **[Guía Completa de Publicación](docs/PUBLISHING.md)**: Métodos para generar ejecutables portables (EXE) y paquetes de la Microsoft Store (MSIX).
* **[Guía Completa de MSIX](docs/MSIX_GUIDE.md)**: Proceso de empaquetado paso a paso, certificados, firmas y solución de problemas.
* **[Referencia de Scripts](docs/SCRIPTS_REFERENCE.md)**: Información detallada de los scripts de automatización disponibles.
* **[Guía Rápida de MSIX](docs/MSIX_PACKAGING.md)**: Pasos resumidos para el empaquetado.

### Scripts de Generación de Paquetes
Puedes generar los instaladores ejecutando estos comandos en PowerShell:
```powershell
# Generar Ejecutable Portable (EXE)
.\scripts\build-exe.ps1

# Generar y firmar paquete MSIX
.\scripts\build-msix.ps1
.\scripts\sign-package.ps1

# Validar y publicar una versión completa en GitHub
.\build-release.ps1 -LocalOnly
.\build-release.ps1
```

---

## ⚖️ Licencia y Agradecimientos

Este proyecto se distribuye como software libre bajo la **Licencia MIT**. Eres libre de usar, modificar y distribuir esta aplicación de acuerdo con los términos de la licencia.

Queremos expresar nuestro más sincero agradecimiento a toda la comunidad y a los usuarios que apoyan el desarrollo de WinTTS. Tu interés y retroalimentación nos impulsan a seguir mejorando y añadiendo nuevas funcionalidades. ¡Gracias por usar la aplicación! 💜

***
Creado con cariño por **[@biglexj](https://github.com/biglexj)**
