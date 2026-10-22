import React from 'react';
import type { PlaybackState } from '../../types';
import './StatusBar.css';

interface StatusBarProps {
  statusText: string;
  playbackState: PlaybackState;
  progressPercent: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  statusText,
  playbackState,
  progressPercent,
}) => {
  const getIndicatorColor = () => {
    switch (playbackState) {
      case 'speaking':
        return 'var(--accent-color)';
      case 'paused':
        return 'var(--skipped-color)';
      case 'error':
        return 'var(--danger-color)';
      default:
        return 'var(--disabled-color)';
    }
  };

  return (
    <footer className="statusbar-container">
      <div className="statusbar-left">
        <span
          className="statusbar-led"
          style={{ backgroundColor: getIndicatorColor() }}
          aria-hidden="true"
        />
        <span className="statusbar-text">{statusText}</span>
      </div>

      <div className="statusbar-right">
        <div className="statusbar-progress-track">
          <div
            className="statusbar-progress-fill"
            style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
          />
        </div>
      </div>
    </footer>
  );
};
