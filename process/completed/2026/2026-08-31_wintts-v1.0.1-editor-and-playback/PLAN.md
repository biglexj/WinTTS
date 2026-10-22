# WinTTS 1.0.1 — Editor y Control de Reproducción — Plan

- Estado: `COMPLETED`
- Fecha: `2026-08-31`
- Proyecto: `WinTTS`

## Objetivo

Convertir WinTTS de un lector básico en una herramienta de escritorio práctica para preparar, escuchar y exportar narraciones locales, manteniendo la privacidad offline y una interfaz moderna y accesible.

## Alcance

- Incluye:
  - Máquina de estados explícita de reproducción (`Idle`, `Speaking`, `Paused`, `Stopping`, `Exporting`, `Error`).
  - Preprocesamiento y limpieza Markdown determinista con soporte para omitir fragmentos narrables.
  - Soporte de selección narrable y división visual de fragmentos omitidos (`wintts-skip`).
  - Exportación de audio local a WAV sin alterar el reproductor activo.
  - Controles de velocidad (`Rate`) y tono (`prosody`).
  - Integración de temas visuales oscuros y accesibilidad.
- No incluye:
  - Codificador nativo MP3 (planificado para versión posterior).
  - Formato de archivo compuesto `.wintts`.

## Enfoque

1. Estabilización de arquitectura y extracción de servicios (`SpeechService`, `AudioExportService`, `TextPreprocessor`).
2. Implementación de controles reales de reproducción, pausa/reanudación y preservación de posición al cambiar de voz.
3. Editor con soporte de fragmentos omitidos y renderizado/resaltado Markdown.
4. Exportación WAV con diálogo de guardado y cálculo SHA-256.
5. Verificación de compilación Release, suite de pruebas automatizadas y empaquetado.

## Criterios de finalización

- [x] Compilación limpia en modo Release.
- [x] Suite de pruebas automatizadas aprobada al 100%.
- [x] Reproducción, pausa, reanudación, omisión y exportación WAV validadas.
- [x] Generación de binario y hashes SHA-256 completada.
