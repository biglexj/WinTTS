import React, { useState, useRef, useEffect } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appCacheDir } from '@tauri-apps/api/path';
import {
  type AppSettings,
  DEFAULT_PIPER_MODEL_ID,
  PIPER_ENGINE_SIZE_MB,
  PIPER_POPULAR_MODELS,
} from '../../types';
import { tauriBridge, isTauri } from '../../services/tauriBridge';
import type { PiperController } from '../../hooks/usePiper';
import {
  FolderOpen,
  ShieldCheck,
  Download,
  RotateCcw,
  Sparkles,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { PiperCatalog } from './PiperCatalog';

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
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<string>('');
  const [installStatus, setInstallStatus] = useState<string>('');
  const [modelsDirDraft, setModelsDirDraft] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        setModelsDirDraft(null);
        setFormState(next);
        onSaveSettings(next);
      }
    } catch (err) {
      console.error('Error picking directory:', err);
    }
  };

  const handleResetModelsDirToAppData = () => {
    setModelsDirDraft(null);
    const next = { ...formState, piperModelsDir: '' };
    setFormState(next);
    onSaveSettings(next);
  };

  /**
   * Instala el motor de Piper dentro de la carpeta de datos de la aplicacion.
   *
   * Al aparecer el ejecutable, la configuracion se actualiza sola y se
   * descarga la voz por defecto para que el motor pueda usarse de inmediato.
   */
  const handleInstallEngine = async () => {
    setInstallStatus('');

    const path = await piper.installEngine();
    if (!path) {
      setInstallStatus('No se pudo instalar el motor de Piper.');
      return;
    }

    const next = { ...formState, piperBinaryPath: path };
    setFormState(next);
    onSaveSettings(next);
    setInstallStatus('Motor Piper instalado. Descargando la voz por defecto…');

    const defaultModel = PIPER_POPULAR_MODELS.find((model) => model.id === DEFAULT_PIPER_MODEL_ID);
    if (!defaultModel) {
      setInstallStatus('Motor Piper instalado. Elige una voz del catalogo.');
      return;
    }

    const downloaded = await piper.downloadModel(defaultModel);
    setInstallStatus(
      downloaded
        ? `Motor Piper instalado y voz «${defaultModel.name}» descargada.`
        : 'Motor Piper instalado, pero no se pudo descargar la voz por defecto.'
    );
  };

  /** Sintetiza una frase corta con el motor para comprobar que todo funciona. */
  const handleTestEngine = async () => {
    setTestStatus('');

    if (!piper.engineReady) {
      setTestStatus('Instala el motor de Piper o indica la ruta de piper.exe antes de probarlo.');
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
    <div className="settings-columns piper-layout animate-fade">
      <div className="settings-column piper-setup">
      {/* Estado real del motor */}
      <div className={`info-banner engine-status ${piper.engineReady ? 'engine-status-ok' : 'engine-status-info'}`}>
        {piper.engineReady ? <ShieldCheck size={18} className="info-banner-icon" /> : <Sparkles size={18} className="info-banner-icon" />}
        <p>
          {piper.engineReady ? (
            <>
              <strong>Piper está listo.</strong> Puedes usar las voces descargadas.
            </>
          ) : (
            <>
              Instala Piper para usar voces neuronales sin conexión.
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
        <label className="setting-label">Ubicación de Piper</label>
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

        {!piper.engineReady && (
          <div className="engine-install-row">
            <button
              type="button"
              className="btn-base btn-install-engine"
              onClick={handleInstallEngine}
              disabled={Boolean(piper.engineInstall)}
              title={`Descarga el motor oficial de Piper (${PIPER_ENGINE_SIZE_MB} MB) en la carpeta de datos de la aplicacion`}
            >
              <Download size={14} />
              <span>{piper.engineInstall ? 'Instalando…' : 'Instalar Piper'}</span>
            </button>
            <span className="setting-desc">
              Descarga de {PIPER_ENGINE_SIZE_MB} MB.
            </span>
          </div>
        )}

        {piper.engineInstall && (
          <div className="download-progress">
            <div className="download-progress-track">
              <div
                className="download-progress-fill"
                style={{
                  width: `${
                    piper.engineInstall.total > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (piper.engineInstall.downloaded / piper.engineInstall.total) * 100
                          )
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="download-progress-label">
              {piper.engineInstall.total > 0
                ? `${Math.min(
                    100,
                    Math.round(
                      (piper.engineInstall.downloaded / piper.engineInstall.total) * 100
                    )
                  )}% · `
                : ''}
              {(piper.engineInstall.downloaded / 1024 / 1024).toFixed(1)} MB de {PIPER_ENGINE_SIZE_MB} MB
            </span>
          </div>
        )}

        {installStatus && <div className="setting-desc engine-test-status">{installStatus}</div>}
        {testStatus && <div className="setting-desc engine-test-status">{testStatus}</div>}
      </div>

      {/* Carpeta de modelos */}
      {(piper.installed.length > 0 || Boolean(formState.piperModelsDir)) && (
      <div className="setting-group">
        <div className="label-with-action">
          <div>
            <label className="setting-label">Carpeta de voces</label>
          </div>
          <button
            type="button"
            className="link-reset-btn"
            onClick={handleResetModelsDirToAppData}
            title="Usar la carpeta de datos de la aplicación"
          >
            <RotateCcw size={11} />
            <span>Restablecer</span>
          </button>
        </div>
        <div className="input-with-button">
          <input
            type="text"
            className="setting-input"
            aria-label="Carpeta de voces"
            title={modelsDirDraft ?? (formState.piperModelsDir || piper.modelsDir)}
            value={modelsDirDraft ?? (formState.piperModelsDir || piper.modelsDir)}
            onChange={(e) => {
              setModelsDirDraft(e.target.value);
              setFormState((prev) => ({ ...prev, piperModelsDir: e.target.value }));
            }}
          />
          <button type="button" className="btn-base btn-examine" onClick={handlePickModelsDir}>
            <FolderOpen size={14} />
            <span>Examinar…</span>
          </button>
        </div>
      </div>
      )}

      </div>
      <PiperCatalog piper={piper} />
    </div>
  );
};
