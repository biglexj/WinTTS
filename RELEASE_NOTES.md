# 🎙️ WinTTS — Historial de versiones

📌 **Versión activa: `2.0.0` · Versión mínima publicada: `1.0.0`**

> [!IMPORTANT]
> **Estándar SemVer Flexible (Core-Docs v1.7.0):**
> - Se utiliza SemVer estándar (`MAJOR.MINOR.PATCH`) sin límites artificiales por dígito.
> - Se incrementa `MAJOR` en hitos de transformación arquitectónica integral con nombre de dulce.

## [2.0.0] — 2026-08-31 — “Nougat Update”

### Resumen

Reescritura y modernización arquitectónica completa de WinTTS migrando desde WPF/C# hacia una plataforma nativa y multiplataforma basada en **Rust + Tauri 2.0**, **React 19**, **TypeScript** y **Vite**.

Se implementa la capacidad de arrastrar y soltar (Drag & Drop) archivos `.md` y `.txt` directamente sobre la ventana de la aplicación con retroalimentación visual inmediata. El motor de procesamiento en Rust realiza una limpieza instantánea de sintaxis Markdown, emojis y bloques de código, manteniendo la exclusión precisa de fragmentos marcados en ámbar.

La aplicación integra compatibilidad para voces del sistema operativo y una arquitectura preparada para motores neuronales locales como Piper TTS. Se mantiene el diseño visual original con paleta Dark Slate/Teal, controles de velocidad, tono y volumen, modo de vista previa Markdown enriquecida y exportación directa a formato WAV de alta fidelidad.

El código fuente del stack C#/WPF previo ha sido archivado y resguardado en la carpeta `archivado/`.

## [1.0.1] — 2026-07-16

### Resumen

Este parche amplió WinTTS con un ciclo de reproducción completo —pausa, reanudación, detención, velocidad y tono— y convirtió el editor en una herramienta de narración más práctica mediante lectura de selección y fragmentos marcados para omitir.

También incorporó exportación WAV local, cambio de voz durante la lectura activa, limpieza de sintaxis Markdown y omisión de emojis.

## [1.0.0] — 2026-01-20 — “Alfajor”

### Resumen

Primera versión pública de WinTTS en WPF/.NET con síntesis de voz 100% local, selector de voz, ajuste de volumen y diseño oscuro con acentos turquesa.
