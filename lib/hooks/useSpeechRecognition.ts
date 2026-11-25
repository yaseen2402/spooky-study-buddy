'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechSupport = 'unsupported' | 'idle' | 'listening' | 'error';

export interface UseSpeechRecognitionResult {
  /** Whether the browser supports SpeechRecognition at all. */
  supported: boolean;
  listening: boolean;
  /** Live interim transcript while recording (not yet committed). */
  interim: string;
  /** Start listening. `onFinal` is called with each committed transcript segment. */
  start: (onFinal: (text: string) => void) => void;
  /** Stop listening immediately. */
  stop: () => void;
  /** Non-null when recognition threw a recoverable error (e.g. no-speech, audio-capture). */
  speechError: string | null;
}

// ── Minimal browser type shims (SpeechRecognition is not in every TS lib) ────

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionCtor {
  new (): SpeechRecognitionInstance;
}

type SpeechWindow = typeof window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

// ─────────────────────────────────────────────────────────────────────────────

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access was denied. Allow it in your browser settings.',
  'audio-capture': 'No microphone found. Plug one in and try again.',
  'no-speech': 'No speech detected. Try speaking closer to the mic.',
  'network': 'Speech recognition needs a network connection.',
  'aborted': '', // silent — user-initiated stop
};

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const RecognitionCtor = getSpeechRecognition();
  const supported = RecognitionCtor !== null;

  const recogRef = useRef<SpeechRecognitionInstance | null>(null);
  const onFinalRef = useRef<((text: string) => void) | null>(null);

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recogRef.current?.abort();
    };
  }, []);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    // onend handler clears state
  }, []);

  const start = useCallback(
    (onFinal: (text: string) => void) => {
      if (!RecognitionCtor) return;

      // Stop any ongoing session first
      recogRef.current?.abort();
      setSpeechError(null);
      onFinalRef.current = onFinal;

      const recog = new RecognitionCtor();
      recog.continuous = true;      // keep listening until stop() is called
      recog.interimResults = true;  // show live partial results
      recog.lang = navigator.language || 'en-US';
      recog.maxAlternatives = 1;

      recog.onstart = () => {
        setListening(true);
        setInterim('');
      };

      recog.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            onFinalRef.current?.(result[0].transcript);
          } else {
            interimText += result[0].transcript;
          }
        }
        setInterim(interimText);
      };

      recog.onerror = (event: SpeechRecognitionErrorEvent) => {
        const msg = ERROR_MESSAGES[event.error] ?? `Speech error: ${event.error}`;
        if (msg) setSpeechError(msg);
        // onend fires after onerror and clears listening state
      };

      recog.onend = () => {
        setListening(false);
        setInterim('');
        recogRef.current = null;
        onFinalRef.current = null;
      };

      recogRef.current = recog;
      try {
        recog.start();
      } catch {
        // start() throws if called on an already-started instance
        setListening(false);
      }
    },
    [RecognitionCtor],
  );

  return { supported, listening, interim, start, stop, speechError };
}
