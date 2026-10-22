import React from 'react';
import { FileText, ArrowDownCircle } from 'lucide-react';
import './DropOverlay.css';

interface DropOverlayProps {
  isVisible: boolean;
}

export const DropOverlay: React.FC<DropOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="drop-overlay-backdrop">
      <div className="drop-overlay-card">
        <div className="drop-icon-container">
          <ArrowDownCircle size={44} className="drop-icon-animated" />
          <FileText size={28} className="drop-icon-sub" />
        </div>
        <h3 className="drop-overlay-title">Cargar Documento</h3>
        <p className="drop-overlay-subtitle">
          Suelta tu archivo <strong>.md</strong> o <strong>.txt</strong> para comenzar la narración
        </p>
      </div>
    </div>
  );
};
