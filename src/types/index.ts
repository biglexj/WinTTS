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

export interface PiperCatalogModel {
  id: string;
  name: string;
  language: string;
  locale: string;
  gender: 'Male' | 'Female';
  quality: 'low' | 'medium' | 'high';
  sizeMB: number;
  huggingFaceUrl: string;
}

export interface AppSettings {
  piperBinaryPath: string;
  piperModelsDir: string;
  enablePiper: boolean;
  installedPiperModels: string[]; // List of model IDs installed
  systemVoiceLanguages: string[]; // Idiomas de voces del sistema a mostrar, ej: ['es'] o ['all']
  sampleRate: number;
  stripEmojis: boolean;
  stripCodeBlocks: boolean;
  defaultSavePrefix: string;
}

export const PIPER_POPULAR_MODELS: PiperCatalogModel[] = [
  // --- ESPAÑOL ---
  {
    id: 'es_AR-daniela-high',
    name: 'Español Argentina — Daniela',
    language: 'Español',
    locale: 'es-AR',
    gender: 'Female',
    quality: 'high',
    sizeMB: 114,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_AR/daniela/high',
  },
  {
    id: 'es_MX-claude-high',
    name: 'Español México — Claude',
    language: 'Español',
    locale: 'es-MX',
    gender: 'Male',
    quality: 'high',
    sizeMB: 112,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_MX/claude/high',
  },
  {
    id: 'es_MX-ald-medium',
    name: 'Español México — Ald',
    language: 'Español',
    locale: 'es-MX',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 39,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_MX/ald/medium',
  },
  {
    id: 'es_ES-carlfm-high',
    name: 'Español España — Carlfm (Studio)',
    language: 'Español',
    locale: 'es-ES',
    gender: 'Male',
    quality: 'high',
    sizeMB: 110,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/carlfm/high',
  },
  {
    id: 'es_ES-carlfm-medium',
    name: 'Español España — Carlfm',
    language: 'Español',
    locale: 'es-ES',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 38,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/carlfm/medium',
  },
  {
    id: 'es_ES-davefx-medium',
    name: 'Español España — Davefx',
    language: 'Español',
    locale: 'es-ES',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 38,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/davefx/medium',
  },
  {
    id: 'es_ES-sharvard-medium',
    name: 'Español España — Sharvard',
    language: 'Español',
    locale: 'es-ES',
    gender: 'Female',
    quality: 'medium',
    sizeMB: 42,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/sharvard/medium',
  },
  {
    id: 'es_ES-mls_10246-low',
    name: 'Español España — MLS 10246 (Ligera)',
    language: 'Español',
    locale: 'es-ES',
    gender: 'Female',
    quality: 'low',
    sizeMB: 18,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/mls_10246/low',
  },

  // --- ENGLISH ---
  {
    id: 'en_US-lessac-high',
    name: 'English US — Lessac (Studio)',
    language: 'English',
    locale: 'en-US',
    gender: 'Female',
    quality: 'high',
    sizeMB: 114,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/high',
  },
  {
    id: 'en_US-lessac-medium',
    name: 'English US — Lessac',
    language: 'English',
    locale: 'en-US',
    gender: 'Female',
    quality: 'medium',
    sizeMB: 40,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/medium',
  },
  {
    id: 'en_US-ryan-high',
    name: 'English US — Ryan (Studio)',
    language: 'English',
    locale: 'en-US',
    gender: 'Male',
    quality: 'high',
    sizeMB: 115,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ryan/high',
  },
  {
    id: 'en_US-ryan-medium',
    name: 'English US — Ryan',
    language: 'English',
    locale: 'en-US',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 41,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ryan/medium',
  },
  {
    id: 'en_US-amy-medium',
    name: 'English US — Amy',
    language: 'English',
    locale: 'en-US',
    gender: 'Female',
    quality: 'medium',
    sizeMB: 38,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/amy/medium',
  },
  {
    id: 'en_US-bryce-medium',
    name: 'English US — Bryce',
    language: 'English',
    locale: 'en-US',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 40,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/bryce/medium',
  },
  {
    id: 'en_GB-alan-medium',
    name: 'English UK — Alan',
    language: 'English',
    locale: 'en-GB',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 38,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_GB/alan/medium',
  },
  {
    id: 'en_GB-alba-medium',
    name: 'English UK — Alba',
    language: 'English',
    locale: 'en-GB',
    gender: 'Female',
    quality: 'medium',
    sizeMB: 40,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_GB/alba/medium',
  },

  // --- OTROS IDIOMAS ---
  {
    id: 'fr_FR-siwis-medium',
    name: 'Français — Siwis',
    language: 'Français',
    locale: 'fr-FR',
    gender: 'Female',
    quality: 'medium',
    sizeMB: 43,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis/medium',
  },
  {
    id: 'de_DE-thorsten-high',
    name: 'Deutsch — Thorsten (Studio)',
    language: 'Deutsch',
    locale: 'de-DE',
    gender: 'Male',
    quality: 'high',
    sizeMB: 110,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/de/de_DE/thorsten/high',
  },
  {
    id: 'pt_BR-faber-medium',
    name: 'Português Brasil — Faber',
    language: 'Português',
    locale: 'pt-BR',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 38,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/pt/pt_BR/faber/medium',
  },
  {
    id: 'it_IT-riccardo-medium',
    name: 'Italiano — Riccardo',
    language: 'Italiano',
    locale: 'it-IT',
    gender: 'Male',
    quality: 'medium',
    sizeMB: 39,
    huggingFaceUrl: 'https://huggingface.co/rhasspy/piper-voices/tree/main/it/it_IT/riccardo/medium',
  },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  piperBinaryPath: '',
  piperModelsDir: '%APPDATA%\\WinTTS\\piper\\models',
  enablePiper: true,
  installedPiperModels: [
    'es_AR-daniela-high',
    'es_MX-claude-high',
    'es_ES-davefx-medium',
    'es_ES-sharvard-medium',
    'es_MX-ald-medium',
  ],
  systemVoiceLanguages: ['es'],
  sampleRate: 22050,
  stripEmojis: true,
  stripCodeBlocks: true,
  defaultSavePrefix: 'WinTTS-',
};
