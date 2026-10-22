import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { appDataDir } from '@tauri-apps/api/path';
import type { AppSettings, PiperCatalogModel, PiperInstalledModel } from '../types';
import { piperConfigUrl, piperModelUrl } from '../types';
import { tauriBridge, isTauri } from '../services/tauriBridge';

export interface PiperDownloadState {
  modelId: string;
  downloaded: number;
  total: number;
}

/** Controlador que expone el estado del motor neuronal a la interfaz. */
export type PiperController = ReturnType<typeof usePiper>;

/**
 * Estado real del motor neuronal: que modelos hay **en disco**, si el
 * ejecutable de Piper esta configurado y como descargar o quitar modelos.
 */
export function usePiper(settings: AppSettings) {
  const [installed, setInstalled] = useState<PiperInstalledModel[]>([]);
  const [engineReady, setEngineReady] = useState<boolean>(false);
  const [modelsDir, setModelsDir] = useState<string>(settings.piperModelsDir);
  const [download, setDownload] = useState<PiperDownloadState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);

  // Carpeta efectiva de modelos: si la configurada trae variables de entorno
  // sin expandir, se resuelve contra el directorio de datos de la app.
  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const configured = settings.piperModelsDir;
      if (configured && !configured.includes('%')) {
        if (!cancelled) setModelsDir(configured);
        return;
      }

      if (!isTauri()) {
        if (!cancelled) setModelsDir(configured);
        return;
      }

      try {
        const base = await appDataDir();
        const resolved = `${base}\\piper\\models`;
        if (!cancelled) setModelsDir(resolved);
      } catch (err) {
        console.warn('No se pudo resolver la carpeta de modelos:', err);
        if (!cancelled) setModelsDir(configured);
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [settings.piperModelsDir]);

  const refresh = useCallback(async () => {
    const [modelList, ready] = await Promise.all([
      tauriBridge.listPiperModels(modelsDir),
      tauriBridge.piperEngineAvailable(settings.piperBinaryPath),
    ]);
    setInstalled(modelList);
    setEngineReady(ready);
    return modelList;
  }, [modelsDir, settings.piperBinaryPath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Progreso de descarga en tiempo real.
  useEffect(() => {
    let disposed = false;

    tauriBridge
      .onPiperDownloadProgress((progress) => {
        if (disposed) return;
        setDownload((current) => {
          if (!current || current.modelId !== progress.modelId) return current;
          return { ...current, downloaded: progress.downloaded, total: progress.total };
        });
      })
      .then((unlisten) => {
        if (disposed) {
          unlisten();
          return;
        }
        unlistenRef.current = unlisten;
      })
      .catch(() => {});

    return () => {
      disposed = true;
      unlistenRef.current?.();
      unlistenRef.current = null;
    };
  }, []);

  const downloadModel = useCallback(
    async (model: PiperCatalogModel) => {
      if (!modelsDir) {
        setError('No hay una carpeta de modelos configurada.');
        return false;
      }

      setError(null);
      setDownload({ modelId: model.id, downloaded: 0, total: Math.round(model.sizeMB * 1024 * 1024) });

      const modelPath = `${modelsDir}\\${model.id}.onnx`;
      const configPath = `${modelsDir}\\${model.id}.onnx.json`;

      try {
        await tauriBridge.downloadPiperModel(model.id, piperModelUrl(model), modelPath);
        await tauriBridge.downloadPiperModel(model.id, piperConfigUrl(model), configPath);
        await refresh();
        return true;
      } catch (err) {
        // Si falla la configuracion, el peso solo no sirve: se limpia.
        try {
          await tauriBridge.removePiperModel(modelPath);
        } catch {
          // Nada que limpiar.
        }
        setError(err instanceof Error ? err.message : String(err));
        await refresh();
        return false;
      } finally {
        setDownload(null);
      }
    },
    [modelsDir, refresh]
  );

  const uninstallModel = useCallback(
    async (modelId: string) => {
      const target = installed.find((m) => m.id === modelId);
      if (!target) return false;

      try {
        await tauriBridge.removePiperModel(target.path);
        await refresh();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [installed, refresh]
  );

  const resolveModelPath = useCallback(
    (modelId: string) => installed.find((m) => m.id === modelId)?.path,
    [installed]
  );

  const runtime = useMemo(
    () => ({
      binaryPath: settings.piperBinaryPath,
      engineReady,
      resolveModelPath,
    }),
    [settings.piperBinaryPath, engineReady, resolveModelPath]
  );

  return {
    installed,
    engineReady,
    modelsDir,
    download,
    error,
    clearError: () => setError(null),
    refresh,
    downloadModel,
    uninstallModel,
    resolveModelPath,
    runtime,
  };
}
