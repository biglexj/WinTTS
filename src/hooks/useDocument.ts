import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { DocumentStats, SkippedRange } from '../types';
import { tauriBridge } from '../services/tauriBridge';

const INITIAL_SAMPLE_MARKDOWN = `# WinTTS — Local Speech

Bienvenido al lector de voz sintética local y multiplataforma.

Puedes **arrastrar y soltar** cualquier archivo de texto \`.md\` o \`.txt\` directamente sobre esta ventana.

### Características Principales
1. **Privacidad Total**: Tu texto no se envía a servidores externos.
2. **Soporte Markdown**: Renderizado enriquecido y código fuente limpio.
3. **Omisión de Selección**: Selecciona cualquier fragmento y márcalo para no leerlo ni exportarlo.
4. **Exportación WAV**: Guarda narraciones de audio directamente en tu disco.
`;

const DRAFT_STORAGE_KEY = 'wintts_draft_v1';

interface StoredDraft {
  filePath: string | null;
  fileName: string;
  content: string;
  dirty: boolean;
}

/**
 * Recalcula las posiciones de los fragmentos omitidos tras una edición.
 *
 * Las omisiones se guardan como offsets absolutos, así que al escribir por
 * encima de ellas quedaban apuntando a otro texto. Se usa el prefijo comun
 * entre el texto viejo y el nuevo para localizar el punto exacto del cambio.
 */
export function rebaseSkippedRanges(
  ranges: SkippedRange[],
  previousText: string,
  nextText: string
): SkippedRange[] {
  if (ranges.length === 0 || previousText === nextText) {
    return ranges;
  }

  const maxPrefix = Math.min(previousText.length, nextText.length);
  let common = 0;
  while (common < maxPrefix && previousText[common] === nextText[common]) {
    common += 1;
  }

  const delta = nextText.length - previousText.length;

  return ranges
    .map((range) => {
      const start = range.start;
      const end = range.end;

      if (start >= common) {
        const newStart = Math.min(Math.max(0, start + delta), nextText.length);
        const newEnd = Math.min(Math.max(newStart, end + delta), nextText.length);
        return { ...range, start: newStart, end: newEnd };
      }

      if (end <= common) {
        return range;
      }

      // La edicion cae dentro del fragmento omitido: se conserva el inicio.
      const newEnd = Math.min(Math.max(start, end + delta), nextText.length);
      return { ...range, start, end: newEnd };
    })
    .filter((range) => range.end > range.start);
}

export function useDocument() {
  const [markdown, setMarkdownState] = useState<string>(INITIAL_SAMPLE_MARKDOWN);
  const [skippedRanges, setSkippedRanges] = useState<SkippedRange[]>([]);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string }>({
    start: 0,
    end: 0,
    text: '',
  });

  const markdownRef = useRef(markdown);
  const filePathRef = useRef(filePath);

  useEffect(() => {
    filePathRef.current = filePath;
  }, [filePath]);

  // Restaura el borrador de la sesion anterior para no perder trabajo al cerrar.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw) return;

        const draft = JSON.parse(raw) as StoredDraft;
        if (!draft?.content) return;

        markdownRef.current = draft.content;
        setMarkdownState(draft.content);
        setFilePath(draft.filePath ?? null);
        setFileName(draft.fileName ?? '');
        setSkippedRanges([]);

        if (!cancelled) {
          // El estado de "sin guardar" viaja con el borrador: un documento
          // recien abierto no debe aparecer modificado.
          setIsDirty(draft.dirty === true);
        }
      } catch (err) {
        console.warn('No se pudo restaurar el borrador:', err);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persistencia del borrador.
  useEffect(() => {
    const payload: StoredDraft = { filePath, fileName, content: markdown, dirty: isDirty };
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('No se pudo guardar el borrador:', err);
    }
  }, [markdown, filePath, fileName, isDirty]);

  const setMarkdown = useCallback((nextText: string) => {
    const previous = markdownRef.current;
    if (nextText === previous) return;

    setSkippedRanges((ranges) => rebaseSkippedRanges(ranges, previous, nextText));
    markdownRef.current = nextText;
    setMarkdownState(nextText);
    setIsDirty(true);
  }, []);

  const updateSelection = useCallback((start: number, end: number, text: string) => {
    setSelection({ start, end, text });
  }, []);

  const markSelectionSkipped = useCallback(() => {
    let currentSel = selection;
    if (currentSel.start === currentSel.end || !currentSel.text.trim()) {
      const winSel = window.getSelection()?.toString() || '';
      if (winSel.trim()) {
        let idx = markdownRef.current.indexOf(winSel);
        if (idx === -1) {
          const clean = winSel.replace(/[*_#`~[\]]/g, '').trim();
          idx = markdownRef.current.indexOf(clean);
        }
        if (idx !== -1) {
          currentSel = { start: idx, end: idx + winSel.length, text: winSel };
        }
      }
    }

    if (currentSel.start === currentSel.end || !currentSel.text.trim()) {
      return false;
    }

    const source = markdownRef.current;
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
        text: source.substring(mergedStart, mergedEnd),
      };

      return [...nonOverlapping, mergedRange].sort((a, b) => a.start - b.start);
    });

    return true;
  }, [selection]);

  const includeSelection = useCallback(() => {
    let currentSel = selection;
    if (currentSel.start === currentSel.end || !currentSel.text.trim()) {
      const winSel = window.getSelection()?.toString() || '';
      if (winSel.trim()) {
        let idx = markdownRef.current.indexOf(winSel);
        if (idx === -1) {
          const clean = winSel.replace(/[*_#`~[\]]/g, '').trim();
          idx = markdownRef.current.indexOf(clean);
        }
        if (idx !== -1) {
          currentSel = { start: idx, end: idx + winSel.length, text: winSel };
        }
      }
    }

    if (currentSel.start === currentSel.end) {
      return false;
    }
    const source = markdownRef.current;
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
              text: source.substring(r.start, start),
            });
          }
          if (r.end > end) {
            next.push({
              id: Math.random().toString(36).substring(2, 9),
              start: end,
              end: r.end,
              text: source.substring(end, r.end),
            });
          }
        }
      }
      return next.sort((a, b) => a.start - b.start);
    });

    return changed;
  }, [selection]);

  const clearSkips = useCallback(() => {
    setSkippedRanges([]);
  }, []);

  const getReadableText = useCallback(() => {
    const source = markdownRef.current;
    if (skippedRanges.length === 0) {
      return source;
    }

    let result = '';
    let lastIndex = 0;

    for (const range of skippedRanges) {
      if (range.start > lastIndex) {
        result += source.substring(lastIndex, range.start);
      }
      lastIndex = Math.max(lastIndex, range.end);
    }

    if (lastIndex < source.length) {
      result += source.substring(lastIndex);
    }

    return result;
  }, [skippedRanges]);

  const getReadableSelection = useCallback(() => {
    const source = markdownRef.current;
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
        selText += source.substring(curr, range.start);
      }
      curr = Math.max(curr, range.end);
    }

    if (curr < end) {
      selText += source.substring(curr, end);
    }

    return selText.trim();
  }, [selection, skippedRanges]);

  /** Carga un documento desde disco. */
  const loadDocument = useCallback((content: string, path: string | null, name: string) => {
    markdownRef.current = content;
    setMarkdownState(content);
    setSkippedRanges([]);
    setFilePath(path);
    setFileName(name);
    setIsDirty(false);
  }, []);

  /** Abre el dialogo del sistema y carga el documento elegido. */
  const openDocument = useCallback(async (): Promise<boolean> => {
    try {
      const result = await tauriBridge.openTextFileDialog();
      if (!result) return false;
      loadDocument(result.content, result.path, result.filename);
      return true;
    } catch (err) {
      console.error('Error al abrir el documento:', err);
      return false;
    }
  }, [loadDocument]);

  /** Guarda el documento en su ruta actual. Si no tiene ruta, pide una. */
  const saveDocument = useCallback(async (): Promise<boolean> => {
    const target = filePathRef.current;

    if (!target) {
      return saveDocumentAs();
    }

    try {
      await tauriBridge.saveTextFile(target, markdownRef.current);
      setIsDirty(false);
      return true;
    } catch (err) {
      console.error('Error al guardar el documento:', err);
      return false;
    }
  }, []);

  /** Pide una ruta y guarda el documento en ella. */
  const saveDocumentAs = useCallback(async (): Promise<boolean> => {
    try {
      const suggestion = fileName || 'documento.md';
      const target = await tauriBridge.saveTextFileDialog(suggestion);
      if (!target) return false;

      await tauriBridge.saveTextFile(target, markdownRef.current);
      filePathRef.current = target;
      setFilePath(target);
      setFileName(target.split(/[\\/]/).pop() ?? target);
      setIsDirty(false);
      return true;
    } catch (err) {
      console.error('Error al guardar el documento:', err);
      return false;
    }
  }, [fileName]);

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
    filePath,
    fileName,
    isDirty,
    updateSelection,
    markSelectionSkipped,
    includeSelection,
    clearSkips,
    getReadableText,
    getReadableSelection,
    loadDocument,
    openDocument,
    saveDocument,
    saveDocumentAs,
    stats,
  };
}
