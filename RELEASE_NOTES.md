# 🎙️ WinTTS - Historial de Versiones
📌 **Versión actual: `1.0.0` · Versión mínima requerida: `1.0.0`**

> [!IMPORTANT]
> **Regla del .9 para Versionado:**
> - Nunca se debe pasar de una versión de parche `.9` (ej. de `1.0.9` no se pasa a `1.0.10`). Al alcanzar el límite del parche `.9`, se incrementa el número menor/secundario (ej. pasando a `1.1.0`).
> - De igual manera, al alcanzar el límite de la versión menor `1.9.9` (o ante hitos de arquitectura significativos posteriores a `1.9.x`), se debe saltar obligatoriamente al siguiente número mayor completo, pasando a **`2.0.0`**. No se permiten números como `1.9.10` o `1.10.x`.

---

### 🎙️ v1.0.0 — **"Alfajor" (Primera Versión Pública y Síntesis de Voz Local con Limpieza de Markdown) (major)** (20/01/2026)

Se implementó la primera versión estable de WinTTS, una aplicación de escritorio nativa para Windows (WPF/C#) construida bajo .NET 10. Su lógica principal permite realizar la síntesis de texto a voz (TTS) de forma 100% local y privada a través de la API del sistema `System.Speech`, garantizando que ningún dato de texto del usuario sea transmitido a internet o servidores externos.

Adicionalmente, se desarrolló un motor de preprocesamiento que limpia de forma automática la sintaxis y caracteres de formato Markdown (negritas, enlaces, títulos y bloques de código) antes de ser enviados al sintetizador, logrando una audición continua y libre de ruidos de sintaxis. La interfaz gráfica presenta un diseño oscuro moderno con acentos turquesa, barra de título personalizada y controles interactivos para realizar cambios de voz en tiempo real ("hot-swap"), ajuste fino de volumen y un editor de texto con soporte para scroll.

---

### 🎙️ v1.1.0 — **"Controles de Reproducción y Exportación de Audio en Planificación" (minor)** (Planeada)

Esta versión en desarrollo se centrará en ampliar el control sobre la voz mediante deslizadores independientes para ajustar la velocidad de reproducción y el tono (-10 a +10). También se incorporará la capacidad de importar archivos de texto (`.txt` y `.md`) directamente al editor y de guardar o exportar los textos editados.

Adicionalmente, se implementará la exportación de audio sintetizado a archivos locales de audio, ofreciendo soporte nativo para los formatos WAV (sin pérdidas) y MP3 (comprimido). Asimismo, se mejorará el ciclo de vida del reproductor integrando la pausa y reanudación limpia de la lectura.
