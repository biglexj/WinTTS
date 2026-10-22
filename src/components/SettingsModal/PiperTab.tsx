import React, { useState, useMemo } from 'react';
import {
  type AppSettings,
  type PiperCatalogModel,
  PIPER_POPULAR_MODELS,
  DEFAULT_APP_SETTINGS,
} from '../../types';
import { tauriBridge } from '../../services/tauriBridge';
import {
  FolderOpen,
  ShieldCheck,
  Check,
  Download,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface PiperTabProps {
  formState: AppSettings;
  setFormState: React.Dispatch<React.SetStateAction<AppSettings>>;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const PiperTab: React.FC<PiperTabProps> = ({ formState, setFormState, onSaveSettings }) => {
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filteredModels = useMemo(() => {
    if (languageFilter === 'all') return PIPER_POPULAR_MODELS;
    return PIPER_POPULAR_MODELS.filter(
      (m) => m.language.toLowerCase() === languageFilter.toLowerCase()
    );
  }, [languageFilter]);

  const handlePickPiperBinary = async () => {
    try {
      const selected = await tauriBridge.pickExecutableFile();
      if (selected) {
        setFormState((prev) => ({ ...prev, piperBinaryPath: selected }));
      }
    } catch (err) {
      console.error('Error picking binary:', err);
    }
  };

  const handlePickModelsDir = async () => {
    try {
      const selected = await tauriBridge.pickDirectory();
      if (selected) {
        setFormState((prev) => ({ ...prev, piperModelsDir: selected }));
      }
    } catch (err) {
      console.error('Error picking directory:', err);
    }
  };

  const handleResetModelsDirToAppData = () => {
    setFormState((prev) => ({
      ...prev,
      piperModelsDir: DEFAULT_APP_SETTINGS.piperModelsDir,
    }));
  };

  const handleInstallModel = (model: PiperCatalogModel) => {
    setDownloadingId(model.id);
    setTimeout(() => {
      const updatedList = Array.from(new Set([...formState.installedPiperModels, model.id]));
      const nextSettings = {
        ...formState,
        installedPiperModels: updatedList,
      };
      setFormState(nextSettings);
      onSaveSettings(nextSettings);
      setDownloadingId(null);
    }, 800);
  };

  const handleUninstallModel = (modelId: string) => {
    const updatedList = formState.installedPiperModels.filter((id) => id !== modelId);
    const nextSettings = {
      ...formState,
      installedPiperModels: updatedList,
    };
    setFormState(nextSettings);
    onSaveSettings(nextSettings);
  };

  return (
    <div className="tab-content animate-fade">
      <div className="info-banner">
        <ShieldCheck size={18} className="info-banner-icon" />
        <p>
          <strong>Almacenamiento Local:</strong> Las voces neuronales se descargan y guardan localmente en tu equipo para funcionar 100% offline y mantener la aplicación ligera.
        </p>
      </div>

      <div className="setting-row-toggle">
        <div>
          <div className="setting-label">Habilitar voces Piper en el selector</div>
          <div className="setting-desc">Muestra las voces neuronales offline en la lista de reproducción.</div>
        </div>
        <input
          type="checkbox"
          className="setting-checkbox"
          checked={formState.enablePiper}
          onChange={(e) => setFormState((prev) => ({ ...prev, enablePiper: e.target.checked }))}
        />
      </div>

      <div className="setting-group">
        <label className="setting-label">Ruta al ejecutable de Piper</label>
        <div className="setting-desc">Opcional si Piper ya está disponible en las variables de entorno del sistema.</div>
        <div className="input-with-button">
          <input
            type="text"
            className="setting-input"
            placeholder="Ruta personalizada (opcional)"
            value={formState.piperBinaryPath}
            onChange={(e) => setFormState((prev) => ({ ...prev, piperBinaryPath: e.target.value }))}
          />
          <button type="button" className="btn-base btn-examine" onClick={handlePickPiperBinary}>
            <FolderOpen size={14} />
            <span>Examinar…</span>
          </button>
        </div>
      </div>

      <div className="setting-group">
        <div className="label-with-action">
          <div>
            <label className="setting-label">Carpeta de Modelos Neuronales</label>
            <div className="setting-desc">Directorio local donde se almacenan los modelos de voz ONNX.</div>
          </div>
          <button
            type="button"
            className="link-reset-btn"
            onClick={handleResetModelsDirToAppData}
            title="Restablecer ubicación por defecto"
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
      </div>

      {/* Catálogo de Modelos Piper */}
      <div className="models-catalog-section">
        <div className="catalog-header">
          <div className="catalog-title-wrap">
            <Sparkles size={14} className="catalog-sparkle" />
            <span className="catalog-title">Catálogo de Voces Neuronales (Hugging Face)</span>
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
            const isInstalled = formState.installedPiperModels.includes(model.id);
            const isDownloading = downloadingId === model.id;

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
                </div>

                <div className="model-card-actions">
                  <button
                    type="button"
                    className="btn-huggingface"
                    onClick={() => tauriBridge.openExternalUrl(model.huggingFaceUrl)}
                    title="Ver en Hugging Face"
                  >
                    <ExternalLink size={13} />
                  </button>

                  {isInstalled ? (
                    <button
                      type="button"
                      className="btn-installed"
                      onClick={() => handleUninstallModel(model.id)}
                      title="Haga clic para desinstalar"
                    >
                      <Check size={13} />
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
