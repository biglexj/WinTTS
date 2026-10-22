import React, { useEffect } from 'react';
import { tauriBridge } from '../../services/tauriBridge';
import { X, Coffee, Heart, Sparkles, Shield, Cpu } from 'lucide-react';
import './AboutModal.css';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOpenLink = (url: string) => {
    tauriBridge.openExternalUrl(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="about-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="about-header">
          <div className="about-header-info">
            <img src="/Image/app_icon.ico" alt="WinTTS" className="about-app-icon" />
            <div>
              <h2 className="about-title">WinTTS</h2>
              <p className="about-version">v2.0.0 (Nougat Update) · Local Speech</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="about-body">
          <p className="about-description">
            Lector de síntesis de voz inteligente, 100% local, privado y multiplataforma. Preprocesa automáticamente sintaxis Markdown, excluye fragmentos en ámbar y exporta narraciones de audio WAV con máxima fidelidad acústica.
          </p>

          <div className="about-badges-grid">
            <div className="about-badge">
              <Cpu size={14} className="badge-icon" />
              <span>Rust + Tauri 2.0</span>
            </div>
            <div className="about-badge">
              <Shield size={14} className="badge-icon" />
              <span>100% Privado Offline</span>
            </div>
            <div className="about-badge">
              <Sparkles size={14} className="badge-icon" />
              <span>Piper Neural Ready</span>
            </div>
          </div>

          <div className="about-divider" />

          {/* Links and Author */}
          <div className="about-meta">
            <div className="meta-text">
              <strong>Desarrollado con pasión científica por</strong>{' '}
              <span className="author-name">@biglexj</span> (2026)
            </div>
            <div className="meta-license">Licencia MIT · Código Abierto</div>
          </div>

          <div className="about-actions-grid">
            <button
              type="button"
              className="about-action-btn btn-coffee"
              onClick={() => handleOpenLink('https://buymeacoffee.com/biglexj')}
            >
              <Coffee size={15} />
              <span>Buy Me a Coffee</span>
            </button>

            <button
              type="button"
              className="about-action-btn btn-donate"
              onClick={() => handleOpenLink('https://www.biglexj.com/donaciones')}
            >
              <Heart size={15} />
              <span>Donaciones Oficiales</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-base" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
