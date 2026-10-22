import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { AppSettings } from '../../types';
import { ChevronDown, Check } from 'lucide-react';

interface AudioTabProps {
  formState: AppSettings;
  setFormState: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const SAMPLE_RATE_OPTIONS = [
  { value: 22050, label: '22,050 Hz (Estándar TTS)', tag: 'TTS' },
  { value: 44100, label: '44,100 Hz (Alta fidelidad)', tag: '44.1 kHz' },
  { value: 48000, label: '48,000 Hz (Estudio / Broadcast)', tag: 'Estudio' },
];

export const AudioTab: React.FC<AudioTabProps> = ({ formState, setFormState }) => {
  const [isSampleRateOpen, setIsSampleRateOpen] = useState(false);
  const sampleRateTriggerRef = useRef<HTMLButtonElement | null>(null);
  const sampleRateMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isSampleRateOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        sampleRateTriggerRef.current &&
        !sampleRateTriggerRef.current.contains(target) &&
        sampleRateMenuRef.current &&
        !sampleRateMenuRef.current.contains(target)
      ) {
        setIsSampleRateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSampleRateOpen]);

  const currentSampleRate = useMemo(() => {
    return (
      SAMPLE_RATE_OPTIONS.find((opt) => opt.value === formState.sampleRate) ||
      SAMPLE_RATE_OPTIONS[0]
    );
  }, [formState.sampleRate]);

  return (
    <div className="tab-content animate-fade">
      <div className="setting-group">
        <label className="setting-label">Frecuencia de Muestreo de Exportación (Hz)</label>
        <div className="setting-desc">Calidad y frecuencia de muestreo para la síntesis y exportación de audio.</div>
        <div className="custom-select-wrapper">
          <button
            ref={sampleRateTriggerRef}
            type="button"
            className={`custom-select-trigger ${isSampleRateOpen ? 'trigger-focused' : ''}`}
            onClick={() => setIsSampleRateOpen(!isSampleRateOpen)}
            aria-haspopup="listbox"
            aria-expanded={isSampleRateOpen}
          >
            <span className="select-trigger-label">{currentSampleRate.label}</span>
            <ChevronDown
              size={15}
              className={`select-chevron ${isSampleRateOpen ? 'chevron-rotated' : ''}`}
            />
          </button>

          {isSampleRateOpen && (
            <div ref={sampleRateMenuRef} className="custom-select-menu animate-dropdown" role="listbox">
              {SAMPLE_RATE_OPTIONS.map((opt) => {
                const isSelected = opt.value === formState.sampleRate;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`custom-select-option ${isSelected ? 'option-selected' : ''}`}
                    onClick={() => {
                      setFormState((prev) => ({ ...prev, sampleRate: opt.value }));
                      setIsSampleRateOpen(false);
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="option-label-group">
                      <span className="option-main-text">{opt.label}</span>
                      <span className="option-tag-badge">{opt.tag}</span>
                    </div>
                    {isSelected && <Check size={14} className="option-check-icon" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">Prefijo de Nombre para Archivos de Audio</label>
        <div className="setting-desc">Texto inicial con el que se generarán los nombres de los archivos exportados.</div>
        <input
          type="text"
          className="setting-input"
          placeholder="WinTTS-"
          value={formState.defaultSavePrefix}
          onChange={(e) => setFormState((prev) => ({ ...prev, defaultSavePrefix: e.target.value }))}
        />
      </div>
    </div>
  );
};
