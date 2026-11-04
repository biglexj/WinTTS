import React, { useState, useEffect } from 'react';
import type { AppSettings, SystemVoice } from '../../types';
import type { PiperController } from '../../hooks/usePiper';
import { Settings, X, Brain, Mic, SlidersHorizontal, Check } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'piper' | 'system' | 'preferences'>('preferences');
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
      <div className="modal-container settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-icon-badge">
              <Settings size={20} className="modal-icon-header" />
            </div>
            <div>
              <h2 className="modal-title">Configuración</h2>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="modal-tabs">
          <button
            className={`modal-tab-btn ${activeTab === 'preferences' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <SlidersHorizontal size={15} />
            <span>Preferencias</span>
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'system' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <Mic size={15} />
            <span>Voces del sistema</span>
          </button>
          <button
            className={`modal-tab-btn ${activeTab === 'piper' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('piper')}
          >
            <Brain size={15} />
            <span>Piper</span>
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

          {activeTab === 'preferences' && (
            <div className="settings-columns preferences-layout">
              <section className="settings-column" aria-labelledby="audio-preferences-title">
                <h3 id="audio-preferences-title" className="settings-section-title">Audio y exportación</h3>
                <AudioTab formState={formState} setFormState={setFormState} />
              </section>
              <section className="settings-column" aria-labelledby="text-preferences-title">
                <h3 id="text-preferences-title" className="settings-section-title">Lectura del texto</h3>
                <MarkdownTab formState={formState} setFormState={setFormState} />
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-base" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary modal-save-btn" onClick={handleSave}>
            {saveSuccess ? <Check size={16} /> : <Settings size={16} />}
            <span>{saveSuccess ? 'Guardado' : 'Guardar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
