# 🎙️ WinTTS v2.0.0 (Nougat Update) — Local Speech & Neural Reader

WinTTS es una aplicación de escritorio nativa y multiplataforma construida con **Rust + Tauri 2.0**, **React 19**, **TypeScript** y **Vite**, diseñada para la síntesis de texto a voz (TTS) de forma 100% local, privada y de alto rendimiento.

Cuenta con un motor de limpieza inteligente que preprocesa sintaxis Markdown (negritas, enlaces, listas, títulos, código y comentarios HTML), omisión de emojis y exclusión dinámica de fragmentos en ámbar antes de iniciar la lectura o exportación de audio.

---

## 📸 Interfaz y Diseño

Con una estética oscura inspirada en el lenguaje de diseño de **Aurora**, la aplicación cuenta con una paleta Dark Slate/Teal (`#0F172A`, `#1E293B`, `#2DD4BF`), controles vectoriales de ventana sin marco y barra de estado con indicador LED.

---

## ✨ Características Principales

* **Abrir y Guardar Documentos**: `Ctrl+O` abre `.md` y `.txt`, `Ctrl+S` guarda y `Ctrl+Shift+S` guarda con otro nombre. El borrador en edición se restaura al reabrir la aplicación.
* **Arrastrar y Soltar Inteligente (Drag & Drop)**: Inserta instantáneamente archivos `.md` y `.txt` soltándolos sobre la ventana con un overlay visual elegante.
* **Multiplataforma y Ligero**: Desarrollado sobre **Rust + Tauri 2.0**, con consumo mínimo de RAM y arranque instantáneo.
* **Voces Locales y Neuronales**: Voces nativas del sistema y catálogo de voces neuronales **Piper TTS**, con descarga real de los pesos desde Hugging Face y síntesis local con `piper.exe`. Si el motor no está configurado, la interfaz lo dice con claridad: nunca cambia de voz en silencio.
* **Vista Markdown Dual**: Alterna con un clic entre la previsualización renderizada y el código fuente con editor en tiempo real.
* **Selección y Marcado de Omisiones**: Selecciona fragmentos de texto y márcalos como omitidos (resaltado en ámbar) para excluirlos de la narración y de la exportación. Las marcas se reajustan solas si editas el documento.
* **Control Integral de Lectura**: Reproducir, pausar, reanudar, detener, ajustar volumen (0-100%), velocidad (-10 a +10) y tono (-10 a +10).
* **Exportación WAV y MP3 de Alta Fidelidad**: Genera archivos de audio locales listos para compartir o usar en producción offline. El idioma del audio exportado sigue a la voz que elegiste.
* **Atajos de Teclado**:
  - `Ctrl + Enter`: Reproducir / Pausar
  - `Ctrl + O`: Abrir documento
  - `Ctrl + S`: Guardar documento
  - `Ctrl + Shift + S`: Guardar como
  - `Esc`: Detener lectura

---

## 🧠 Motor de Voces Neuronales (Piper)

Las voces neuronales son **reales**, no decorativas:

1. Descarga el ejecutable `piper.exe` del proyecto oficial de Piper.
2. En *Ajustes → Motor Piper TTS* indica su ruta y la carpeta donde guardar los modelos.
3. Descarga los pesos `.onnx` desde Hugging Face (el catálogo se contrastó contra el repositorio real).
4. Elige la voz en la barra lateral: WinTTS sintetiza el texto con Piper y reproduce el WAV generado.

Mientras el motor no esté configurado, la aplicación lo indica con la píldora **SIN MOTOR** y se niega a leer con una voz que no puede producir, en lugar de recurrir en silencio a otra.

---

## 🚀 Cómo Empezar

### Requisitos
* **Node.js**: v20+ o v24+
* **Rust**: `cargo` y `rustc` (edición 2021 o superior)

### Ejecución en Modo Desarrollo
1. Clona o abre el repositorio en tu terminal.
2. Instala dependencias del frontend:
   ```bash
   npm install
   ```
3. Inicia la aplicación en modo desarrollo con Tauri:
   ```bash
   npm run tauri dev
   ```

### Compilación de Producción
```bash
npm run tauri build
```

---

## 🛠️ Tecnologías y Arquitectura

* **Backend**: Rust 1.97+, Tauri 2.0, Regex, Hound WAV, Windows SpeechSynthesis / Cross-platform APIs.
* **Frontend**: React 19, TypeScript, Vite 6, Vanilla CSS con variables semánticas, Lucide Icons.
* **Código Legacy**: Versionado histórico conservado en `archivado/`.

---

## ⚖️ Licencia y Autor

Distribuido bajo la **Licencia MIT**.

Creado con precisión científica y cariño por **[@biglexj](https://github.com/biglexj)** (2026).
* Donaciones y soporte: [Buy Me a Coffee](https://buymeacoffee.com/biglexj) · [Donaciones Oficiales](https://www.biglexj.com/donaciones)
