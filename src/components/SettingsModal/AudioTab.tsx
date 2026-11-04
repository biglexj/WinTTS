import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuPosition, setMenuPosition] = useState<React.CSSProperties>({});

  const updateMenuPosition = useCallback(() => {
    const rect = sampleRateTriggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    const placeAbove = below < 180 && above > below;
    setMenuPosition({
      position: 'fixed',
      left: rect.left,
      right: 'auto',
      width: rect.width,
      top: placeAbove ? 'auto' : rect.bottom + 5,
      bottom: placeAbove ? window.innerHeight - rect.top + 5 : 'auto',
      maxHeight: Math.max(0, (placeAbove ? above : below) - 12),
      overflowY: 'auto',
      zIndex: 10000,
    });
  }, []);

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
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isSampleRateOpen, updateMenuPosition]);

  const currentSampleRate = useMemo(() => {
    return (
      SAMPLE_RATE_OPTIONS.find((opt) => opt.value === formState.sampleRate) ||
      SAMPLE_RATE_OPTIONS[0]
    );
  }, [formState.sampleRate]);

  return (
    <div className="tab-content animate-fade">
      <div className="setting-group">
        <label className="setting-label">Frecuencia de muestreo</label>
        <div className="custom-select-wrapper">
          <button
            ref={sampleRateTriggerRef}
            type="button"
            className={`custom-select-trigger ${isSampleRateOpen ? 'trigger-focused' : ''}`}
            onClick={() => {
              updateMenuPosition();
              setIsSampleRateOpen(!isSampleRateOpen);
            }}
            aria-label="Frecuencia de muestreo"
            aria-haspopup="listbox"
            aria-expanded={isSampleRateOpen}
          >
            <span className="select-trigger-label">{currentSampleRate.label}</span>
            <ChevronDown
              size={15}
              className={`select-chevron ${isSampleRateOpen ? 'chevron-rotated' : ''}`}
            />
          </button>

          {isSampleRateOpen && createPortal(
            <div ref={sampleRateMenuRef} className="custom-select-menu animate-dropdown" role="listbox" aria-label="Frecuencia de muestreo" style={menuPosition}>
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
            </div>,
            document.body
          )}
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">Prefijo de los archivos de audio</label>
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
