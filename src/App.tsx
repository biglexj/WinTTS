import React, { useState, useEffect, useCallback } from 'react';
import { TitleBar } from './components/TitleBar/TitleBar';
import { SettingsSidebar } from './components/SettingsSidebar/SettingsSidebar';
import { NarrationEditor } from './components/NarrationEditor/NarrationEditor';
import { StatusBar } from './components/StatusBar/StatusBar';
import { DropOverlay } from './components/DropZone/DropOverlay';
import { SettingsModal } from './components/SettingsModal/SettingsModal';
import { AboutModal } from './components/AboutModal/AboutModal';
import { useSpeech } from './hooks/useSpeech';
import { useDocument } from './hooks/useDocument';
import { useFileDrop } from './hooks/useFileDrop';
import { tauriBridge } from './services/tauriBridge';
import type { AppSettings, SpeechSettings, SystemVoice } from './types';
import './styles/global.css';

export const App: React.FC = () => {
  const [appSettings, setAppSettings] = useState<AppSettings>(() => tauriBridge.loadAppSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const [voices, setVoices] = useState<SystemVoice[]>([]);
  const [settings, setSettings] = useState<SpeechSettings>({
    voiceName: null,
    volume: 100,
    rate: 0,
    pitch: 0,
  });
  const [isExporting, setIsExporting] = useState(false);

  const {
    playbackState,
    statusText,
    setStatusText,
    progressPercent,
    speak,
    pause,
    resume,
    stop,
  } = useSpeech();

  const {
    markdown,
    setMarkdown,
    skippedRanges,
    updateSelection,
    markSelectionSkipped,
    includeSelection,
    clearSkips,
    getReadableText,
    getReadableSelection,
    stats,
  } = useDocument();

  // Load available system and neural voices on startup and when Piper is toggled
  const loadVoices = useCallback(async (enablePiper: boolean, installedModels: string[]) => {
    try {
      const list = await tauriBridge.getVoices(enablePiper, installedModels);
      setVoices(list);
      if (list.length > 0) {
        setSettings((prev) => ({
          ...prev,
          voiceName: prev.voiceName && list.some((v) => v.name === prev.voiceName) ? prev.voiceName : list[0].name,
        }));
      } else {
        setStatusText('No se encontraron voces habilitadas en el sistema.');
      }
    } catch (err) {
      setStatusText(`Error al cargar voces: ${String(err)}`);
    }
  }, [setStatusText]);

  useEffect(() => {
    loadVoices(appSettings.enablePiper, appSettings.installedPiperModels);
  }, [loadVoices, appSettings.enablePiper, appSettings.installedPiperModels]);

  // Handle Save Settings from Modal
  const handleSaveAppSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    tauriBridge.saveAppSettings(newSettings);
    loadVoices(newSettings.enablePiper, newSettings.installedPiperModels);
    setStatusText('Configuración actualizada correctamente.');
  };

  // Drag & Drop Handler
  const handleFileLoaded = useCallback(
    (content: string, filename: string) => {
      setMarkdown(content);
      clearSkips();
      setStatusText(`Archivo cargado: ${filename}`);
    },
    [setMarkdown, clearSkips, setStatusText]
  );

  const handleFileError = useCallback(
    (msg: string) => {
      setStatusText(msg);
    },
    [setStatusText]
  );

  const { isDragging } = useFileDrop({
    onFileLoaded: handleFileLoaded,
    onError: handleFileError,
  });

  // Play / Pause Toggle
  const handlePlayPause = useCallback(() => {
    if (playbackState === 'speaking') {
      pause();
    } else if (playbackState === 'paused') {
      resume();
    } else {
      const readable = getReadableText();
      speak(readable, settings, 'Leyendo documento');
    }
  }, [playbackState, pause, resume, speak, getReadableText, settings]);

  // Read Selection Only
  const handleReadSelection = useCallback(() => {
    const text = getReadableSelection();
    if (!text.trim()) {
      setStatusText('Selecciona primero el fragmento que deseas leer.');
      return;
    }
    speak(text, settings, 'Leyendo selección');
  }, [getReadableSelection, speak, settings, setStatusText]);

  // Mark Selection as Skipped
  const handleSkipSelection = useCallback(() => {
    const success = markSelectionSkipped();
    setStatusText(
      success
        ? 'La selección se omitirá en lectura y exportación.'
        : 'Selecciona primero el fragmento que deseas omitir.'
    );
  }, [markSelectionSkipped, setStatusText]);

  // Re-include Selection
  const handleIncludeSelection = useCallback(() => {
    const success = includeSelection();
    setStatusText(
      success
        ? 'La selección volverá a incluirse.'
        : 'Selecciona primero el fragmento que deseas incluir.'
    );
  }, [includeSelection, setStatusText]);

  // Clear all skips
  const handleClearSkips = useCallback(() => {
    clearSkips();
    setStatusText('Se eliminaron todas las omisiones.');
  }, [clearSkips, setStatusText]);

  // Export to WAV / MP3
  const handleExportAudio = useCallback(
    async (format: 'wav' | 'mp3') => {
      const text = getReadableText();
      if (!text.trim()) {
        setStatusText('No hay texto legible para exportar.');
        return;
      }

      try {
        const savePath = await tauriBridge.saveAudioDialog(format, appSettings.defaultSavePrefix);
        if (!savePath) return;

        setIsExporting(true);
        setStatusText(`Generando audio ${format.toUpperCase()}…`);

        await tauriBridge.exportAudio(text, savePath, settings, format);
        setStatusText(`Audio ${format.toUpperCase()} guardado exitosamente.`);
      } catch (err) {
        setStatusText(`Error al exportar audio: ${String(err)}`);
      } finally {
        setIsExporting(false);
      }
    },
    [getReadableText, settings, setStatusText, appSettings.defaultSavePrefix]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        stop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, stop]);

  return (
    <div className="app-container">
      <DropOverlay isVisible={isDragging} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appSettings}
        onSaveSettings={handleSaveAppSettings}
        availableVoices={voices}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <TitleBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <main style={{ display: 'flex', gap: '18px', padding: '8px 20px 14px 20px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <SettingsSidebar
          voices={voices}
          settings={settings}
          onSettingsChange={setSettings}
          playbackState={playbackState}
          onPlayPause={handlePlayPause}
          onStop={stop}
          onExport={handleExportAudio}
          isExporting={isExporting}
          enablePiper={appSettings.enablePiper}
          systemVoiceLanguages={appSettings.systemVoiceLanguages}
        />

        <NarrationEditor
          markdown={markdown}
          onMarkdownChange={setMarkdown}
          skippedRanges={skippedRanges}
          stats={stats}
          onSelectionChange={updateSelection}
          onReadSelection={handleReadSelection}
          onSkipSelection={handleSkipSelection}
          onIncludeSelection={handleIncludeSelection}
          onClearSkips={handleClearSkips}
        />
      </main>

      <StatusBar
        statusText={statusText}
        playbackState={playbackState}
        progressPercent={progressPercent}
      />
    </div>
  );
};

export default App;
