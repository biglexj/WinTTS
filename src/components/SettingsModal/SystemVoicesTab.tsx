import React from 'react';
import type { AppSettings, SystemVoice } from '../../types';
import { Mic, Check } from 'lucide-react';

interface SystemVoicesTabProps {
  formState: AppSettings;
  setFormState: React.Dispatch<React.SetStateAction<AppSettings>>;
  availableSystemVoices?: SystemVoice[];
  onSaveSettings?: (newSettings: AppSettings) => void;
}

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'es', name: 'Español (España, México, etc.)', flag: '🇪🇸 / 🇲🇽' },
  { code: 'en', name: 'Inglés (EE.UU., Reino Unido, etc.)', flag: '🇺🇸 / 🇬🇧' },
  { code: 'fr', name: 'Francés (Francia, Canadá)', flag: '🇫🇷 / 🇨🇦' },
  { code: 'de', name: 'Alemán (Alemania, Austria)', flag: '🇩🇪 / 🇦🇹' },
  { code: 'it', name: 'Italiano (Italia)', flag: '🇮🇹' },
  { code: 'pt', name: 'Portugués (Brasil, Portugal)', flag: '🇧🇷 / 🇵🇹' },
  { code: 'ja', name: 'Japonés', flag: '🇯🇵' },
  { code: 'zh', name: 'Chino (Mandarín)', flag: '🇨🇳' },
];

export const SystemVoicesTab: React.FC<SystemVoicesTabProps> = ({
  formState,
  setFormState,
  availableSystemVoices = [],
  onSaveSettings,
}) => {
  const currentLanguages = formState.systemVoiceLanguages || ['es'];
  const isAll = currentLanguages.includes('all');

  const handleToggleLanguage = (code: string) => {
    let nextLangs: string[];
    if (code === 'all') {
      nextLangs = currentLanguages.includes('all') ? ['es'] : ['all'];
    } else {
      const active = currentLanguages.filter((c) => c !== 'all');
      nextLangs = active.includes(code)
        ? active.filter((c) => c !== code)
        : [...active, code];
      if (nextLangs.length === 0) nextLangs = ['es'];
    }

    const updatedSettings = {
      ...formState,
      systemVoiceLanguages: nextLangs,
    };
    setFormState(updatedSettings);
    if (onSaveSettings) {
      onSaveSettings(updatedSettings);
    }
  };

  const matchedVoices = React.useMemo(() => {
    if (isAll) return availableSystemVoices;
    return availableSystemVoices.filter((v) =>
      currentLanguages.some((lang) => v.culture.toLowerCase().startsWith(lang.toLowerCase()))
    );
  }, [availableSystemVoices, isAll, currentLanguages]);

  return (
    <div className="tab-content animate-fade">
      <div className="info-banner">
        <Mic size={18} className="info-banner-icon" />
        <p>
          <strong>Voces del Sistema (OneCore / SAPI / Navegador):</strong> Elige qué idiomas deseas habilitar en el selector de voz del sistema. Puedes añadir más voces desde la configuración de voz de Windows.
        </p>
      </div>

      {/* Opción Mostrar Todos */}
      <div className="setting-row-toggle">
        <div>
          <div className="setting-label">Mostrar todos los idiomas instalados</div>
          <div className="setting-desc">Habilita cualquier voz instalada en Windows sin restringir por idioma.</div>
        </div>
        <input
          type="checkbox"
          className="setting-checkbox"
          checked={isAll}
          onChange={() => handleToggleLanguage('all')}
        />
      </div>

      {/* Selector de Idiomas Específicos */}
      {!isAll && (
        <div className="setting-group">
          <div className="label-with-action">
            <label className="setting-label">Idiomas Habilitados en el Selector</label>
            <span className="setting-desc" style={{ margin: 0 }}>
              {matchedVoices.length} voz(ces) coincidente(s)
            </span>
          </div>

          <div className="languages-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', marginTop: '4px' }}>
            {LANGUAGE_OPTIONS.map((lang) => {
              const isChecked = currentLanguages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleToggleLanguage(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${isChecked ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    backgroundColor: isChecked ? 'rgba(45, 212, 191, 0.08)' : 'var(--surface-raised)',
                    color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isChecked ? 600 : 400,
                    transition: 'all 0.12s ease',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  {isChecked && <Check size={14} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
