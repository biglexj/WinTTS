# 🎙️ WinTTS — Local Speech Engine

WinTTS es una aplicación de escritorio nativa para Windows (WPF/C#) diseñada para la síntesis de texto a voz (TTS) de forma 100% local y privada. Su principal característica es la capacidad de limpiar automáticamente el formato Markdown (negritas, enlaces, títulos y código) antes de iniciar la lectura, ofreciendo una experiencia fluida y sin distracciones auditivas.

Con un diseño oscuro moderno y elegante con acentos turquesa, la aplicación permite seleccionar dinámicamente entre las voces instaladas en el sistema operativo Windows y ajustar en tiempo real el volumen de la reproducción, todo funcionando de forma offline y garantizando la total privacidad de tus datos.

---

## ✨ Características Principales

* **Limpieza de Markdown**: Elimina automáticamente negritas, títulos, enlaces y bloques de código antes de la lectura para evitar que el sintetizador lea caracteres de formato.
* **Voz del Sistema**: Utiliza las voces nativas instaladas en tu Windows (100% local y offline).
* **Hot-Swap de Voces**: Permite cambiar la voz de reproducción en tiempo real mientras la aplicación está leyendo.
* **Interfaz Moderna**: Diseño minimalista oscuro con acentos turquesa ("Ely VTuber" style) para evitar la fatiga visual.
* **Control de Volumen**: Ajuste preciso del volumen de salida.

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
   dotnet build
   dotnet run
   ```

---

## 🛠️ Tecnologías
* **Lenguaje**: C#
* **UI Framework**: WPF (Windows Presentation Foundation)
* **Speech Engine**: `System.Speech.Synthesis`

---

## 📚 Documentación y Empaquetado

### Guías detalladas
* **[Guía Completa de Publicación](file:///d:/Proyectos/biglexj/WinTTS/docs/publicar.md)**: Métodos para generar ejecutables portables (EXE) y paquetes de la Microsoft Store (MSIX).
* **[Guía Completa de MSIX](file:///d:/Proyectos/biglexj/WinTTS/docs/MSIX_GUIDE.md)**: Proceso de empaquetado paso a paso, certificados, firmas y solución de problemas.
* **[Referencia de Scripts](file:///d:/Proyectos/biglexj/WinTTS/docs/SCRIPTS_REFERENCE.md)**: Información detallada de los scripts de automatización disponibles.
* **[Guía Rápida de MSIX](file:///d:/Proyectos/biglexj/WinTTS/docs/MSIX_PACKAGING.md)**: Pasos resumidos para el empaquetado.

### Scripts de Generación de Paquetes
Puedes generar los instaladores ejecutando estos comandos en PowerShell:
```powershell
# Generar Ejecutable Portable (EXE)
.\scripts\build-exe.ps1

# Generar y firmar paquete MSIX
.\scripts\build-msix.ps1
.\scripts\sign-package.ps1
```

---

## ⚖️ Licencia y Agradecimientos

Este proyecto se distribuye como software libre bajo la **Licencia MIT**. Eres libre de usar, modificar y distribuir esta aplicación de acuerdo con los términos de la licencia.

Queremos expresar nuestro más sincero agradecimiento a toda la comunidad y a los usuarios que apoyan el desarrollo de WinTTS. Tu interés y retroalimentación nos impulsan a seguir mejorando y añadiendo nuevas funcionalidades. ¡Gracias por usar la aplicación! 💜

***
Creado con cariño por **[@biglexj](https://github.com/biglexj)**
