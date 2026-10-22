import { useState, useCallback, useMemo } from 'react';
import type { DocumentStats, SkippedRange } from '../types';

const INITIAL_SAMPLE_MARKDOWN = `# WinTTS — Local Speech

Bienvenido al lector de voz sintética local y multiplataforma.

Puedes **arrastrar y soltar** cualquier archivo de texto \`.md\` o \`.txt\` directamente sobre esta ventana.

### Características Principales
1. **Privacidad Total**: Tu texto no se envía a servidores externos.
2. **Soporte Markdown**: Renderizado enriquecido y código fuente limpio.
3. **Omisión de Selección**: Selecciona cualquier fragmento y márcalo para no leerlo ni exportarlo.
4. **Exportación WAV**: Guarda narraciones de audio directamente en tu disco.
`;

export function useDocument() {
  const [markdown, setMarkdown] = useState<string>(INITIAL_SAMPLE_MARKDOWN);
  const [skippedRanges, setSkippedRanges] = useState<SkippedRange[]>([]);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string }>({
    start: 0,
    end: 0,
    text: '',
  });

  const updateSelection = useCallback((start: number, end: number, text: string) => {
    setSelection({ start, end, text });
  }, []);

  const markSelectionSkipped = useCallback(() => {
    let currentSel = selection;
    if (currentSel.start === currentSel.end || !currentSel.text.trim()) {
      const winSel = window.getSelection()?.toString() || '';
      if (winSel.trim()) {
        let idx = markdown.indexOf(winSel);
        if (idx === -1) {
          const clean = winSel.replace(/[*_#`~[\]]/g, '').trim();
          idx = markdown.indexOf(clean);
        }
        if (idx !== -1) {
          currentSel = { start: idx, end: idx + winSel.length, text: winSel };
        }
      }
    }

    if (currentSel.start === currentSel.end || !currentSel.text.trim()) {
      return false;
    }

    const start = Math.min(currentSel.start, currentSel.end);
    const end = Math.max(currentSel.start, currentSel.end);

    setSkippedRanges((prev) => {
      const nonOverlapping = prev.filter((r) => r.end < start || r.start > end);
      const overlapping = prev.filter((r) => !(r.end < start || r.start > end));

      const mergedStart = overlapping.reduce((min, r) => Math.min(min, r.start), start);
      const mergedEnd = overlapping.reduce((max, r) => Math.max(max, r.end), end);

      const mergedRange: SkippedRange = {
        id: Math.random().toString(36).substring(2, 9),
        start: mergedStart,
        end: mergedEnd,
        text: markdown.substring(mergedStart, mergedEnd),
      };

      return [...nonOverlapping, mergedRange].sort((a, b) => a.start - b.start);
    });

    return true;
  }, [selection, markdown]);

  const includeSelection = useCallback(() => {
    let currentSel = selection;
    if (currentSel.start === currentSel.end || !currentSel.text.trim()) {
      const winSel = window.getSelection()?.toString() || '';
      if (winSel.trim()) {
        let idx = markdown.indexOf(winSel);
        if (idx === -1) {
          const clean = winSel.replace(/[*_#`~[\]]/g, '').trim();
          idx = markdown.indexOf(clean);
        }
        if (idx !== -1) {
          currentSel = { start: idx, end: idx + winSel.length, text: winSel };
        }
      }
    }

    if (currentSel.start === currentSel.end) {
      return false;
    }
    const start = Math.min(currentSel.start, currentSel.end);
    const end = Math.max(currentSel.start, currentSel.end);

    let changed = false;
    setSkippedRanges((prev) => {
      const next: SkippedRange[] = [];
      for (const r of prev) {
        if (r.end <= start || r.start >= end) {
          next.push(r);
        } else {
          changed = true;
          if (r.start < start) {
            next.push({
              id: Math.random().toString(36).substring(2, 9),
              start: r.start,
              end: start,
              text: markdown.substring(r.start, start),
            });
          }
          if (r.end > end) {
            next.push({
              id: Math.random().toString(36).substring(2, 9),
              start: end,
              end: r.end,
              text: markdown.substring(end, r.end),
            });
          }
        }
      }
      return next.sort((a, b) => a.start - b.start);
    });

    return changed;
  }, [selection, markdown]);

  const clearSkips = useCallback(() => {
    setSkippedRanges([]);
  }, []);

  const getReadableText = useCallback(() => {
    if (skippedRanges.length === 0) {
      return markdown;
    }

    let result = '';
    let lastIndex = 0;

    for (const range of skippedRanges) {
      if (range.start > lastIndex) {
        result += markdown.substring(lastIndex, range.start);
      }
      lastIndex = Math.max(lastIndex, range.end);
    }

    if (lastIndex < markdown.length) {
      result += markdown.substring(lastIndex);
    }

    return result;
  }, [markdown, skippedRanges]);

  const getReadableSelection = useCallback(() => {
    if (selection.start === selection.end || !selection.text) {
      return '';
    }

    const start = Math.min(selection.start, selection.end);
    const end = Math.max(selection.start, selection.end);

    let selText = '';
    let curr = start;

    for (const range of skippedRanges) {
      if (range.end <= start || range.start >= end) continue;

      if (range.start > curr) {
        selText += markdown.substring(curr, range.start);
      }
      curr = Math.max(curr, range.end);
    }

    if (curr < end) {
      selText += markdown.substring(curr, end);
    }

    return selText.trim();
  }, [markdown, selection, skippedRanges]);

  const stats: DocumentStats = useMemo(() => {
    const readable = getReadableText();
    const words = readable.trim().split(/\s+/).filter(Boolean).length;
    const chars = readable.length;
    const estimated_minutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 160));

    return { word_count: words, char_count: chars, estimated_minutes };
  }, [getReadableText]);

  return {
    markdown,
    setMarkdown,
    skippedRanges,
    selection,
    updateSelection,
    markSelectionSkipped,
    includeSelection,
    clearSkips,
    getReadableText,
    getReadableSelection,
    stats,
  };
}
