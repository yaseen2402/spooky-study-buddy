'use client';

import { useRef, useState } from 'react';
import { fetchEvaluation } from '@/lib/roast/ghostEvaluateClient';
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

  const derivedTopic = topic.trim() || currentTaskName(state);
  const canSubmit = explanation.trim().length >= 20 && !loading;
  const charCount = explanation.length;
  const nearLimit = charCount > MAX_EXPLANATION_CHARS * 0.85;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

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
      // Scroll result into view after render
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    } catch {
      if (!controller.signal.aborted) {
        setError('The ghost lost signal. Please try again.');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Research note */}
      <aside className="rounded-xl border border-ecto-500/25 bg-ecto-500/5 px-4 py-3 text-xs text-bone/70 leading-relaxed">
        <span className="font-semibold text-ecto-400">👻 Feynman Technique:</span>{' '}
        Explaining a concept in your own words is one of the most reliable ways to find gaps in understanding
        — a process researchers call the{' '}
        <span className="italic">Protégé Effect</span>: teaching forces retrieval and reorganisation, which
        strengthens long-term retention.{' '}
        <span className="text-bone/50">(Chi et al., 1994; Fiorella &amp; Mayer, 2013)</span>
      </aside>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Optional topic override */}
        <div>
          <label htmlFor="feynman-topic" className="mb-1 block text-xs font-medium text-bone/70">
            Topic{' '}
            <span className="text-bone/40">(defaults to your current task: &ldquo;{derivedTopic}&rdquo;)</span>
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
          <label htmlFor="feynman-explain" className="mb-1 block text-xs font-medium text-bone/70">
            Explain what you just learned, in your own words
          </label>
          <textarea
            id="feynman-explain"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value.slice(0, MAX_EXPLANATION_CHARS))}
            placeholder="Pretend you're explaining this to the ghost — it has centuries of time but zero patience for jargon…"
            aria-label="Your explanation"
            rows={6}
            className="w-full resize-none rounded-xl border border-crypt-700 bg-crypt-950/60 px-4 py-3 text-sm text-bone placeholder:text-bone/30 focus:border-ecto-500/70 focus:outline-none focus:ring-1 focus:ring-ecto-500/40 transition-colors"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-bone/40">
            <span>{explanation.trim().length < 20 && explanation.length > 0 ? 'Write at least 20 characters to submit.' : ''}</span>
            <span className={nearLimit ? 'text-pumpkin-400' : ''}>
              {charCount}/{MAX_EXPLANATION_CHARS}
            </span>
          </div>
        </div>

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
        <p role="alert" className="rounded-lg border border-blood-500/40 bg-blood-700/10 px-4 py-2 text-sm text-blood-400">
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
            {/* What was clear */}
            <FeedbackCard
              icon="✅"
              label="What landed well"
              color="ecto"
              text={result.clear}
            />
            {/* What was missing */}
            <FeedbackCard
              icon="🔍"
              label="What to sharpen"
              color="pumpkin"
              text={result.missing}
            />
          </div>

          {/* Simplify prompt */}
          <div className="rounded-xl border border-crypt-600 bg-crypt-800/70 px-4 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-bone/50">Next challenge</p>
            <p className="text-sm text-bone leading-relaxed">{result.simplifyPrompt}</p>
          </div>

          <button
            type="button"
            onClick={() => { setResult(null); setExplanation(''); }}
            className="self-start rounded-lg border border-crypt-600 px-3 py-1.5 text-xs text-bone/60 hover:bg-crypt-700 hover:text-bone transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ecto-400"
          >
            Try again ↩
          </button>
        </div>
      )}
    </div>
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
    color === 'ecto'
      ? 'border-ecto-500/30 text-ecto-300'
      : 'border-pumpkin-400/30 text-pumpkin-400';
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
