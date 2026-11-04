import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { save, open } from '@tauri-apps/plugin-dialog';
import { openUrl as tauriOpenUrl } from '@tauri-apps/plugin-opener';
import {
  type AppSettings,
  DEFAULT_APP_SETTINGS,
  PIPER_POPULAR_MODELS,
  type DocumentStats,
  type FileImportResult,
  type PiperInstalledModel,
  type SpeechSettings,
  type SystemVoice,
} from '../types';

export const isTauri = () => '__TAURI_INTERNALS__' in window;

const SETTINGS_STORAGE_KEY = 'wintts_app_settings_v2';
const SPEECH_SETTINGS_KEY = 'wintts_speech_settings_v1';

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  voiceName: null,
  volume: 100,
  rate: 0,
  pitch: 0,
};

export interface PiperDownloadProgress {
  modelId: string;
  downloaded: number;
  total: number;
}

/** Progreso de la descarga del motor de Piper. */
export interface PiperEngineProgress {
  downloaded: number;
  total: number;
}

/** Forma real del evento emitido por el backend (snake_case). */
interface PiperDownloadEvent {
  model_id: string;
  downloaded: number;
  total: number;
}

export const tauriBridge = {
  // Voice Listing
  /**
   * Voces disponibles. Las voces neuronales solo se ofrecen cuando el motor
   * de Piper esta instalado: sin motor no se pueden sintetizar.
   */
  async getVoices(piperEngineReady: boolean = false, installedPiperIds?: string[]): Promise<SystemVoice[]> {
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

    if (!piperEngineReady) {
      return systemVoices;
    }

    const effectiveInstalled =
      installedPiperIds !== undefined
        ? installedPiperIds
        : this.loadAppSettings().installedPiperModels || [];

    // Solo se ofrecen las voces cuyo modelo esta realmente en disco.
    const piperVoices: SystemVoice[] = effectiveInstalled
      .map((id) => PIPER_POPULAR_MODELS.find((m) => m.id === id))
      .filter((m): m is (typeof PIPER_POPULAR_MODELS)[number] => Boolean(m))
      .map((catalogItem) => ({
        id: `piper-${catalogItem.id}`,
        name: `Piper Neural — ${catalogItem.name}`,
        culture: catalogItem.locale,
        gender: catalogItem.gender,
        provider: 'piper' as const,
      }));

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

  // --- Documentos ---------------------------------------------------

  async readFile(filePath: string): Promise<FileImportResult> {
    return await invoke<FileImportResult>('read_text_file', { filePath });
  },

  /** Guarda el contenido en una ruta concreta. */
  async saveTextFile(filePath: string, content: string): Promise<void> {
    await invoke<void>('save_text_file', { filePath, content });
  },

  /** Abre el dialogo del sistema para elegir un archivo .md / .txt. */
  async openTextFileDialog(): Promise<FileImportResult | null> {
    const selected = await open({
      title: 'Abrir documento',
      multiple: false,
      directory: false,
      filters: [{ name: 'Documentos de texto', extensions: ['md', 'markdown', 'txt'] }],
    });
    if (typeof selected !== 'string') return null;
    return this.readFile(selected);
  },

  /** Abre el dialogo del sistema para elegir donde guardar el documento. */
  async saveTextFileDialog(defaultName = 'documento.md'): Promise<string | null> {
    const selected = await save({
      title: 'Guardar documento',
      defaultPath: defaultName,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });
    return typeof selected === 'string' ? selected : null;
  },

  // --- Audio ---------------------------------------------------------

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

  async exportAudio(text: string, filePath: string, settings: SpeechSettings, format: 'wav' | 'mp3' = 'wav'): Promise<string> {
    if (!isTauri()) {
      return filePath;
    }
    return await invoke<string>('export_audio', { text, filePath, settings, format });
  },

  /** Entrega un WAV ya sintetizado (motor Piper) como archivo final. */
  async exportAudioFile(wavPath: string, filePath: string, format: 'wav' | 'mp3' = 'wav'): Promise<string> {
    if (!isTauri()) {
      return filePath;
    }
    return await invoke<string>('export_audio_file', { wavPath, filePath, format });
  },

  // --- Voces neuronales (Piper) --------------------------------------

  /** Modelos realmente presentes en disco (`.onnx` + `.onnx.json`). */
  async listPiperModels(modelsDir: string): Promise<PiperInstalledModel[]> {
    if (!isTauri()) return [];
    try {
      return await invoke<PiperInstalledModel[]>('list_piper_models', { modelsDir });
    } catch (e) {
      console.error('Error al listar modelos Piper:', e);
      return [];
    }
  },

  async piperEngineAvailable(binaryPath: string): Promise<boolean> {
    if (!isTauri()) return false;
    try {
      return await invoke<boolean>('piper_engine_available', { binaryPath });
    } catch {
      return false;
    }
  },

  /** Descarga un peso neural; emite progreso por evento. */
  async downloadPiperModel(modelId: string, url: string, destPath: string): Promise<number> {
    return await invoke<number>('download_piper_model', { modelId, url, destPath });
  },

  async removePiperModel(modelPath: string): Promise<void> {
    await invoke<void>('remove_piper_model', { modelPath });
  },

  async synthesizeWithPiper(
    binaryPath: string,
    modelPath: string,
    text: string,
    outputPath: string,
    lengthScale?: number
  ): Promise<string> {
    return await invoke<string>('synthesize_with_piper', {
      binaryPath,
      modelPath,
      text,
      outputPath,
      lengthScale,
    });
  },

  /** Escucha el evento de progreso de descarga. Devuelve la funcion de limpieza. */
  async onPiperDownloadProgress(
    handler: (progress: PiperDownloadProgress) => void
  ): Promise<() => void> {
    if (!isTauri()) return () => {};
    const unlisten = await listen<PiperDownloadEvent>('piper://download-progress', (event) => {
      handler({
        modelId: event.payload.model_id,
        downloaded: event.payload.downloaded,
        total: event.payload.total,
      });
    });
    return unlisten;
  },

  /**
   * Instala el motor de Piper dentro de la carpeta de datos de la aplicacion.
   * Devuelve la ruta del `piper.exe` instalado.
   */
  async installPiperEngine(): Promise<string> {
    return await invoke<string>('install_piper_engine');
  },

  /** Progreso de la descarga del motor de Piper. */
  async onPiperEngineProgress(
    handler: (progress: PiperEngineProgress) => void
  ): Promise<() => void> {
    if (!isTauri()) return () => {};
    const unlisten = await listen<PiperEngineProgress>('piper://engine-download-progress', (event) => {
      handler({
        downloaded: event.payload.downloaded,
        total: event.payload.total,
      });
    });
    return unlisten;
  },

  // --- Navegador y ventana --------------------------------------------

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

  // Speech Settings Storage (voz, volumen, velocidad y tono)
  loadSpeechSettings(): SpeechSettings {
    try {
      const raw = localStorage.getItem(SPEECH_SETTINGS_KEY);
      if (raw) {
        return { ...DEFAULT_SPEECH_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('Error loading speech settings:', err);
    }
    return DEFAULT_SPEECH_SETTINGS;
  },

  saveSpeechSettings(settings: SpeechSettings) {
    try {
      localStorage.setItem(SPEECH_SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('Error saving speech settings:', err);
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
