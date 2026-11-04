import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { SystemVoice } from '../../types';
import { ChevronDown, Search, X, Check, Mic, Brain, Globe } from 'lucide-react';
import './VoiceSelector.css';

interface VoiceSelectorProps {
  voices: SystemVoice[];
  selectedVoiceName: string | null;
  onVoiceChange: (voiceName: string) => void;
  disabled?: boolean;
  providerFilter?: 'system' | 'piper';
  isActive?: boolean;
  placeholder?: string;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoiceName,
  onVoiceChange,
  disabled = false,
  providerFilter,
  isActive = false,
  placeholder = 'Seleccionar voz…',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeUp: boolean }>({
    top: 0,
    left: 0,
    width: 260,
    placeUp: false,
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Filter voices according to provider filter
  const candidateVoices = useMemo(() => {
    if (!providerFilter) return voices;
    return voices.filter((v) => v.provider === providerFilter);
  }, [voices, providerFilter]);

  // Find currently selected voice within this provider
  const currentVoice = useMemo(() => {
    return candidateVoices.find((v) => v.name === selectedVoiceName) || null;
  }, [candidateVoices, selectedVoiceName]);

  // Update floating position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setCoords({
      top: placeUp ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      placeUp,
    });
  }, []);

  // Filter voices by search query
  const filteredVoices = useMemo(() => {
    if (!searchQuery.trim()) return candidateVoices;
    const query = searchQuery.toLowerCase().trim();
    return candidateVoices.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.culture.toLowerCase().includes(query) ||
        v.gender.toLowerCase().includes(query) ||
        v.provider.toLowerCase().includes(query)
    );
  }, [candidateVoices, searchQuery]);

  // Group filtered voices by provider
  const systemVoices = useMemo(
    () => filteredVoices.filter((v) => v.provider === 'system'),
    [filteredVoices]
  );
  const piperVoices = useMemo(
    () => filteredVoices.filter((v) => v.provider === 'piper'),
    [filteredVoices]
  );

  // Toggle open and calculate position
  const handleToggle = () => {
    if (disabled || voices.length === 0) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown on outside click, window resize or scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelectVoice = (voice: SystemVoice) => {
    onVoiceChange(voice.name);
    setIsOpen(false);
  };

  return (
    <div className="voice-selector-root">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        className={`voice-selector-trigger ${isOpen ? 'trigger-open' : ''} ${isActive ? 'trigger-active' : ''}`}
        onClick={handleToggle}
        disabled={disabled || candidateVoices.length === 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="trigger-left">
          {providerFilter === 'piper' || currentVoice?.provider === 'piper' ? (
            <Brain size={16} className="voice-icon-piper" />
          ) : (
            <Mic size={16} className="voice-icon-system" />
          )}
          <span className={`trigger-label ${!currentVoice ? 'trigger-placeholder' : ''}`}>
            {currentVoice ? currentVoice.name : placeholder}
          </span>
        </div>

        <div className="trigger-right">
          {currentVoice && (
            <span className="trigger-badge">
              {currentVoice.culture.slice(0, 5)}
            </span>
          )}
          <ChevronDown
            size={15}
            className={`trigger-chevron ${isOpen ? 'chevron-rotated' : ''}`}
          />
        </div>
      </button>

      {/* Floating Dropdown Panel Rendered via Portal to Body to Avoid Any Clipping */}
      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            className="voice-dropdown-portal-panel animate-dropdown"
            role="listbox"
            style={{
              position: 'fixed',
              top: coords.placeUp ? undefined : `${coords.top}px`,
              bottom: coords.placeUp ? `${window.innerHeight - coords.top}px` : undefined,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 999999,
            }}
          >
            {/* Search Header */}
            <div className="voice-search-box">
              <Search size={14} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Buscar voces por nombre o idioma..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Limpiar búsqueda"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Scrollable Voice List */}
            <div className="voice-list-scrollable">
              {filteredVoices.length === 0 ? (
                <div className="voice-empty-search">
                  <Globe size={24} className="empty-icon" />
                  <p>No se encontraron voces que coincidan.</p>
                </div>
              ) : (
                <>
                  {/* Voces del Sistema */}
                  {systemVoices.length > 0 && (
                    <div className="voice-group">
                      <div className="voice-group-header">
                        <Mic size={12} />
                        <span>VOCES DEL SISTEMA ({systemVoices.length})</span>
                      </div>
                      {systemVoices.map((voice) => {
                        const isSelected = currentVoice?.name === voice.name;
                        return (
                          <button
                            key={voice.id || voice.name}
                            type="button"
                            className={`voice-option-item ${isSelected ? 'option-selected' : ''}`}
                            onClick={() => handleSelectVoice(voice)}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div className="option-info">
                              <span className="option-name">{voice.name}</span>
                              <div className="option-tags">
                                <span className="tag-pill tag-locale">{voice.culture}</span>
                                <span className="tag-pill tag-gender">{voice.gender}</span>
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="option-check" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Voces Piper Neural */}
                  {piperVoices.length > 0 && (
                    <div className="voice-group">
                      <div className="voice-group-header voice-group-piper">
                        <Brain size={12} />
                        <span>PIPER NEURAL ({piperVoices.length})</span>
                      </div>
                      {piperVoices.map((voice) => {
                        const isSelected = currentVoice?.name === voice.name;
                        return (
                          <button
                            key={voice.id || voice.name}
                            type="button"
                            className={`voice-option-item option-piper ${isSelected ? 'option-selected' : ''}`}
                            onClick={() => handleSelectVoice(voice)}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div className="option-info">
                              <span className="option-name">{voice.name}</span>
                              <div className="option-tags">
                                <span className="tag-pill tag-neural">🧠 Neural</span>
                                <span className="tag-pill tag-locale">{voice.culture}</span>
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="option-check" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
