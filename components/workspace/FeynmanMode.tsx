'use client';

import { useCallback, useRef, useState } from 'react';
import { fetchEvaluation } from '@/lib/roast/ghostEvaluateClient';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { currentTaskName } from '@/lib/session/selectors';
import { useSession } from '@/lib/session/SessionContext';
import type { FeynmanResponse } from '@/lib/types';

const MAX_EXPLANATION_CHARS = 2000;

export function FeynmanMode() {
  const { state } = useSession();
  const [explanation, setExplanation] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeynmanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const speech = useSpeechRecognition();

  const derivedTopic = topic.trim() || currentTaskName(state);
  const charCount = explanation.length;
  const nearLimit = charCount > MAX_EXPLANATION_CHARS * 0.85;
  const canSubmit = explanation.trim().length >= 20 && !loading;

  // Called with each committed speech segment — append to current text
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
      // Focus the textarea so the user can see where text lands
      textareaRef.current?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    // Stop mic before submitting so the transcript is fully committed
    if (speech.listening) speech.stop();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetchEvaluation(
        { topicName: derivedTopic, explanation: explanation.trim() },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setResult(response);
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
      );
    } catch {
      if (!controller.signal.aborted) {
        setError('The ghost lost signal. Please try again.');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  // The textarea shows committed text; interim speech is shown as a subtle overlay hint
  const displayValue = explanation;

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Research note */}
      <aside className="rounded-xl border border-ecto-500/25 bg-ecto-500/5 px-4 py-3 text-xs text-bone/70 leading-relaxed">
        <span className="font-semibold text-ecto-400">👻 Feynman Technique:</span>{' '}
        Explaining a concept in your own words is one of the most reliable ways to find gaps in
        understanding — a process researchers call the{' '}
        <span className="italic">Protégé Effect</span>: teaching forces retrieval and reorganisation,
        which strengthens long-term retention.{' '}
        <span className="text-bone/50">(Chi et al., 1994; Fiorella &amp; Mayer, 2013)</span>
      </aside>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Optional topic override */}
        <div>
          <label htmlFor="feynman-topic" className="mb-1 block text-xs font-medium text-bone/70">
            Topic{' '}
            <span className="text-bone/40">
              (defaults to your current task: &ldquo;{derivedTopic}&rdquo;)
            </span>
          </label>
          <input
            id="feynman-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, 200))}
            placeholder={derivedTopic}
            className="w-full rounded-lg border border-crypt-700 bg-crypt-950/60 px-3 py-2 text-sm text-bone placeholder:text-bone/30 focus:border-ecto-500/70 focus:outline-none focus:ring-1 focus:ring-ecto-500/40 transition-colors"
          />
        </div>

        {/* Explanation textarea */}
        <div>
          {/* Label row: label left, mic button right */}
          <div className="mb-1 flex items-center justify-between gap-2">
            <label htmlFor="feynman-explain" className="text-xs font-medium text-bone/70">
              Explain what you just learned, in your own words
            </label>
            <MicButton speech={speech} onToggle={toggleMic} />
          </div>

          {/* Textarea + interim overlay wrapper */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="feynman-explain"
              value={displayValue}
              onChange={(e) => {
                // Allow manual edits; stop mic if user types while recording
                if (speech.listening) speech.stop();
                setExplanation(e.target.value.slice(0, MAX_EXPLANATION_CHARS));
              }}
              placeholder={
                speech.listening
                  ? ''
                  : 'Pretend you\'re explaining this to the ghost — it has centuries of time but zero patience for jargon…'
              }
              aria-label="Your explanation"
              aria-describedby="feynman-interim feynman-char-count"
              rows={6}
              className={`w-full resize-none rounded-xl border bg-crypt-950/60 px-4 py-3 text-sm text-bone placeholder:text-bone/30 focus:outline-none focus:ring-1 transition-colors ${
                speech.listening
                  ? 'border-blood-400/70 focus:border-blood-400 focus:ring-blood-400/30'
                  : 'border-crypt-700 focus:border-ecto-500/70 focus:ring-ecto-500/40'
              }`}
            />

            {/* Live interim transcript — shown as ghost text below committed text */}
            {speech.listening && speech.interim && (
              <p
                id="feynman-interim"
                aria-live="off"
                className="pointer-events-none absolute bottom-3 left-4 right-4 text-sm text-bone/40 italic truncate"
              >
                {speech.interim}
              </p>
            )}

            {/* Listening pill indicator inside the textarea bottom-right */}
            {speech.listening && (
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-blood-500/20 px-2.5 py-1 text-xs font-medium text-blood-400"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blood-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blood-500" />
                </span>
                Listening
              </span>
            )}
          </div>

          <div
            id="feynman-char-count"
            className="mt-1 flex items-center justify-between text-xs text-bone/40"
          >
            <span>
              {speech.listening
                ? 'Speak now — click the mic again or stop typing to end recording.'
                : explanation.trim().length < 20 && explanation.length > 0
                  ? 'Write at least 20 characters to submit.'
                  : ''}
            </span>
            <span className={nearLimit ? 'text-pumpkin-400' : ''}>
              {charCount}/{MAX_EXPLANATION_CHARS}
            </span>
          </div>
        </div>

        {/* Speech recognition error (non-fatal) */}
        {speech.speechError && (
          <p
            role="alert"
            className="rounded-lg border border-pumpkin-400/40 bg-pumpkin-400/5 px-3 py-2 text-xs text-pumpkin-400"
          >
            🎙️ {speech.speechError}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-ecto-400 px-4 py-2.5 font-semibold text-crypt-950 transition-colors hover:bg-ecto-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pumpkin-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <TypingDots />
              The ghost is thinking…
            </span>
          ) : (
            '👻 Ask the Ghost Mentor'
          )}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-blood-500/40 bg-blood-700/10 px-4 py-2 text-sm text-blood-400"
        >
          {error}
        </p>
      )}

      {result && (
        <div ref={resultRef} className="feynman-result flex flex-col gap-3">
          {/* Overall feedback */}
          <div className="rounded-xl border border-ecto-500/40 bg-crypt-800 px-4 py-3">
            <p className="text-sm italic text-bone leading-relaxed">
              <span className="not-italic font-semibold text-ecto-400">👻 </span>
              {result.feedback}
            </p>
            {result.source === 'fallback' && (
              <p className="mt-1 text-xs text-bone/40">(No API key — showing a local fallback.)</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <FeedbackCard icon="✅" label="What landed well" color="ecto" text={result.clear} />
            <FeedbackCard icon="🔍" label="What to sharpen" color="pumpkin" text={result.missing} />
          </div>

          {/* Simplify prompt */}
          <div className="rounded-xl border border-crypt-600 bg-crypt-800/70 px-4 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-bone/50">
              Next challenge
            </p>
            <p className="text-sm text-bone leading-relaxed">{result.simplifyPrompt}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setResult(null);
              setExplanation('');
            }}
            className="self-start rounded-lg border border-crypt-600 px-3 py-1.5 text-xs text-bone/60 hover:bg-crypt-700 hover:text-bone transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ecto-400"
          >
            Try again ↩
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MicButton({
  speech,
  onToggle,
}: {
  speech: ReturnType<typeof useSpeechRecognition>;
  onToggle: () => void;
}) {
  if (!speech.supported) {
    return (
      <span
        title="Speech recognition is not supported in this browser"
        className="inline-flex items-center gap-1.5 rounded-full border border-crypt-600 px-2.5 py-1 text-xs text-bone/30 cursor-not-allowed select-none"
        aria-label="Speech recognition unavailable"
      >
        <MicIcon muted />
        <span>Voice unavailable</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={speech.listening ? 'Stop recording' : 'Start voice input'}
      aria-pressed={speech.listening}
      title={speech.listening ? 'Stop recording' : 'Dictate your explanation'}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecto-400 ${
        speech.listening
          ? 'border-blood-400/70 bg-blood-500/15 text-blood-400 hover:bg-blood-500/25'
          : 'border-crypt-600 bg-crypt-800 text-bone/60 hover:border-ecto-500/50 hover:text-bone/90'
      }`}
    >
      <MicIcon listening={speech.listening} />
      <span>{speech.listening ? 'Stop' : 'Dictate'}</span>
    </button>
  );
}

function MicIcon({ listening = false, muted = false }: { listening?: boolean; muted?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={`h-3.5 w-3.5 shrink-0 ${listening ? 'animate-pulse' : ''}`}
    >
      {muted ? (
        // Mic with a slash
        <>
          <path d="M7 4a3 3 0 0 1 6 0v4a3 3 0 0 1-.184 1.03L7 3.184A3 3 0 0 1 7 4z" />
          <path d="M3.707 2.293a1 1 0 0 0-1.414 1.414l14 14a1 1 0 0 0 1.414-1.414l-1.473-1.473A9.98 9.98 0 0 0 17 10a1 1 0 1 0-2 0 8 8 0 0 1-.842 3.744L12.74 12.33A3 3 0 0 0 13 11V9.586l-2 2V11a1 1 0 0 1-1.829.542L3.707 2.293zM9 13.586V11l-1.11 1.11A3 3 0 0 0 10 14a2.98 2.98 0 0 0 .36-.022L9 13.586z" />
          <path d="M5 10a1 1 0 1 0-2 0 10 10 0 0 0 .101 1.384L4.586 12.9A8.001 8.001 0 0 1 5 10zM9 17v-1.07a9.027 9.027 0 0 1-3.72-1.509l1.42-1.42A7.005 7.005 0 0 0 10 14a7 7 0 0 0 7-7 1 1 0 1 0-2 0 5 5 0 0 1-5 5 5 5 0 0 1-4.9-4.07L3.52 9.52A9 9 0 0 0 9 17z" />
          <path d="M9 17h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2z" />
        </>
      ) : (
        // Standard mic
        <>
          <path d="M7 4a3 3 0 0 1 6 0v4a3 3 0 1 1-6 0V4z" />
          <path d="M5.5 9.643a.75.75 0 0 0-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5H10.75v-1.546A6.001 6.001 0 0 0 16 10v-.357a.75.75 0 0 0-1.5 0V10a4.5 4.5 0 0 1-9 0v-.357z" />
        </>
      )}
    </svg>
  );
}

function FeedbackCard({
  icon,
  label,
  color,
  text,
}: {
  icon: string;
  label: string;
  color: 'ecto' | 'pumpkin';
  text: string;
}) {
  const colorClass =
    color === 'ecto' ? 'border-ecto-500/30 text-ecto-300' : 'border-pumpkin-400/30 text-pumpkin-400';
  return (
    <div className={`rounded-xl border bg-crypt-800 px-4 py-3 ${colorClass}`}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">
        {icon} {label}
      </p>
      <p className="text-sm text-bone leading-relaxed">{text}</p>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-crypt-950" />
      <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-crypt-950" />
      <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-crypt-950" />
    </span>
  );
}
