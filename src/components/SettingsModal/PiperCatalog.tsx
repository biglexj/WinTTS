import React, { useMemo, useState } from 'react';
import { Sparkles, Download, ExternalLink, Trash2 } from 'lucide-react';
import { PIPER_POPULAR_MODELS } from '../../types';
import type { PiperController } from '../../hooks/usePiper';
import { tauriBridge } from '../../services/tauriBridge';

export const PiperCatalog: React.FC<{ piper: PiperController }> = ({ piper }) => {
  const [languageFilter, setLanguageFilter] = useState('all');
  const filteredModels = useMemo(() => languageFilter === 'all'
    ? PIPER_POPULAR_MODELS
    : PIPER_POPULAR_MODELS.filter((model) => model.language.toLowerCase() === languageFilter.toLowerCase()), [languageFilter]);
  const installedIds = useMemo(() => new Set(piper.installed.map((model) => model.id)), [piper.installed]);
  return (
      <div className="models-catalog-section">
        <div className="catalog-header">
          <div className="catalog-title-wrap">
            <Sparkles size={14} className="catalog-sparkle" />
            <span className="catalog-title">Voces neuronales</span>
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
                      onClick={() => piper.uninstallModel(model.id)}
                      title="Eliminar el modelo de este equipo"
                    >
                      <Trash2 size={13} />
                      <span>Eliminar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-install"
                      onClick={() => piper.downloadModel(model)}
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
  );
};
