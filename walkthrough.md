# Walkthrough — WinTTS 1.0.1

## Resultado

WinTTS pasó de un lector básico a un editor de narración local con estados explícitos, pausa y reanudación estables, cambio de voz durante la reproducción, selección narrable, fragmentos omitidos, controles de velocidad/tono y exportación WAV cancelable.

El editor incorpora una vista Markdown renderizada y un modo fuente editable. En el modo fuente, hashtags, emojis, delimitadores, destinos de enlaces, imágenes, código y demás contenido excluido de la narración aparecen en ámbar; la extracción usada para reproducir y exportar respeta exactamente esas marcas.

## Correcciones principales

- Se separaron `SpeechService`, `AudioExportService`, `TextPreprocessor` y el modelo de configuración.
- Se corrigieron lecturas silenciosas después de cancelar una pausa y se mantuvo la posición aproximada al cambiar de voz.
- Se corrigió la aplicación inválida de `Tag` sobre `TextRange`; las omisiones ahora dividen, colorean y etiquetan los `Run` reales.
- Los documentos extensos pegados vuelven al inicio y la vista previa protege la fuente Markdown original.
- Se sustituyeron controles nativos claros por estilos oscuros consistentes, con menos redondeo y mejor contraste.

## Verificación

- Compilación Release WPF sobre .NET 10 sin errores ni advertencias.
- 18/18 pruebas automatizadas superadas para limpieza Markdown, emojis, SSML, selección, omisiones, renderizado y resaltado de fuente.
- Revisión manual iterativa de tema oscuro, selector de voces, controles, documentos extensos y modos Markdown.
- EXE portable self-contained de 150.87 MB con `FileVersion 1.0.1.0` y SHA-256 verificado.
- Ambos conjuntos de manifiestos WinGet superaron `winget validate`.
- El flujo `build-release.ps1` genera el EXE portable, SHA-256, manifiestos WinGet, commit, tag y GitHub Release.
