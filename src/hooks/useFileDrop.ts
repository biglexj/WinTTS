import { useState, useEffect, useCallback } from 'react';
import { tauriBridge } from '../services/tauriBridge';

interface UseFileDropOptions {
  onFileLoaded: (content: string, filename: string) => void;
  onError?: (message: string) => void;
}

export function useFileDrop({ onFileLoaded, onError }: UseFileDropOptions) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only toggle if leaving the window
    if (e.relatedTarget === null || (e.clientX <= 0 || e.clientY <= 0)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const filename = file.name;
      const ext = filename.split('.').pop()?.toLowerCase();

      if (ext !== 'md' && ext !== 'txt' && ext !== 'markdown') {
        onError?.(`El archivo '${filename}' no es un archivo .md o .txt válido.`);
        return;
      }

      // Check if Tauri path exists on File object or read via FileReader
      const fileWithPath = file as unknown as { path?: string };
      if (fileWithPath.path) {
        try {
          const res = await tauriBridge.readFile(fileWithPath.path);
          onFileLoaded(res.content, res.filename);
          return;
        } catch (err) {
          console.warn('Fallback to browser FileReader:', err);
        }
      }

      // Fallback: standard FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          onFileLoaded(text, filename);
        }
      };
      reader.onerror = () => {
        onError?.(`No fue posible leer el archivo '${filename}'.`);
      };
      reader.readAsText(file);
    },
    [onFileLoaded, onError]
  );

  useEffect(() => {
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragOver, handleDragLeave, handleDrop]);

  return { isDragging };
}
