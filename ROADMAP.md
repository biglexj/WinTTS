# 🎯 WinTTS — Roadmap

Plan de trabajo, objetivos y prioridades del proyecto.

## 🔴 Urgente / Importante (Prioridad Alta)
- [ ] Implementar controles de reproducción avanzados:
  - [ ] Deslizador independiente para ajustar la velocidad de reproducción.
  - [ ] Deslizador independiente para ajustar el tono (rango -10 a +10).
- [ ] Mejorar ciclo de vida del reproductor:
  - [ ] Integrar pausa y reanudación limpia de la lectura.

## 🟡 Intermedio (Prioridad Media/Baja)
- [ ] Incorporar importación de archivos de texto (`.txt` y `.md`) directamente al editor.
- [ ] Implementar capacidad de guardar o exportar los textos editados.
- [ ] Implementar exportación de audio sintetizado a archivos locales:
  - [ ] Soporte para formato WAV (sin pérdidas).
  - [ ] Soporte para formato MP3 (comprimido).

## 🟢 Completado
- [x] Primera versión estable de WinTTS (v1.0.0 "Alfajor").
- [x] Motor de síntesis de texto a voz (TTS) 100% local y offline mediante `System.Speech.Synthesis`.
- [x] Motor de preprocesamiento para limpieza automática de sintaxis Markdown (negritas, enlaces, títulos y código).
- [x] Interfaz gráfica de diseño oscuro con acentos turquesa ("Ely VTuber" style) y barra de título personalizada.
- [x] Selección de voz del sistema en tiempo real ("hot-swap") y ajuste fino de volumen.
