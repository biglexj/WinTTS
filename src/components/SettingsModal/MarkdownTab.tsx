import React from 'react';
import type { AppSettings } from '../../types';

interface MarkdownTabProps {
  formState: AppSettings;
  setFormState: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export const MarkdownTab: React.FC<MarkdownTabProps> = ({ formState, setFormState }) => {
  return (
    <div className="tab-content animate-fade">
      <div className="setting-row-toggle">
        <div>
          <div className="setting-label">Omitir emojis</div>
        </div>
        <input
          type="checkbox"
          className="setting-checkbox"
          aria-label="Omitir emojis"
          checked={formState.stripEmojis}
          onChange={(e) => setFormState((prev) => ({ ...prev, stripEmojis: e.target.checked }))}
        />
      </div>

      <div className="setting-row-toggle">
        <div>
          <div className="setting-label">Omitir bloques de código</div>
        </div>
        <input
          type="checkbox"
          className="setting-checkbox"
          aria-label="Omitir bloques de código"
          checked={formState.stripCodeBlocks}
          onChange={(e) => setFormState((prev) => ({ ...prev, stripCodeBlocks: e.target.checked }))}
        />
      </div>
    </div>
  );
};
