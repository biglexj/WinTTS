import React, { useState, useEffect } from 'react';
import type { AppSettings, SystemVoice } from '../../types';
import type { PiperController } from '../../hooks/usePiper';
import { Settings, X, Brain, Mic, Volume2, FileCode, Check } from 'lucide-react';
import { PiperTab } from './PiperTab';
import { SystemVoicesTab } from './SystemVoicesTab';
import { AudioTab } from './AudioTab';
import { MarkdownTab } from './MarkdownTab';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  availableVoices?: SystemVoice[];
  piper: PiperController;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  availableVoices = [],
  piper,
}) => {
  const [formState, setFormState] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'piper' | 'system' | 'audio' | 'markdown'>('piper');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const systemVoicesOnly = React.useMemo(() => {
    return availableVoices.filter((v) => v.provider === 'system');
  }, [availableVoices]);

  useEffect(() => {
    setFormState(settings);
  }, [settings, isOpen]);

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

  const handleSave = () => {
    onSaveSettings(formState);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-icon-badge">
              <Settings size={20} className="modal-icon-header" />
            </div>
            <div>
              <h2 className="modal-title">Configuración</h2>
              <p className="modal-subtitle">Gestión de Piper TTS, voces del sistema, audio y preferencias</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="modal-tabs">
          <button
            className={`modal-tab-btn ${activeTab === 'piper' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('piper')}
          >
            <Brain size={15} />
            <span>Motor Piper TTS</span>
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'system' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <Mic size={15} />
            <span>Voces del Sistema</span>
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'audio' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('audio')}
          >
            <Volume2 size={15} />
            <span>Audio & Exportación</span>
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'markdown' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('markdown')}
          >
            <FileCode size={15} />
            <span>Preprocesador</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="modal-body">
          {activeTab === 'piper' && (
            <PiperTab
              formState={formState}
              setFormState={setFormState}
              onSaveSettings={onSaveSettings}
              piper={piper}
            />
          )}

          {activeTab === 'system' && (
            <SystemVoicesTab
              formState={formState}
              setFormState={setFormState}
              availableSystemVoices={systemVoicesOnly}
              onSaveSettings={onSaveSettings}
            />
          )}

          {activeTab === 'audio' && (
            <AudioTab formState={formState} setFormState={setFormState} />
          )}

          {activeTab === 'markdown' && (
            <MarkdownTab formState={formState} setFormState={setFormState} />
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-base" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary modal-save-btn" onClick={handleSave}>
            {saveSuccess ? <Check size={16} /> : <Settings size={16} />}
            <span>{saveSuccess ? '¡Guardado!' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
