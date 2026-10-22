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
          <div className="setting-label">Omitir Emojis Automáticamente</div>
          <div className="setting-desc">Evita que el sintetizador lea los nombres descriptivos en voz alta.</div>
        </div>
        <input
          type="checkbox"
          className="setting-checkbox"
          checked={formState.stripEmojis}
          onChange={(e) => setFormState((prev) => ({ ...prev, stripEmojis: e.target.checked }))}
        />
      </div>

      <div className="setting-row-toggle">
        <div>
          <div className="setting-label">Omitir Bloques de Código Delimitados (```)</div>
          <div className="setting-desc">Excluye fragmentos de código técnico para una narración fluida.</div>
        </div>
        <input
          type="checkbox"
          className="setting-checkbox"
          checked={formState.stripCodeBlocks}
          onChange={(e) => setFormState((prev) => ({ ...prev, stripCodeBlocks: e.target.checked }))}
        />
      </div>
    </div>
  );
};
