import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { save, open } from '@tauri-apps/plugin-dialog';
import { openUrl as tauriOpenUrl } from '@tauri-apps/plugin-opener';
import {
  type AppSettings,
  DEFAULT_APP_SETTINGS,
  PIPER_POPULAR_MODELS,
  type DocumentStats,
  type FileImportResult,
  type SpeechSettings,
  type SystemVoice,
} from '../types';

export const isTauri = () => '__TAURI_INTERNALS__' in window;

const SETTINGS_STORAGE_KEY = 'wintts_app_settings_v2';

export const tauriBridge = {
  // Voice Listing
  async getVoices(enablePiper: boolean = true, installedPiperIds?: string[]): Promise<SystemVoice[]> {
    let systemVoices: SystemVoice[] = [];

    if (!isTauri()) {
      systemVoices = await new Promise((resolve) => {
        const loadBrowserVoices = () => {
          const synthVoices = window.speechSynthesis?.getVoices() || [];
          const list: SystemVoice[] = synthVoices.map((v) => ({
            id: v.voiceURI,
            name: v.name,
            culture: v.lang,
            gender: 'Neutral',
            provider: 'system',
          }));
          resolve(list);
        };

        if (window.speechSynthesis?.getVoices().length) {
          loadBrowserVoices();
        } else if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = loadBrowserVoices;
          setTimeout(loadBrowserVoices, 500);
        } else {
          resolve([]);
        }
      });
    } else {
      try {
        systemVoices = await invoke<SystemVoice[]>('get_available_voices');
      } catch (e) {
        console.error('Error al obtener voces de Tauri:', e);
        systemVoices = [];
      }
    }

    if (!enablePiper) {
      return systemVoices;
    }

    const effectiveInstalled =
      installedPiperIds !== undefined
        ? installedPiperIds
        : this.loadAppSettings().installedPiperModels || [];

    const piperVoices: SystemVoice[] = effectiveInstalled.map((id) => {
      const catalogItem = PIPER_POPULAR_MODELS.find((m) => m.id === id);
      if (catalogItem) {
        return {
          id: `piper-${catalogItem.id}`,
          name: `Piper Neural — ${catalogItem.name}`,
          culture: catalogItem.locale,
          gender: catalogItem.gender,
          provider: 'piper',
        };
      }
      return {
        id: `piper-${id}`,
        name: `Piper Neural — ${id}`,
        culture: 'es-ES',
        gender: 'Neutral',
        provider: 'piper',
      };
    });

    return [...systemVoices, ...piperVoices];
  },

  async preprocessText(markdown: string): Promise<string> {
    if (!isTauri()) {
      return markdown.replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, '').trim();
    }
    try {
      return await invoke<string>('preprocess_text', { markdown });
    } catch {
      return markdown;
    }
  },

  async getDocumentStats(text: string): Promise<DocumentStats> {
    if (!isTauri()) {
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const chars = text.length;
      const estimated_minutes = Math.max(1, Math.ceil(words / 160));
      return { word_count: words, char_count: chars, estimated_minutes };
    }
    try {
      return await invoke<DocumentStats>('get_document_stats', { text });
    } catch {
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      return { word_count: words, char_count: text.length, estimated_minutes: Math.max(1, Math.ceil(words / 160)) };
    }
  },

  async readFile(filePath: string): Promise<FileImportResult> {
    return await invoke<FileImportResult>('read_text_file', { filePath });
  },

  async saveAudioDialog(format: 'wav' | 'mp3' = 'wav', prefix: string = 'WinTTS-'): Promise<string | null> {
    const ext = format.toLowerCase();
    const defaultName = `${prefix}${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15)}.${ext}`;
    const filterName = ext === 'mp3' ? 'Audio MP3 (*.mp3)' : 'Audio WAV (*.wav)';
    return await save({
      title: `Exportar narración ${ext.toUpperCase()}`,
      defaultPath: defaultName,
      filters: [{ name: filterName, extensions: [ext] }],
    });
  },

  async saveWavDialog(prefix: string = 'WinTTS-'): Promise<string | null> {
    return this.saveAudioDialog('wav', prefix);
  },

  async exportAudio(text: string, filePath: string, settings: SpeechSettings, format: 'wav' | 'mp3' = 'wav'): Promise<string> {
    if (!isTauri()) {
      return filePath;
    }
    return await invoke<string>('export_audio', { text, filePath, settings, format });
  },

  async exportWav(text: string, filePath: string, settings: SpeechSettings): Promise<string> {
    return this.exportAudio(text, filePath, settings, 'wav');
  },

  async pickExecutableFile(): Promise<string | null> {
    const selected = await open({
      title: 'Seleccionar ejecutable de Piper (piper.exe / piper)',
      multiple: false,
      directory: false,
      filters: [{ name: 'Ejecutable', extensions: ['exe', 'bin', '*'] }],
    });
    return typeof selected === 'string' ? selected : null;
  },

  async pickDirectory(): Promise<string | null> {
    const selected = await open({
      title: 'Seleccionar directorio de modelos Piper ONNX',
      multiple: false,
      directory: true,
    });
    return typeof selected === 'string' ? selected : null;
  },

  async openExternalUrl(url: string) {
    if (isTauri()) {
      try {
        await tauriOpenUrl(url);
        return;
      } catch (err) {
        console.warn('Fallback opening URL in browser:', err);
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  // Settings Storage
  loadAppSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('Error loading settings from localStorage:', err);
    }
    return DEFAULT_APP_SETTINGS;
  },

  saveAppSettings(settings: AppSettings) {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('Error saving settings to localStorage:', err);
    }
  },

  // Window Controls
  async minimizeWindow() {
    if (isTauri()) {
      await getCurrentWindow().minimize();
    }
  },

  async toggleMaximizeWindow() {
    if (isTauri()) {
      await getCurrentWindow().toggleMaximize();
    }
  },

  async closeWindow() {
    if (isTauri()) {
      await getCurrentWindow().close();
    }
  },

  async startDraggingWindow() {
    if (isTauri()) {
      await getCurrentWindow().startDragging();
    }
  },
};
