# 🎯 WinTTS — Roadmap

Plan de trabajo, objetivos y prioridades del proyecto.

## 🔴 Urgente / Normal (Pendientes Activos)

- [ ] Soporte para descarga e inferencia local directa de modelos `.onnx` de Piper TTS **con ONNX Runtime propio** (sin depender de `piper.exe` externo).
- [ ] Exportación directa a formato MP3/OGG multiplataforma (hoy MP3 requiere Windows Media Foundation).

## 🟡 Intermedio (Prioridad Media/Baja)

- [ ] Reanudar la lectura desde el punto en que se detuvo (recordar `charIndex`).
- [ ] Exportar por capítulos: un archivo de audio por cada encabezado del documento.
- [ ] Atajos globales de teclado en segundo plano.
- [ ] Resaltado de la palabra en lectura dentro de la vista renderizada (el motor del sistema ya emite los eventos `onboundary`; falta mapearlos sobre la vista).

## ⚪ Descartado / En Pausa

- ⏸️ TTS en la nube: descartado para preservar la privacidad y la ejecución 100% offline.
- ⏸️ Modelos de IA generativa en el flujo de lectura: el costo por token no escala con documentos largos y rompería la promesa de privacidad.

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
- [x] **Abrir, Guardar y Guardar como** con atajos `Ctrl+O`, `Ctrl+S` y `Ctrl+Shift+S`, y borrador persistente entre sesiones.
- [x] **Motor Piper real**: descarga de pesos desde Hugging Face con progreso, verificacion en disco, sintesis con `piper.exe` y reproduccion del WAV generado.
- [x] **Estado honesto del motor**: la interfaz avisa cuando falta el motor en vez de cambiar de voz en silencio.
- [x] **Instalación del motor Piper desde la aplicación**: descarga del binario oficial de Windows con verificación de hash, extracción en la carpeta de datos de la app y actualización automática de la ruta configurada.
- [x] **Voces neuronales ocultas por defecto**: la sección de voz neural solo aparece cuando el motor está operativo; sin motor, la interfaz no muestra avisos porque no falta nada.
- [x] **Reajuste de las omisiones al editar** el documento.
- [x] **Persistencia de voz, volumen, velocidad y tono** entre sesiones.
- [x] **Idioma del audio exportado acorde a la voz elegida** (ya no forzado a `es-PE`).
- [x] Corrección de la exportación WAV, que fallaba con el tono por defecto (`pitch="0st"` no es SSML válido).
- [x] Catálogo de Piper contrastado contra el repositorio real de Hugging Face (entradas y tamaños corregidos).
- [x] Versión `2.0.0` “Nougat & Nugget Update”.
