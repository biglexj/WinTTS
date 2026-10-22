import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { usePiper } from './hooks/usePiper';
import { tauriBridge } from './services/tauriBridge';
import type { AppSettings, SpeechSettings, SystemVoice } from './types';
import './styles/global.css';

export const App: React.FC = () => {
  const [appSettings, setAppSettings] = useState<AppSettings>(() => tauriBridge.loadAppSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const [voices, setVoices] = useState<SystemVoice[]>([]);
  const [settings, setSettings] = useState<SpeechSettings>(() => tauriBridge.loadSpeechSettings());
  const [isExporting, setIsExporting] = useState(false);

  const piper = usePiper(appSettings);

  const {
    playbackState,
    statusText,
    setStatusText,
    progressPercent,
    speak,
    pause,
    resume,
    stop,
    synthesizeWithPiper,
  } = useSpeech(piper.runtime);

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
    loadDocument,
    openDocument,
    saveDocument,
    saveDocumentAs,
    filePath,
    fileName,
    isDirty,
    stats,
  } = useDocument();

  const installedPiperIds = useMemo(() => piper.installed.map((m) => m.id), [piper.installed]);
  const installedPiperKey = installedPiperIds.join('|');

  // Load available system and neural voices on startup and when Piper changes
  const loadVoices = useCallback(
    async (enablePiper: boolean, installedModels: string[]) => {
      try {
        const list = await tauriBridge.getVoices(enablePiper, installedModels);
        setVoices(list);
        if (list.length > 0) {
          setSettings((prev) => ({
            ...prev,
            voiceName:
              prev.voiceName && list.some((v) => v.name === prev.voiceName)
                ? prev.voiceName
                : list[0].name,
          }));
        } else {
          setStatusText('No se encontraron voces habilitadas en el sistema.');
        }
      } catch (err) {
        setStatusText(`Error al cargar voces: ${String(err)}`);
      }
    },
    [setStatusText]
  );

  useEffect(() => {
    loadVoices(appSettings.enablePiper, installedPiperIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadVoices, appSettings.enablePiper, installedPiperKey]);

  // La lista de modelos instalados en disco es la fuente de verdad.
  useEffect(() => {
    setAppSettings((prev) => {
      if (
        prev.installedPiperModels.length === installedPiperIds.length &&
        prev.installedPiperModels.every((id, index) => id === installedPiperIds[index])
      ) {
        return prev;
      }
      return { ...prev, installedPiperModels: installedPiperIds };
    });
  }, [installedPiperKey, installedPiperIds]);

  useEffect(() => {
    tauriBridge.saveAppSettings(appSettings);
  }, [appSettings]);

  // Si la voz seleccionada desaparece (por ejemplo, se desinstala su modelo),
  // se avisa en lugar de cambiar de motor en silencio.
  useEffect(() => {
    if (!settings.voiceName || voices.length === 0) return;
    if (!voices.some((v) => v.name === settings.voiceName)) {
      setStatusText(
        `La voz '${settings.voiceName}' ya no está disponible en este equipo. Se usará la primera voz habilitada.`
      );
    }
  }, [voices, settings.voiceName, setStatusText]);

  // Persistencia de la configuracion de voz.
  useEffect(() => {
    tauriBridge.saveSpeechSettings(settings);
  }, [settings]);

  const selectedVoice = useMemo(
    () => voices.find((v) => v.name === settings.voiceName),
    [voices, settings.voiceName]
  );

  // Handle Save Settings from Modal
  const handleSaveAppSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    tauriBridge.saveAppSettings(newSettings);
    setStatusText('Configuración actualizada correctamente.');
  };

  // Drag & Drop Handler
  const handleFileLoaded = useCallback(
    (content: string, filename: string) => {
      loadDocument(content, null, filename);
      setStatusText(`Archivo cargado: ${filename} (aún sin guardar en disco)`);
    },
    [loadDocument, setStatusText]
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
      speak(readable, settings, 'Leyendo documento', selectedVoice);
    }
  }, [playbackState, pause, resume, speak, getReadableText, settings, selectedVoice]);

  // Read Selection Only
  const handleReadSelection = useCallback(() => {
    const text = getReadableSelection();
    if (!text.trim()) {
      setStatusText('Selecciona primero el fragmento que deseas leer.');
      return;
    }
    speak(text, settings, 'Leyendo selección', selectedVoice);
  }, [getReadableSelection, speak, settings, selectedVoice, setStatusText]);

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
      success ? 'La selección volverá a incluirse.' : 'Selecciona primero el fragmento que deseas incluir.'
    );
  }, [includeSelection, setStatusText]);

  // Clear all skips
  const handleClearSkips = useCallback(() => {
    clearSkips();
    setStatusText('Se eliminaron todas las omisiones.');
  }, [clearSkips, setStatusText]);

  // Open / Save
  const handleOpenDocument = useCallback(async () => {
    const opened = await openDocument();
    setStatusText(opened ? 'Documento abierto.' : 'No se abrió ningún documento.');
  }, [openDocument, setStatusText]);

  const handleSaveDocument = useCallback(async () => {
    const saved = await saveDocument();
    setStatusText(saved ? 'Documento guardado.' : 'No se pudo guardar el documento.');
  }, [saveDocument, setStatusText]);

  const handleSaveDocumentAs = useCallback(async () => {
    const saved = await saveDocumentAs();
    setStatusText(saved ? 'Documento guardado.' : 'No se pudo guardar el documento.');
  }, [saveDocumentAs, setStatusText]);

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

        if (selectedVoice?.provider === 'piper') {
          // El motor neural ya produce un WAV: se reutiliza para la entrega.
          const cleanText = await tauriBridge.preprocessText(text);
          const wavPath = await synthesizeWithPiper(cleanText, settings, selectedVoice);
          await tauriBridge.exportAudioFile(wavPath, savePath, format);
        } else {
          await tauriBridge.exportAudio(text, savePath, settings, format);
        }

        setStatusText(`Audio ${format.toUpperCase()} guardado exitosamente.`);
      } catch (err) {
        setStatusText(`Error al exportar audio: ${String(err)}`);
      } finally {
        setIsExporting(false);
      }
    },
    [getReadableText, settings, setStatusText, appSettings.defaultSavePrefix, selectedVoice, synthesizeWithPiper]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          void handleSaveDocumentAs();
        } else {
          void handleSaveDocument();
        }
      } else if (ctrl && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        void handleOpenDocument();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        stop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, stop, handleSaveDocument, handleSaveDocumentAs, handleOpenDocument]);

  return (
    <div className="app-container">
      <DropOverlay isVisible={isDragging} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appSettings}
        onSaveSettings={handleSaveAppSettings}
        availableVoices={voices}
        piper={piper}
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
          piperEngineReady={piper.engineReady}
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
          fileName={fileName}
          filePath={filePath}
          isDirty={isDirty}
          onOpenDocument={handleOpenDocument}
          onSaveDocument={handleSaveDocument}
          onSaveDocumentAs={handleSaveDocumentAs}
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
