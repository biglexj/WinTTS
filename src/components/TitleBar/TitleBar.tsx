import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { tauriBridge, isTauri } from '../../services/tauriBridge';
import { Settings, Info } from 'lucide-react';
import appIcon from '../../../assets/branding/icons/icon-transparent.png';
import './TitleBar.css';

interface TitleBarProps {
  onOpenSettings?: () => void;
  onOpenAbout?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenSettings, onOpenAbout }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;
    let isMounted = true;

    const checkMaximized = async () => {
      try {
        const max = await getCurrentWindow().isMaximized();
        if (isMounted) setIsMaximized(max);
      } catch {
        // Ignorar en entorno web puro
      }
    };

    checkMaximized();

    let unlisten: (() => void) | undefined;
    getCurrentWindow()
      .onResized(() => {
        checkMaximized();
      })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (unlisten) unlisten();
    };
  }, []);

  const handleMinimize = async () => {
    await tauriBridge.minimizeWindow();
  };

  const handleToggleMaximize = async () => {
    await tauriBridge.toggleMaximizeWindow();
    if (isTauri()) {
      const max = await getCurrentWindow().isMaximized();
      setIsMaximized(max);
    } else {
      setIsMaximized((prev) => !prev);
    }
  };

  const handleClose = async () => {
    await tauriBridge.closeWindow();
  };

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Only drag if left click and not on a button
    if (e.button === 0 && (e.target as HTMLElement).tagName !== 'BUTTON' && !(e.target as HTMLElement).closest('button')) {
      tauriBridge.startDraggingWindow();
    }
  };

  const handleDoubleClick = () => {
    handleToggleMaximize();
  };

  return (
    <header
      className="titlebar-container"
      onMouseDown={handleHeaderMouseDown}
      onDoubleClick={handleDoubleClick}
      data-tauri-drag-region
    >
      <div className="titlebar-branding" data-tauri-drag-region>
        <img src={appIcon} alt="WinTTS Logo" className="titlebar-icon" />
        <span className="titlebar-title">WinTTS</span>
        <span className="titlebar-subtitle"> · Local Speech & Neural Reader</span>
      </div>

      <div className="titlebar-controls">
        {onOpenSettings && (
          <button
            className="titlebar-btn titlebar-btn-action"
            onClick={onOpenSettings}
            title="Configuración de WinTTS"
            aria-label="Abrir Configuración"
          >
            <Settings size={15} />
          </button>
        )}

        {onOpenAbout && (
          <button
            className="titlebar-btn titlebar-btn-action"
            onClick={onOpenAbout}
            title="Acerca de WinTTS"
            aria-label="Acerca de WinTTS"
          >
            <Info size={15} />
          </button>
        )}

        <div className="titlebar-divider" />

        <button
          className="titlebar-btn"
          onClick={handleMinimize}
          title="Minimizar"
          aria-label="Minimizar ventana"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M 3 8 L 13 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>

        <button
          className="titlebar-btn"
          onClick={handleToggleMaximize}
          title="Maximizar o restaurar"
          aria-label="Maximizar o restaurar ventana"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            {isMaximized ? (
              <path
                d="M 5 3 L 13 3 L 13 11 M 3 5 L 11 5 L 11 13 L 3 13 Z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            ) : (
              <path d="M 3 3 L 13 3 L 13 13 L 3 13 Z" stroke="currentColor" strokeWidth="1.5" />
            )}
          </svg>
        </button>

        <button
          className="titlebar-btn titlebar-btn-close"
          onClick={handleClose}
          title="Cerrar"
          aria-label="Cerrar ventana"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M 3 3 L 13 13 M 13 3 L 3 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
};
