export interface SpeechSettings {
  voiceName: string | null;
  volume: number; // 0 - 100
  rate: number;   // -10 - 10
  pitch: number;  // -10 - 10
}

export interface SystemVoice {
  id: string;
  name: string;
  culture: string;
  gender: string;
  provider: 'system' | 'piper';
}

export type PlaybackState = 'idle' | 'speaking' | 'paused' | 'stopping' | 'exporting' | 'error';

export interface DocumentStats {
  word_count: number;
  char_count: number;
  estimated_minutes: number;
}

export interface FileImportResult {
  filename: string;
  path: string | null;
  content: string;
  word_count: number;
}

export interface SkippedRange {
  id: string;
  start: number;
  end: number;
  text: string;
}

export type PiperQuality = 'x_low' | 'low' | 'medium' | 'high';

export interface PiperCatalogModel {
  id: string;
  name: string;
  language: string;
  locale: string;
  gender: 'Male' | 'Female';
  quality: PiperQuality;
  sizeMB: number;
  huggingFaceUrl: string;
  /** Ruta del modelo dentro del repositorio de Hugging Face. */
  modelPath: string;
}

/** Modelo Piper realmente presente en disco. */
export interface PiperInstalledModel {
  id: string;
  path: string;
  sizeBytes: number;
}

/** Base de descarga de los pesos neuronales de Piper. */
export const PIPER_BASE_URL = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/';

/** Modelo que se descarga al instalar el motor, para poder usarlo enseguida. */
export const DEFAULT_PIPER_MODEL_ID = 'es_AR-daniela-high';

/** Tamano del motor de Piper para Windows que instala la aplicacion. */
export const PIPER_ENGINE_SIZE_MB = 22;

/** URL directa del peso `.onnx` de un modelo del catalogo. */
export const piperModelUrl = (model: PiperCatalogModel) =>
  `${PIPER_BASE_URL}${model.modelPath}/${model.id}.onnx`;

/** URL directa de la configuracion `.onnx.json` que accompany al peso. */
export const piperConfigUrl = (model: PiperCatalogModel) =>
  `${PIPER_BASE_URL}${model.modelPath}/${model.id}.onnx.json`;

export const PIPER_POPULAR_MODELS: PiperCatalogModel[] = [
  // --- ESPANOL ---
  {
    id: 'es_AR-daniela-high',
    name: 'Español Argentina — Daniela',
    language: 'Español',
    locale: 'es-AR',
    gender: 'Female',
    quality: 'high',
    sizeMB: 108.9,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_AR/daniela/high',
    modelPath: 'es/es_AR/daniela/high',
  },
  {
    id: 'es_MX-claude-high',
    name: 'Español México — Claude',
    language: 'Español',
    locale: 'es-MX',
    gender: 'Male',
    quality: 'high',
    sizeMB: 60.2,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_MX/claude/high',
    modelPath: 'es/es_MX/claude/high',
  },
  {
    id: 'es_MX-ald-medium',
    name: 'Español México — Ald',
    language: 'Español',
    locale: 'es-MX',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 60.3,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_MX/ald/medium',
    modelPath: 'es/es_MX/ald/medium',
  },
  {
    id: 'es_ES-carlfm-x_low',
    name: 'Español España — Carlfm (Ligera)',
    language: 'Español',
    locale: 'es-ES',
    gender: 'Male',
    quality: 'x_low',
    sizeMB: 26.8,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/carlfm/x_low',
    modelPath: 'es/es_ES/carlfm/x_low',
  },
  {
    id: 'es_ES-davefx-medium',
    name: 'Español España — Davefx',
    language: 'Español',
    locale: 'es-ES',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 60.3,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/davefx/medium',
    modelPath: 'es/es_ES/davefx/medium',
  },
  {
    id: 'es_ES-sharvard-medium',
    name: 'Español España — Sharvard',
    language: 'Español',
    locale: 'es-ES',
    gender: 'Female',
    quality: 'medium',
    sizeMB: 73.2,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/sharvard/medium',
    modelPath: 'es/es_ES/sharvard/medium',
  },
  {
    id: 'es_ES-mls_10246-low',
    name: 'Español España — MLS 10246',
    language: 'Español',
    locale: 'es-ES',
    gender: 'Female',
    quality: 'low',
    sizeMB: 60.2,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/mls_10246/low',
    modelPath: 'es/es_ES/mls_10246/low',
  },

  // --- ENGLISH ---
  {
    id: 'en_US-lessac-high',
    name: 'English US — Lessac (Studio)',
    language: 'English',
    locale: 'en-US',
    gender: 'Female',
    quality: 'high',
    sizeMB: 108.6,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/high',
    modelPath: 'en/en_US/lessac/high',
  },
  {
    id: 'en_US-lessac-medium',
    name: 'English US — Lessac',
    language: 'English',
    locale: 'en-US',
    gender: 'Female',
    quality: 'medium',
    sizeMB: 60.3,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/medium',
    modelPath: 'en/en_US/lessac/medium',
  },
  {
    id: 'en_US-ryan-high',
    name: 'English US — Ryan (Studio)',
    language: 'English',
    locale: 'en-US',
    gender: 'Male',
    quality: 'high',
    sizeMB: 115.2,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ryan/high',
    modelPath: 'en/en_US/ryan/high',
  },
  {
    id: 'en_US-ryan-medium',
    name: 'English US — Ryan',
    language: 'English',
    locale: 'en-US',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 60.3,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ryan/medium',
    modelPath: 'en/en_US/ryan/medium',
  },
  {
    id: 'en_US-amy-medium',
    name: 'English US — Amy',
    language: 'English',
    locale: 'en-US',
    gender: 'Female',
    quality: 'medium',
    sizeMB: 60.3,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/amy/medium',
    modelPath: 'en/en_US/amy/medium',
  },
  {
    id: 'en_US-bryce-medium',
    name: 'English US — Bryce',
    language: 'English',
    locale: 'en-US',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 60.6,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/bryce/medium',
    modelPath: 'en/en_US/bryce/medium',
  },
  {
    id: 'en_GB-alan-medium',
    name: 'English UK — Alan',
    language: 'English',
    locale: 'en-GB',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 60.3,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_GB/alan/medium',
    modelPath: 'en/en_GB/alan/medium',
  },
  {
    id: 'en_GB-alba-medium',
    name: 'English UK — Alba',
    language: 'English',
    locale: 'en-GB',
    gender: 'Female',
    quality: 'medium',
    sizeMB: 60.3,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_GB/alba/medium',
    modelPath: 'en/en_GB/alba/medium',
  },

  // --- OTROS IDIOMAS ---
  {
    id: 'fr_FR-siwis-medium',
    name: 'Français — Siwis',
    language: 'Français',
    locale: 'fr-FR',
    gender: 'Female',
    quality: 'medium',
    sizeMB: 60.3,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis/medium',
    modelPath: 'fr/fr_FR/siwis/medium',
  },
  {
    id: 'de_DE-thorsten-high',
    name: 'Deutsch — Thorsten (Studio)',
    language: 'Deutsch',
    locale: 'de-DE',
    gender: 'Male',
    quality: 'high',
    sizeMB: 108.6,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/de/de_DE/thorsten/high',
    modelPath: 'de/de_DE/thorsten/high',
  },
  {
    id: 'pt_BR-faber-medium',
    name: 'Português Brasil — Faber',
    language: 'Português',
    locale: 'pt-BR',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 60.3,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/pt/pt_BR/faber/medium',
    modelPath: 'pt/pt_BR/faber/medium',
  },
  {
    id: 'it_IT-riccardo-x_low',
    name: 'Italiano — Riccardo (Ligera)',
    language: 'Italiano',
    locale: 'it-IT',
    gender: 'Male',
    quality: 'x_low',
    sizeMB: 26.8,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/it/it_IT/riccardo/x_low',
    modelPath: 'it/it_IT/riccardo/x_low',
  },
];

export interface AppSettings {
  piperBinaryPath: string;
  piperModelsDir: string;
  installedPiperModels: string[]; // Modelos marcados como instalados (se cruzan con el disco)
  systemVoiceLanguages: string[]; // Idiomas de voces del sistema a mostrar, ej: ['es'] o ['all']
  sampleRate: number;
  stripEmojis: boolean;
  stripCodeBlocks: boolean;
  defaultSavePrefix: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  piperBinaryPath: '',
  piperModelsDir: '',
  installedPiperModels: [],
  systemVoiceLanguages: ['es'],
  sampleRate: 22050,
  stripEmojis: true,
  stripCodeBlocks: true,
  defaultSavePrefix: 'WinTTS-',
};
