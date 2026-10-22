# 🎙️ WinTTS v2.0.0 (Nougat Update) — Local Speech & Neural Reader

WinTTS es una aplicación de escritorio nativa y multiplataforma construida con **Rust + Tauri 2.0**, **React 19**, **TypeScript** y **Vite**, diseñada para la síntesis de texto a voz (TTS) de forma 100% local, privada y de alto rendimiento.

Cuenta con un motor de limpieza inteligente que preprocesa sintaxis Markdown (negritas, enlaces, listas, títulos, código y comentarios HTML), omisión de emojis y exclusión dinámica de fragmentos en ámbar antes de iniciar la lectura o exportación de audio.

---

## 📸 Interfaz y Diseño

Con una estética oscura inspirada en el lenguaje de diseño de **Aurora**, la aplicación cuenta con una paleta Dark Slate/Teal (`#0F172A`, `#1E293B`, `#2DD4BF`), controles vectoriales de ventana sin marco y barra de estado con indicador LED.

---

## ✨ Características Principales

* **Arrastrar y Soltar Inteligente (Drag & Drop)**: Inserta instantáneamente archivos `.md` y `.txt` soltándolos sobre la ventana con un overlay visual elegante.
* **Multiplataforma y Ligero**: Desarrollado sobre **Rust + Tauri 2.0**, con consumo mínimo de RAM y arranque instantáneo.
* **Voces Locales y Neuronales**: Compatible con las voces nativas del sistema operativo y catálogo extensible para voces neuronales como **Piper TTS**.
* **Vista Markdown Dual**: Alterna con un clic entre la previsualización renderizada y el código fuente con editor en tiempo real.
* **Selección y Marcado de Omisiones**: Selecciona fragmentos de texto y márcalos como omitidos (resaltado en ámbar) para excluirlos de la narración y de la exportación.
* **Control Integral de Lectura**: Reproducir, pausar, reanudar, detener, ajustar volumen (0-100%), velocidad (-10 a +10) y tono (-10 a +10).
* **Exportación WAV de Alta Fidelidad**: Genera archivos de audio WAV locales listos para compartir o usar en producción offline.
* **Atajos de Teclado**:
  - `Ctrl + Enter`: Reproducir / Pausar
  - `Esc`: Detener lectura

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
