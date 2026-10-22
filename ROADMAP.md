# 🎯 WinTTS — Roadmap

Plan de trabajo, objetivos y prioridades del proyecto.

## 🔴 Urgente / Normal (Pendientes Activos)

- [ ] Soporte para descarga e inferencia local directa de modelos `.onnx` de Piper TTS.
- [ ] Exportación directa a formato MP3/OGG multiplataforma.

## 🟡 Intermedio (Prioridad Media/Baja)

- [ ] Persistencia de configuración de voz, temas y archivos recientes en almacenamiento local seguro.
- [ ] Soporte para atajos globales de teclado en segundo plano.

## ⚪ Descartado / En Pausa

- ⏸️ TTS en la nube: descartado para preservar la privacidad y la ejecución 100% offline.

## 🟢 Completado

- [x] Migración total de arquitectura a **Rust + Tauri 2.0** (Vite + React + TypeScript).
- [x] Agrupación y resguardo del código C#/WPF legacy en `archivado/`.
- [x] Arrastrar y soltar inteligente (Drag & Drop) para archivos `.md` y `.txt` con overlay visual animado.
- [x] Preprocesamiento de texto y stripping de Markdown en Rust con 100% de cobertura en tests.
- [x] Catálogo de voces del sistema y soporte para voces neuronales Piper TTS.
- [x] Modos de edición dual: Vista Markdown renderizada y editor de código fuente.
- [x] Marcado y gestión de fragmentos omitidos con resaltado ámbar.
- [x] Control de reproducción (Reproducir, Pausar, Reanudar, Detener) y sliders de volumen, velocidad y tono.
- [x] Exportación de narraciones a archivo WAV de alta fidelidad.
- [x] Interfaz oscura Slate/Teal sin marco con barra de título y estado personalizadas.
- [x] Versión `2.0.0` “Nougat Update”.
