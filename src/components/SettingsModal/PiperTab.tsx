import React, { useState, useMemo, useRef, useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appCacheDir } from '@tauri-apps/api/path';
import {
  type AppSettings,
  type PiperCatalogModel,
  PIPER_POPULAR_MODELS,
} from '../../types';
import { tauriBridge, isTauri } from '../../services/tauriBridge';
import type { PiperController } from '../../hooks/usePiper';
import {
  FolderOpen,
  ShieldCheck,
  Download,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Cpu,
  Trash2,
  Play,
  AlertTriangle,
} from 'lucide-react';

interface PiperTabProps {
  formState: AppSettings;
  setFormState: React.Dispatch<React.SetStateAction<AppSettings>>;
  onSaveSettings: (newSettings: AppSettings) => void;
  piper: PiperController;
}

export const PiperTab: React.FC<PiperTabProps> = ({
  formState,
  setFormState,
  onSaveSettings,
  piper,
}) => {
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredModels = useMemo(() => {
    if (languageFilter === 'all') return PIPER_POPULAR_MODELS;
    return PIPER_POPULAR_MODELS.filter(
      (m) => m.language.toLowerCase() === languageFilter.toLowerCase()
    );
  }, [languageFilter]);

  const installedIds = useMemo(
    () => new Set(piper.installed.map((m) => m.id)),
    [piper.installed]
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePickPiperBinary = async () => {
    try {
      const selected = await tauriBridge.pickExecutableFile();
      if (selected) {
        const next = { ...formState, piperBinaryPath: selected };
        setFormState(next);
        onSaveSettings(next);
      }
    } catch (err) {
      console.error('Error picking binary:', err);
    }
  };

  const handlePickModelsDir = async () => {
    try {
      const selected = await tauriBridge.pickDirectory();
      if (selected) {
        const next = { ...formState, piperModelsDir: selected };
        setFormState(next);
        onSaveSettings(next);
      }
    } catch (err) {
      console.error('Error picking directory:', err);
    }
  };

  const handleResetModelsDirToAppData = () => {
    const next = { ...formState, piperModelsDir: '' };
    setFormState(next);
    onSaveSettings(next);
  };

  const handleInstallModel = async (model: PiperCatalogModel) => {
    await piper.downloadModel(model);
  };

  const handleUninstallModel = async (modelId: string) => {
    await piper.uninstallModel(modelId);
  };

  /** Sintetiza una frase corta con el motor para comprobar que todo funciona. */
  const handleTestEngine = async () => {
    setTestStatus('');

    if (!piper.engineReady) {
      setTestStatus('Indica la ruta de piper.exe antes de probar el motor.');
      return;
    }

    const firstInstalled = piper.installed[0];
    if (!firstInstalled) {
      setTestStatus('Descarga al menos un modelo para poder probar el motor.');
      return;
    }

    setIsTesting(true);
    try {
      const cacheDir = isTauri() ? await appCacheDir() : '';
      const outputPath = `${cacheDir}\\piper_test_${Date.now()}.wav`;

      await tauriBridge.synthesizeWithPiper(
        formState.piperBinaryPath,
        firstInstalled.path,
        'WinTTS, prueba de voz neural.',
        outputPath,
        1.0
      );

      if (!isTauri()) {
        setTestStatus('La prueba de voz solo funciona en la aplicación de escritorio.');
        return;
      }

      const audio = new Audio(convertFileSrc(outputPath));
      audioRef.current = audio;
      audio.onended = () => {
        setTestStatus('Prueba correcta: el motor Piper genero y reprodujo el audio.');
        audioRef.current = null;
      };
      audio.onerror = () => {
        setTestStatus('El audio se genero, pero no se pudo reproducir.');
        audioRef.current = null;
      };
      await audio.play();
      setTestStatus('Reproduciendo la prueba…');
    } catch (err) {
      setTestStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="tab-content animate-fade">
      {/* Estado real del motor */}
      <div className={`info-banner engine-status ${piper.engineReady ? 'engine-status-ok' : 'engine-status-warn'}`}>
        {piper.engineReady ? <ShieldCheck size={18} className="info-banner-icon" /> : <AlertTriangle size={18} className="info-banner-icon" />}
        <p>
          {piper.engineReady ? (
            <>
              <strong>Motor Piper operativo.</strong> Las voces neuronales descargadas en este equipo se
              sintetizan de forma local y sin conexión.
            </>
          ) : (
            <>
              <strong>Motor Piper sin configurar.</strong> Indica dónde está <code>piper.exe</code>. Hasta
              entonces las voces neuronales no pueden sonar: la aplicación no las usará en silencio.
            </>
          )}
        </p>
      </div>

      {piper.error && (
        <div className="info-banner engine-status engine-status-warn">
          <AlertTriangle size={18} className="info-banner-icon" />
          <p>{piper.error}</p>
        </div>
      )}

      {/* Ejecutable */}
      <div className="setting-group">
        <label className="setting-label">Ejecutable de Piper (piper.exe)</label>
        <div className="setting-desc">
          Motor de sintesis local. Descargalo desde el proyecto oficial de Piper y apunta aqui a su ruta.
          Funciona tanto con el ejecutable <code>piper.exe</code> clasico como con el modulo
          <code>piper</code> de Python: se invocan con <code>--model</code>, <code>--output_file</code> y
          <code>--length_scale</code>, que ambas generaciones aceptan.
        </div>
        <div className="input-with-button">
          <input
            type="text"
            className="setting-input"
            placeholder="Ruta de piper.exe"
            value={formState.piperBinaryPath}
            onChange={(e) => setFormState((prev) => ({ ...prev, piperBinaryPath: e.target.value }))}
          />
          <button type="button" className="btn-base btn-examine" onClick={handlePickPiperBinary}>
            <FolderOpen size={14} />
            <span>Examinar…</span>
          </button>
          <button
            type="button"
            className="btn-base btn-test-engine"
            onClick={handleTestEngine}
            disabled={isTesting}
            title="Sintetiza una frase de prueba con el primer modelo instalado"
          >
            <Play size={14} />
            <span>{isTesting ? 'Probando…' : 'Probar'}</span>
          </button>
        </div>
        {testStatus && <div className="setting-desc engine-test-status">{testStatus}</div>}
      </div>

      {/* Carpeta de modelos */}
      <div className="setting-group">
        <div className="label-with-action">
          <div>
            <label className="setting-label">Carpeta de modelos neuronales</label>
            <div className="setting-desc">
              Directorio local donde se guardan los pesos <code>.onnx</code> y su configuracion.
            </div>
          </div>
          <button
            type="button"
            className="link-reset-btn"
            onClick={handleResetModelsDirToAppData}
            title="Usar la carpeta de datos de la aplicación"
          >
            <RotateCcw size={11} />
            <span>Ruta por defecto</span>
          </button>
        </div>
        <div className="input-with-button">
          <input
            type="text"
            className="setting-input"
            value={formState.piperModelsDir}
            onChange={(e) => setFormState((prev) => ({ ...prev, piperModelsDir: e.target.value }))}
          />
          <button type="button" className="btn-base btn-examine" onClick={handlePickModelsDir}>
            <FolderOpen size={14} />
            <span>Examinar…</span>
          </button>
        </div>
        {piper.modelsDir && (
          <div className="setting-desc engine-effective-path">
            <Cpu size={12} />
            <span>Carpeta efectiva: {piper.modelsDir}</span>
          </div>
        )}
      </div>

      {/* Catalogo */}
      <div className="models-catalog-section">
        <div className="catalog-header">
          <div className="catalog-title-wrap">
            <Sparkles size={14} className="catalog-sparkle" />
            <span className="catalog-title">Catalogo de Voces Neuronales (Hugging Face)</span>
          </div>

          <div className="filter-chips">
            {['all', 'Español', 'English', 'Français', 'Deutsch', 'Português', 'Italiano'].map((lang) => (
              <button
                key={lang}
                type="button"
                className={`chip-btn ${languageFilter === lang ? 'chip-active' : ''}`}
                onClick={() => setLanguageFilter(lang)}
              >
                {lang === 'all' ? 'Todos' : lang}
              </button>
            ))}
          </div>
        </div>

        <div className="models-list">
          {filteredModels.map((model) => {
            const isInstalled = installedIds.has(model.id);
            const isDownloading = piper.download?.modelId === model.id;
            const progress = isDownloading ? piper.download : null;
            const percent =
              progress && progress.total > 0
                ? Math.min(100, Math.round((progress.downloaded / progress.total) * 100))
                : 0;

            return (
              <div key={model.id} className="model-card">
                <div className="model-card-info">
                  <div className="model-card-name-row">
                    <span className="model-card-name">{model.name}</span>
                    <span className="model-quality-badge">{model.quality.toUpperCase()}</span>
                  </div>
                  <div className="model-card-meta">
                    <span>{model.locale}</span>
                    <span>•</span>
                    <span>{model.gender === 'Female' ? 'Mujer' : 'Hombre'}</span>
                    <span>•</span>
                    <span>~{model.sizeMB} MB</span>
                  </div>

                  {progress && (
                    <div className="download-progress">
                      <div className="download-progress-track">
                        <div className="download-progress-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="download-progress-label">
                        {percent}% · {(progress.downloaded / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  )}
                </div>

                <div className="model-card-actions">
                  <a
                    className="btn-huggingface"
                    href={model.huggingFaceUrl}
                    onClick={(e) => {
                      e.preventDefault();
                      tauriBridge.openExternalUrl(model.huggingFaceUrl);
                    }}
                    title="Ver en Hugging Face"
                  >
                    <ExternalLink size={13} />
                  </a>

                  {isInstalled ? (
                    <button
                      type="button"
                      className="btn-installed"
                      onClick={() => handleUninstallModel(model.id)}
                      title="Eliminar el modelo de este equipo"
                    >
                      <Trash2 size={13} />
                      <span>Instalado</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-install"
                      onClick={() => handleInstallModel(model)}
                      disabled={isDownloading}
                    >
                      <Download size={13} />
                      <span>{isDownloading ? 'Descargando…' : 'Descargar'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
