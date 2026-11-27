'use client';

import { useCallback, useRef, useState } from 'react';
import { MicIcon } from '@/components/ui/Icons';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { fetchEvaluation } from '@/lib/roast/ghostEvaluateClient';
import { useSession } from '@/lib/session/SessionContext';
import { currentTaskName } from '@/lib/session/selectors';
import type { FeynmanResponse } from '@/lib/types';

const MAX_EXPLANATION_CHARS = 2000;
const MIN_EXPLANATION_CHARS = 20;

export function FeynmanMode() {
  const { state } = useSession();
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeynmanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const speech = useSpeechRecognition();

  const trimmedLength = explanation.trim().length;
  const canSubmit = trimmedLength >= MIN_EXPLANATION_CHARS && !loading;

  const onFinalTranscript = useCallback((text: string) => {
    setExplanation((prev) => {
      const joined = prev ? `${prev.trimEnd()} ${text.trim()}` : text.trim();
      return joined.slice(0, MAX_EXPLANATION_CHARS);
    });
  }, []);

  function toggleMic() {
    if (speech.listening) {
      speech.stop();
    } else {
      speech.start(onFinalTranscript);
      textareaRef.current?.focus();
    }
  }

  async function teach() {
    if (!canSubmit) return;
    if (speech.listening) speech.stop();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetchEvaluation(
        { topicName: currentTaskName(state), explanation: explanation.trim() },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setResult(response);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    } catch {
      if (!controller.signal.aborted) setError('The ghost lost signal. Try again.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  // Short status line under the textarea: listening, too short, near the limit, or errors.
  const LISTEN_PHASE = { off: '', starting: 'Starting mic…', 'mic-open': 'Mic on — start talking', hearing: 'Hearing you…' };
  const hint = speech.speechError
    ? speech.speechError
    : speech.listening || speech.phase !== 'off'
      ? speech.interim || LISTEN_PHASE[speech.phase] || 'Listening…'
      : error
        ? error
        : explanation.length > 0 && trimmedLength < MIN_EXPLANATION_CHARS
          ? `${MIN_EXPLANATION_CHARS - trimmedLength} more characters`
          : explanation.length > MAX_EXPLANATION_CHARS * 0.85
            ? `${explanation.length}/${MAX_EXPLANATION_CHARS}`
            : '';

  return (
    <>
      <textarea
        ref={textareaRef}
        className={`feynman-textarea${speech.listening ? ' recording' : ''}`}
        value={explanation}
        onChange={(e) => {
          if (speech.listening) speech.stop();
          setExplanation(e.target.value.slice(0, MAX_EXPLANATION_CHARS));
        }}
        placeholder="Teach me what you just learned — no textbook jargon."
        aria-label="Your explanation"
        aria-describedby="feynman-hint"
      />
      <p id="feynman-hint" className="feynman-hint" aria-live="polite">
        {hint}
      </p>

      <div className="feynman-toolbar">
        <button
          type="button"
          className="btn-mic"
          onClick={toggleMic}
          disabled={!speech.supported}
          aria-pressed={speech.listening}
          title={speech.supported ? undefined : 'Dictation needs Chrome or Edge (not available in Firefox, Safari on some versions, or Brave)'}
        >
          <MicIcon size={14} />
          {speech.supported ? (speech.listening ? 'Stop' : 'Dictate') : 'No mic'}
        </button>
        <button type="button" className="btn-teach" onClick={teach} disabled={!canSubmit}>
          {loading ? 'Thinking…' : 'Teach the Ghost'}
        </button>
      </div>

      {result && (
        <div ref={resultRef} className="critique-box" aria-live="polite">
          <p className="critique-verdict">{result.feedback}</p>
          <div className="critique-item">
            <span className="critique-heading landed">What landed</span>
            <p className="critique-body">{result.clear}</p>
          </div>
          <div className="critique-item">
            <span className="critique-heading sharpen">Sharpen this</span>
            <p className="critique-body">{result.missing}</p>
          </div>
          <div className="critique-item">
            <span className="critique-heading simpler">Make it simpler</span>
            <p className="critique-body">{result.simplifyPrompt}</p>
          </div>
          {result.source === 'fallback' && <p className="critique-note">No API key set — offline feedback.</p>}
        </div>
      )}
    </>
  );
}
