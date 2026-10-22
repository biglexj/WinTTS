import { useState, useRef, useEffect, useCallback } from 'react';
import type { PlaybackState, SpeechSettings } from '../types';
import { tauriBridge } from '../services/tauriBridge';

export function useSpeech() {
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [statusText, setStatusText] = useState<string>('Listo');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentSpokenWord, setCurrentSpokenWord] = useState<string>('');

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeTextRef = useRef<string>('');
  const textLengthRef = useRef<number>(0);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlaybackState('idle');
    setProgressPercent(0);
    setCurrentSpokenWord('');
    setStatusText('Lectura detenida.');
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis && playbackState === 'speaking') {
      window.speechSynthesis.pause();
      setPlaybackState('paused');
      setStatusText('Lectura en pausa.');
    }
  }, [playbackState]);

  const resume = useCallback(() => {
    if (window.speechSynthesis && playbackState === 'paused') {
      window.speechSynthesis.resume();
      setPlaybackState('speaking');
      setStatusText('Reanudando lectura…');
    }
  }, [playbackState]);

  const speak = useCallback(
    async (text: string, settings: SpeechSettings, customStatus?: string) => {
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

      activeTextRef.current = cleanText;
      textLengthRef.current = cleanText.length;
      setProgressPercent(0);
      setStatusText(customStatus || 'Leyendo documento');
      setPlaybackState('speaking');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;

      // Rate: Slider is -10 to +10. Map -10 -> 0.5x, 0 -> 1.0x, +10 -> 2.0x
      const rateMultiplier = settings.rate >= 0
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
        const matched = available.find((v) => v.name === settings.voiceName || v.voiceURI === settings.voiceName);
        if (matched) {
          utterance.voice = matched;
        }
      }

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const charIndex = event.charIndex;
          const word = cleanText.substring(charIndex, charIndex + (event.charLength || 10)).split(/\s+/)[0];
          setCurrentSpokenWord(word);

          const percent = textLengthRef.current > 0
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
    []
  );

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
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
  };
}
