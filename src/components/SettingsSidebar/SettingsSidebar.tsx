import React from 'react';
import type { PlaybackState, SpeechSettings, SystemVoice } from '../../types';
import { VoiceSelector } from '../VoiceSelector/VoiceSelector';
import { Play, Pause, Square, Download } from 'lucide-react';
import './SettingsSidebar.css';

interface SettingsSidebarProps {
  voices: SystemVoice[];
  settings: SpeechSettings;
  onSettingsChange: (newSettings: SpeechSettings) => void;
  playbackState: PlaybackState;
  onPlayPause: () => void;
  onStop: () => void;
  onExport: (format: 'wav' | 'mp3') => void;
  isExporting?: boolean;
  enablePiper?: boolean;
  systemVoiceLanguages?: string[];
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  voices,
  settings,
  onSettingsChange,
  playbackState,
  onPlayPause,
  onStop,
  onExport,
  isExporting = false,
  enablePiper = true,
  systemVoiceLanguages = ['es'],
}) => {
  const handleVoiceChange = (newVoiceName: string) => {
    onSettingsChange({
      ...settings,
      voiceName: newVoiceName,
    });
  };

  const currentVoiceObj = voices.find((v) => v.name === settings.voiceName);
  const isPiperActive = currentVoiceObj?.provider === 'piper';
  const isSystemActive = !isPiperActive && !!currentVoiceObj;

  // Filter system voices according to enabled languages in appSettings
  const filteredSystemVoices = React.useMemo(() => {
    const rawSystemVoices = voices.filter((v) => v.provider === 'system');
    if (!systemVoiceLanguages || systemVoiceLanguages.includes('all')) {
      return rawSystemVoices;
    }
    const filtered = rawSystemVoices.filter((v) => {
      const culture = (v.culture || '').toLowerCase();
      const name = (v.name || '').toLowerCase();
      return systemVoiceLanguages.some((lang) => {
        const l = lang.toLowerCase();
        return (
          culture.startsWith(l) ||
          culture.includes(`-${l}`) ||
          culture.includes(`_${l}`) ||
          (l === 'en' && (name.includes('english') || name.includes('inglés') || name.includes('david') || name.includes('zira') || name.includes('mark'))) ||
          (l === 'es' && (name.includes('spanish') || name.includes('español') || name.includes('helena') || name.includes('sabina') || name.includes('pablo') || name.includes('raul'))) ||
          (l === 'fr' && (name.includes('french') || name.includes('français') || name.includes('paul') || name.includes('hortense') || name.includes('julie'))) ||
          (l === 'de' && (name.includes('german') || name.includes('deutsch') || name.includes('hedda') || name.includes('stefan'))) ||
          (l === 'it' && (name.includes('italian') || name.includes('italiano') || name.includes('elsa') || name.includes('cosimo'))) ||
          (l === 'pt' && (name.includes('portuguese') || name.includes('português') || name.includes('maria') || name.includes('daniel'))) ||
          (l === 'ja' && (name.includes('japanese') || name.includes('japonés') || name.includes('haruka') || name.includes('ayumi') || name.includes('ichiro'))) ||
          (l === 'zh' && (name.includes('chinese') || name.includes('chino') || name.includes('huihui') || name.includes('yaoyao') || name.includes('kangkang')))
        );
      });
    });
    return filtered.length > 0 ? filtered : rawSystemVoices;
  }, [voices, systemVoiceLanguages]);

  const piperVoices = React.useMemo(() => {
    return voices.filter((v) => v.provider === 'piper');
  }, [voices]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      volume: parseInt(e.target.value, 10),
    });
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      rate: parseInt(e.target.value, 10),
    });
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      pitch: parseInt(e.target.value, 10),
    });
  };

  const playPauseLabel =
    playbackState === 'speaking'
      ? 'Pausar'
      : playbackState === 'paused'
      ? 'Reanudar'
      : playbackState === 'stopping'
      ? 'Deteniendo…'
      : 'Reproducir';

  const formatSigned = (val: number) => (val > 0 ? `+${val}` : `${val}`);

  return (
    <aside className="sidebar-container">
      <div className="sidebar-scrollable">
        <h2 className="sidebar-title">Narración</h2>
        <p className="sidebar-description">Ajusta cómo quieres escuchar y exportar el texto.</p>

        {/* Selector de Voz del Sistema */}
        <div className="field-group">
          <div className="field-label-row">
            <label className="field-label">VOZ DEL SISTEMA</label>
            {isSystemActive && <span className="active-voice-pill">ACTIVA</span>}
          </div>
          <VoiceSelector
            voices={filteredSystemVoices}
            selectedVoiceName={isSystemActive ? settings.voiceName : null}
            onVoiceChange={handleVoiceChange}
            disabled={playbackState === 'stopping'}
            providerFilter="system"
            isActive={isSystemActive}
            placeholder="Seleccionar voz del sistema…"
          />
        </div>

        {/* Selector de Voz Piper Neural */}
        {enablePiper && (
          <div className="field-group">
            <div className="field-label-row">
              <label className="field-label">VOZ PIPER (NEURAL)</label>
              {isPiperActive && <span className="active-voice-pill active-piper-pill">ACTIVA</span>}
            </div>
            <VoiceSelector
              voices={piperVoices}
              selectedVoiceName={isPiperActive ? settings.voiceName : null}
              onVoiceChange={handleVoiceChange}
              disabled={playbackState === 'stopping'}
              providerFilter="piper"
              isActive={isPiperActive}
              placeholder="Seleccionar voz neuronal…"
            />
          </div>
        )}

        {/* Slider Volumen */}
        <div className="field-group">
          <label className="field-label">VOLUMEN</label>
          <div className="slider-row">
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={handleVolumeChange}
            />
            <span className="slider-value">{settings.volume}%</span>
          </div>
        </div>

        {/* Slider Velocidad */}
        <div className="field-group">
          <label className="field-label">VELOCIDAD</label>
          <div className="slider-row">
            <input
              type="range"
              min="-10"
              max="10"
              value={settings.rate}
              onChange={handleRateChange}
            />
            <span className="slider-value">{formatSigned(settings.rate)}</span>
          </div>
        </div>

        {/* Slider Tono */}
        <div className="field-group">
          <label className="field-label">TONO</label>
          <div className="slider-row">
            <input
              type="range"
              min="-10"
              max="10"
              value={settings.pitch}
              onChange={handlePitchChange}
            />
            <span className="slider-value">{formatSigned(settings.pitch)}</span>
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* Botones de Control */}
        <div className="sidebar-actions">
          <button
            className="btn-primary sidebar-btn-main"
            onClick={onPlayPause}
            disabled={playbackState === 'stopping' || voices.length === 0}
            title="Reproducir o pausar narración (Ctrl+Enter)"
          >
            {playbackState === 'speaking' ? <Pause size={18} /> : <Play size={18} />}
            <span>{playPauseLabel}</span>
          </button>

          <button
            className="btn-danger sidebar-btn-secondary"
            onClick={onStop}
            disabled={playbackState === 'idle'}
            title="Detener lectura (Esc)"
          >
            <Square size={16} />
            <span>Detener</span>
          </button>

          {/* Fila de Exportación dividida en 2: WAV y MP3 */}
          <div className="sidebar-export-row">
            <button
              className="btn-base sidebar-btn-export"
              onClick={() => onExport('wav')}
              disabled={isExporting}
              title="Exportar documento a archivo WAV sin pérdidas"
            >
              <Download size={15} />
              <span>WAV</span>
            </button>

            <button
              className="btn-base sidebar-btn-export"
              onClick={() => onExport('mp3')}
              disabled={isExporting}
              title="Exportar documento a archivo MP3"
            >
              <Download size={15} />
              <span>MP3</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
