# 🚀 ¡Nuevo lanzamiento de WinTTS! — v2.0.0 “Nougat & Nugget Update”

**WinTTS v2.0.0** representa la evolución más ambiciosa del proyecto: una reescritura arquitectónica integral desde C#/WPF hacia una plataforma moderna, multiplataforma y de alto rendimiento impulsada por **Rust + Tauri 2.0**, **React 19**, **TypeScript** y **Vite** — y, sobre esa base, un editor que de verdad guarda los documentos y un motor Piper que de verdad habla.

---

### 🌟 Novedades destacadas

- ⚡ **Motor Nativo en Rust**: Procesamiento y preprocesamiento de Markdown ultrarrápido con limpieza inteligente de sintaxis, emojis y bloques de código delimitados.
- 📂 **Arrastrar y Soltar (Drag & Drop)**: Carga instantánea de archivos `.md` y `.txt` con un overlay interactivo animado.
- 🎙️ **Selector de Voz Premium Flotante**: Rediseñado como un dropdown desacoplado con buscador en tiempo real, categorización por dialecto y soporte para scrollbar temático.
- 🧠 **Soporte Modular para Piper Neural TTS**: Arquitectura ligera que mantiene el ejecutable base por debajo de 10 MB, con panel de configuración para enlazar binarios y modelos ONNX locales en la carpeta de datos del usuario (AppData).
- ✂️ **Lectura Selectiva y Marcado Ámbar**: Posibilidad de narrar selecciones específicas y marcar fragmentos para omitirlos visual y acústicamente.
- 💾 **Exportación WAV de Alta Fidelidad**: Generación de archivos de audio WAV 100% locales con tasa de muestreo configurable (22.05 kHz / 44.1 kHz / 48 kHz).
- 🪟 **Interfaz Dark Slate & Teal Frameless**: Ventana moderna con controles de título personalizados, atajos de teclado (`Ctrl+Enter` para reproducir, `Esc` para detener) y modales flotantes con efecto backdrop blur.
- 💾 **Guardar, Abrir y Guardar como**: `Ctrl+S`, `Ctrl+O` y `Ctrl+Shift+S` ya invocan el backend, con un borrador persistente entre sesiones que restaura el contenido en edición y marca si hay cambios pendientes de escribir en disco.
- 🎙️ **Motor Piper funcional**: descarga real de los pesos `.onnx` desde Hugging Face con barra de progreso, verificación de lo que hay realmente en disco, síntesis local con `piper.exe` y reproducción del WAV generado. La velocidad se controla con `length_scale`.
- 📥 **El motor se instala desde la aplicación**: un clic descarga el binario oficial de Piper para Windows, verifica su hash y lo deja instalado en la carpeta de datos de WinTTS, rellenando la ruta por su cuenta y trayendo la voz por defecto.
- 🔊 **Las voces neuronales son opcionales y no se anuncian**: sin motor instalado, la sección de voz neural no aparece en la interfaz y no hay avisos de que algo falte, porque no falta nada. Cuando el motor está, la sección se suma sola.
- ⚙️ **Persistencia de la configuración de voz**: voz, volumen, velocidad y tono se guardan entre sesiones.
- 🐛 **Correcciones de exportación y lectura**: el tono 0 ya no genera un `prosody` inválido, el idioma del audio exportado sigue a la voz real, las omisiones se reajustan al editar y los archivos de texto que no son UTF-8 se abren de forma tolerante.
- 📦 **Instalador de Windows modernizado con Inno Setup**: pantalla única de entrada, progreso y éxito nativos, tema claro/oscuro automático, instalación por usuario sin elevación y actualización sin instalación paralela.

---

### 📦 Instalador de Windows (x64)

[Descargar Instalador (Windows x64)](https://github.com/biglexj/WinTTS/releases/download/v2.0.0/WinTTS-Setup-2.0.0.exe)

---

### 🔒 Privacidad y Código Abierto
WinTTS se ejecuta **100% en tu máquina**: sin telemetría, sin suscripciones y sin enviar tu texto a servidores externos. Publicado con orgullo bajo **Licencia MIT**.

☕ **Soporte al autor**: [Buy Me a Coffee](https://buymeacoffee.com/biglexj) · [Donaciones](https://www.biglexj.com/donaciones)
