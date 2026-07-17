# 🎙️ WinTTS — Historial de versiones

📌 **Versión activa: `1.0.1` · Versión mínima publicada: `1.0.0`**

> [!IMPORTANT]
> **Regla del .9 para versionado:**
> - Después de `1.0.9` se incrementa la versión menor; no existe `1.0.10`.
> - Al completar `1.9.9` o un cambio arquitectónico mayor, se salta a `2.0.0`.
> - Las notas usan una extensión proporcional de 1 a 5 párrafos según el alcance.
> - Si una versión activa aún no se publicó, los cambios se agrupan en ella y no se crea otro parche.

## [1.0.1] — 2026-07-16

### Resumen

Este parche amplía WinTTS con un ciclo de reproducción completo —pausa, reanudación, detención, velocidad y tono— y convierte el editor en una herramienta de narración más práctica mediante lectura de selección y fragmentos marcados para omitir.

También incorpora exportación WAV local con la misma voz y preparación de texto usada en la previsualización, cambio de voz durante una lectura activa retomando tras la última palabra procesada, corrige el procesamiento de Markdown, omite emojis para evitar que Windows lea sus nombres descriptivos y reorganiza la aplicación alrededor de estados explícitos, mensajes de error y pruebas automatizadas.

La interfaz recibe controles e iconos vectoriales consistentes, recursos cromáticos semánticos, foco visible, mejor contraste y estados interactivos accesibles. También añade una vista Markdown renderizada y un modo fuente donde la sintaxis, los emojis y otros elementos excluidos de la narración aparecen en ámbar. MP3 permanece en evaluación para no introducir una dependencia de codificación sin revisar su licencia y comportamiento en MSIX.

La estabilización cubre lecturas silenciosas después de una pausa, selección parcial, omisiones visuales persistentes durante la sesión, pegado de documentos extensos y continuidad aproximada al cambiar de voz. El comportamiento crítico queda respaldado por pruebas automatizadas sobre Markdown, emojis, selección, resaltado y extracción del texto realmente narrado.

## [1.0.0] — 2026-01-20 — “Alfajor”

### Resumen

Primera versión pública de WinTTS: aplicación WPF sobre .NET 10 para síntesis de voz 100% local y privada mediante voces instaladas en Windows.

Incluyó limpieza básica de Markdown, selector de voz, ajuste de volumen y una interfaz oscura con acento turquesa y barra de título personalizada.
