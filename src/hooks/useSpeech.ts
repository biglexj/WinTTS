import { useState, useRef, useEffect, useCallback } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { appCacheDir } from '@tauri-apps/api/path';
import type { PlaybackState, SpeechSettings, SystemVoice } from '../types';
import { tauriBridge, isTauri } from '../services/tauriBridge';

/** Datos del motor neuronal necesarios para leer con Piper. */
export interface PiperRuntime {
  binaryPath: string;
  engineReady: boolean;
  resolveModelPath: (modelId: string) => string | undefined;
}

export function useSpeech(piper: PiperRuntime) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [statusText, setStatusText] = useState<string>('Listo');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentSpokenWord, setCurrentSpokenWord] = useState<string>('');

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeTextRef = useRef<string>('');
  const textLengthRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const piperWavRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlaybackState('idle');
    setProgressPercent(0);
    setCurrentSpokenWord('');
    setStatusText('Lectura detenida.');
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaybackState('paused');
      setStatusText('Lectura en pausa.');
      return;
    }
    if (window.speechSynthesis && playbackState === 'speaking') {
      window.speechSynthesis.pause();
      setPlaybackState('paused');
      setStatusText('Lectura en pausa.');
    }
  }, [playbackState]);

  const resume = useCallback(() => {
    if (audioRef.current) {
      void audioRef.current.play();
      setPlaybackState('speaking');
      setStatusText('Reanudando lectura…');
      return;
    }
    if (window.speechSynthesis && playbackState === 'paused') {
      window.speechSynthesis.resume();
      setPlaybackState('speaking');
      setStatusText('Reanudando lectura…');
    }
  }, [playbackState]);

  /** Sintetiza con Piper y devuelve la ruta del WAV generado. */
  const synthesizeWithPiper = useCallback(
    async (
      text: string,
      settings: SpeechSettings,
      voice: SystemVoice
    ): Promise<string> => {
      const modelId = voice.id.replace(/^piper-/, '');
      const modelPath = piper.resolveModelPath(modelId);

      if (!piper.engineReady) {
        throw new Error(
          'El motor Piper no está configurado. Indica la ruta de piper.exe en Ajustes → Voces neuronales.'
        );
      }
      if (!modelPath) {
        throw new Error(`El modelo '${modelId}' no está instalado en este equipo.`);
      }

      const cacheDir = isTauri() ? await appCacheDir() : '';
      const outputPath = `${cacheDir}/piper_${modelId}_${Date.now()}.wav`;

      // Piper controla la velocidad con length_scale (inverso al multiplicador).
      const rateMultiplier =
        settings.rate >= 0
          ? 1.0 + (settings.rate / 10) * 1.0
          : 1.0 + (settings.rate / 10) * 0.5;
      const lengthScale = 1 / Math.max(0.5, Math.min(2.5, rateMultiplier));

      return await tauriBridge.synthesizeWithPiper(
        piper.binaryPath,
        modelPath,
        text,
        outputPath,
        lengthScale
      );
    },
    [piper]
  );

  const speak = useCallback(
    async (
      text: string,
      settings: SpeechSettings,
      customStatus?: string,
      voice?: SystemVoice
    ) => {
      if (!text || text.trim().length === 0) {
        setStatusText('No hay texto legible en el alcance elegido.');
        return;
      }

      const cleanText = await tauriBridge.preprocessText(text);
      if (!cleanText.trim()) {
        setStatusText('No hay texto legible después del preprocesamiento.');
        return;
      }

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      activeTextRef.current = cleanText;
      textLengthRef.current = cleanText.length;
      setProgressPercent(0);
      setCurrentSpokenWord('');

      // --- Motor neural (Piper) ---------------------------------------
      if (voice && voice.provider === 'piper') {
        setPlaybackState('speaking');
        setStatusText(customStatus || 'Preparando la voz neural…');

        try {
          const wavPath = await synthesizeWithPiper(cleanText, settings, voice);
          piperWavRef.current = wavPath;

          if (!isTauri()) {
            setStatusText('La voz neural solo funciona en la aplicación de escritorio.');
            setPlaybackState('error');
            return;
          }

          const audio = new Audio(convertFileSrc(wavPath));
          audio.volume = Math.max(0, Math.min(1, settings.volume / 100));
          audioRef.current = audio;

          audio.ontimeupdate = () => {
            if (audio.duration && Number.isFinite(audio.duration)) {
              const percent = Math.min(100, Math.round((audio.currentTime / audio.duration) * 100));
              setProgressPercent(percent);
              setStatusText(`Leyendo (voz neural): ${percent}%`);
            }
          };
          audio.onended = () => {
            setPlaybackState('idle');
            setProgressPercent(100);
            setCurrentSpokenWord('');
            setStatusText('Lectura completada.');
            audioRef.current = null;
          };
          audio.onerror = () => {
            setPlaybackState('error');
            setStatusText('No se pudo reproducir el audio generado por Piper.');
            audioRef.current = null;
          };

          setStatusText(customStatus || 'Leyendo con voz neural…');
          await audio.play();
        } catch (err) {
          setPlaybackState('error');
          setStatusText(`Error de la voz neural: ${err instanceof Error ? err.message : String(err)}`);
        }
        return;
      }

      // --- Motor del sistema (WebView) --------------------------------
      if (!window.speechSynthesis) {
        setStatusText('Este entorno no dispone de motor de voz.');
        setPlaybackState('error');
        return;
      }

      setStatusText(customStatus || 'Leyendo documento');
      setPlaybackState('speaking');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;

      // Rate: Slider is -10 to +10. Map -10 -> 0.5x, 0 -> 1.0x, +10 -> 2.0x
      const rateMultiplier =
        settings.rate >= 0
          ? 1.0 + (settings.rate / 10) * 1.0
          : 1.0 + (settings.rate / 10) * 0.5;
      utterance.rate = Math.max(0.5, Math.min(2.5, rateMultiplier));

      // Volume: 0 to 100 -> 0.0 to 1.0
      utterance.volume = Math.max(0, Math.min(1, settings.volume / 100));

      // Pitch: -10 to +10 -> 0.5 to 1.5
      const pitchMultiplier = 1.0 + (settings.pitch / 20);
      utterance.pitch = Math.max(0.5, Math.min(1.5, pitchMultiplier));

      // Select voice if available
      if (settings.voiceName && window.speechSynthesis) {
        const available = window.speechSynthesis.getVoices();
        const matched = available.find(
          (v) => v.name === settings.voiceName || v.voiceURI === settings.voiceName
        );
        if (matched) {
          utterance.voice = matched;
        }
      }

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const charIndex = event.charIndex;
          const word = cleanText
            .substring(charIndex, charIndex + (event.charLength || 10))
            .split(/\s+/)[0];
          setCurrentSpokenWord(word);

          const percent =
            textLengthRef.current > 0
              ? Math.min(100, Math.round((charIndex / textLengthRef.current) * 100))
              : 0;
          setProgressPercent(percent);
          setStatusText(`Leyendo: ${word}`);
        }
      };

      utterance.onend = () => {
        setPlaybackState('idle');
        setProgressPercent(100);
        setCurrentSpokenWord('');
        setStatusText('Lectura completada.');
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled') {
          setPlaybackState('error');
          setStatusText(`Error de lectura: ${e.error}`);
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [piper, synthesizeWithPiper]
  );

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    playbackState,
    statusText,
    setStatusText,
    progressPercent,
    currentSpokenWord,
    speak,
    pause,
    resume,
    stop,
    synthesizeWithPiper,
  };
}
