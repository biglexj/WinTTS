import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { DocumentStats, SkippedRange } from '../../types';
import { Volume2, EyeOff, RotateCcw, Trash2, Code2, Eye, FolderOpen, Save } from 'lucide-react';
import './NarrationEditor.css';

interface NarrationEditorProps {
  markdown: string;
  onMarkdownChange: (newText: string) => void;
  skippedRanges: SkippedRange[];
  stats: DocumentStats;
  onSelectionChange: (start: number, end: number, text: string) => void;
  onReadSelection: () => void;
  onSkipSelection: () => void;
  onIncludeSelection: () => void;
  onClearSkips: () => void;
  fileName: string;
  filePath: string | null;
  isDirty: boolean;
  onOpenDocument: () => void;
  onSaveDocument: () => void;
  onSaveDocumentAs: () => void;
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={index} className="md-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <strong key={index} className="md-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={index} className="md-italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return (
        <del key={index} className="md-del">
          {part.slice(2, -2)}
        </del>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <span key={index} className="md-link" title={linkMatch[2]}>
          {linkMatch[1]}
        </span>
      );
    }

    return part;
  });
}

function renderTextWithSkips(
  text: string,
  startOffset: number,
  skippedRanges: SkippedRange[]
): React.ReactNode[] {
  if (skippedRanges.length === 0 || !text) {
    return parseInlineMarkdown(text);
  }

  const endOffset = startOffset + text.length;
  // Find relevant skips within this line
  const relevantSkips = skippedRanges
    .filter((r) => r.end > startOffset && r.start < endOffset)
    .sort((a, b) => a.start - b.start);

  if (relevantSkips.length === 0) {
    return parseInlineMarkdown(text);
  }

  const nodes: React.ReactNode[] = [];
  let current = startOffset;

  for (let i = 0; i < relevantSkips.length; i++) {
    const skip = relevantSkips[i];
    const skipStartInText = Math.max(skip.start, current);
    const skipEndInText = Math.min(skip.end, endOffset);

    // Text before skip
    if (skipStartInText > current) {
      const beforeText = text.substring(current - startOffset, skipStartInText - startOffset);
      nodes.push(
        <React.Fragment key={`before-${current}`}>
          {parseInlineMarkdown(beforeText)}
        </React.Fragment>
      );
    }

    // Skipped text (amber highlight)
    if (skipEndInText > skipStartInText) {
      const skippedText = text.substring(skipStartInText - startOffset, skipEndInText - startOffset);
      nodes.push(
        <mark
          key={`skip-${skip.id || skipStartInText}-${i}`}
          className="text-skipped"
          title="Omitido en lectura y exportación"
        >
          {skippedText}
        </mark>
      );
      current = skipEndInText;
    }
  }

  // Text after all skips
  if (current < endOffset) {
    const afterText = text.substring(current - startOffset);
    nodes.push(
      <React.Fragment key={`after-${current}`}>
        {parseInlineMarkdown(afterText)}
      </React.Fragment>
    );
  }

  return nodes;
}

export const NarrationEditor: React.FC<NarrationEditorProps> = ({
  markdown,
  onMarkdownChange,
  skippedRanges,
  stats,
  onSelectionChange,
  onReadSelection,
  onSkipSelection,
  onIncludeSelection,
  onClearSkips,
  fileName,
  filePath,
  isDirty,
  onOpenDocument,
  onSaveDocument,
  onSaveDocumentAs,
}) => {
  const [isPreview, setIsPreview] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const handleTextareaSelect = useCallback(() => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = markdown.substring(start, end);
    onSelectionChange(start, end, text);
  }, [markdown, onSelectionChange]);

  // Handle selection continuously in rendered markdown preview
  useEffect(() => {
    if (!isPreview) return;

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

      if (previewRef.current && !previewRef.current.contains(sel.anchorNode)) {
        return;
      }

      const selectedText = sel.toString();
      if (!selectedText.trim()) return;

      let index = markdown.indexOf(selectedText);
      if (index === -1) {
        const clean = selectedText.replace(/[*_#`~[\]]/g, '').trim();
        if (clean.length > 2) {
          index = markdown.indexOf(clean);
        }
      }

      if (index !== -1) {
        onSelectionChange(index, index + selectedText.length, selectedText);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isPreview, markdown, onSelectionChange]);

  const renderPreviewContent = () => {
    if (!markdown.trim()) {
      return (
        <div className="editor-empty-state">
          <p>
            No hay contenido. Escribe aquí o arrastra un archivo <strong>.md</strong> / <strong>.txt</strong>.
          </p>
        </div>
      );
    }

    const lines = markdown.split('\n');
    let currentOffset = 0;

    return (
      <div className="markdown-rendered-view">
        {lines.map((line, idx) => {
          const lineStart = currentOffset;
          currentOffset += line.length + 1; // +1 for newline

          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="md-h1">
                {renderTextWithSkips(line.substring(2), lineStart + 2, skippedRanges)}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="md-h2">
                {renderTextWithSkips(line.substring(3), lineStart + 3, skippedRanges)}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="md-h3">
                {renderTextWithSkips(line.substring(4), lineStart + 4, skippedRanges)}
              </h3>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="md-quote">
                {renderTextWithSkips(line.substring(2), lineStart + 2, skippedRanges)}
              </blockquote>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="list-item">
                {renderTextWithSkips(line.substring(2), lineStart + 2, skippedRanges)}
              </li>
            );
          }
          if (/^\d+\.\s+/.test(line)) {
            const match = line.match(/^\d+\.\s+/);
            const prefixLen = match ? match[0].length : 3;
            return (
              <li key={idx} className="list-item-ordered">
                {renderTextWithSkips(line.substring(prefixLen), lineStart + prefixLen, skippedRanges)}
              </li>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="line-break" />;
          }

          return (
            <p key={idx} className="md-p">
              {renderTextWithSkips(line, lineStart, skippedRanges)}
            </p>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    if (textareaRef.current && !isPreview) {
      textareaRef.current.focus();
    }
  }, [isPreview]);

  return (
    <section className="editor-container">
      {/* Header */}
      <div className="editor-header">
        <div>
          <h2 className="editor-title">Editor de narración</h2>
          <p className="editor-subtitle">Selecciona texto para leerlo o marcarlo como omitido.</p>
        </div>
        <div className="editor-stats">
          <span
            className={`editor-file-name ${isDirty ? 'editor-file-dirty' : ''}`}
            title={filePath ?? 'Documento sin guardar en disco'}
          >
            {fileName || 'Documento sin título'}
            {isDirty ? ' •' : ''}
          </span>
          <span>
            {stats.word_count} palabras · ~{stats.estimated_minutes} min
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="editor-toolbar">
        <button
          className="btn-base toolbar-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onOpenDocument}
          title="Abrir un documento .md o .txt (Ctrl+O)"
        >
          <FolderOpen size={15} />
          <span>Abrir</span>
        </button>

        <button
          className="btn-base toolbar-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onSaveDocument}
          title="Guardar el documento (Ctrl+S)"
        >
          <Save size={15} />
          <span>Guardar</span>
        </button>

        <button
          className="btn-base toolbar-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onSaveDocumentAs}
          title="Guardar con otro nombre (Ctrl+Shift+S)"
        >
          <Save size={15} />
          <span>Guardar como</span>
        </button>

        <span className="toolbar-separator" />

        <button
          className="btn-base toolbar-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onReadSelection}
          title="Lee únicamente el texto seleccionado"
        >
          <Volume2 size={15} />
          <span>Leer selección</span>
        </button>

        <button
          className="btn-base toolbar-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onSkipSelection}
          title="El fragmento marcado no se leerá ni exportará"
        >
          <EyeOff size={15} />
          <span>Omitir selección</span>
        </button>

        <button
          className="btn-base toolbar-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onIncludeSelection}
          title="Volver a incluir el fragmento seleccionado"
        >
          <RotateCcw size={15} />
          <span>Volver a incluir</span>
        </button>

        <button
          className="btn-base toolbar-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClearSkips}
          disabled={skippedRanges.length === 0}
          title="Eliminar todas las omisiones marcadas"
        >
          <Trash2 size={15} />
          <span>Limpiar omisiones</span>
        </button>
      </div>

      {/* Editor Body */}
      <div className="editor-canvas">
        {isPreview ? (
          <div ref={previewRef} className="editor-preview-surface">
            {renderPreviewContent()}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            onSelect={handleTextareaSelect}
            onKeyUp={handleTextareaSelect}
            onMouseUp={handleTextareaSelect}
            placeholder="Escribe o pega texto en formato Markdown aquí..."
            spellCheck={false}
          />
        )}
      </div>

      {/* Bottom Controls & Legend */}
      <div className="editor-footer">
        <button
          className={`mode-toggle-btn ${isPreview ? 'mode-toggle-active' : ''}`}
          onClick={() => setIsPreview(!isPreview)}
          title="Alterna entre el documento renderizado y el código Markdown editable"
        >
          {isPreview ? <Eye size={15} /> : <Code2 size={15} />}
          <span>{isPreview ? 'Vista Markdown' : 'Editar Markdown'}</span>
        </button>

        <div className="editor-legend">
          <span className="legend-amber-box" />
          <span className="legend-text">Ámbar: omitido en lectura y exportación</span>
        </div>
      </div>
    </section>
  );
};
