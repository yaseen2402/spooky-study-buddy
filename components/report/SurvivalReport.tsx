'use client';

import { useEffect, useMemo, useRef } from 'react';
import { getFallback } from '@/lib/roast/fallbackRoasts';
import { completedThisSession, focusSeconds } from '@/lib/session/selectors';
import type { SessionState } from '@/lib/types';
import { toHHMMSS } from '@/lib/utils/formatTime';

interface Props {
  state: SessionState;
  onDismiss: () => void;
}

export function SurvivalReport({ state, onDismiss }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = state.sessionEnded;
  const fallback = useMemo(() => getFallback('congratulate'), []);
  const completed = completedThisSession(state);
  const focus = focusSeconds(state);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="report-title"
      onCancel={(e) => {
        e.preventDefault();
        onDismiss();
      }}
      className="w-[min(92vw,30rem)] rounded-2xl border border-ecto-500/50 bg-crypt-900 p-0 text-bone shadow-2xl backdrop:bg-black/70"
    >
      {open && (
        <div className="flex flex-col gap-5 p-6">
          <header className="text-center">
            <p className="text-sm uppercase tracking-widest text-ecto-400">Session complete</p>
            <h2 id="report-title" className="font-display text-4xl text-pumpkin-400">
              Survival Report
            </h2>
          </header>

          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-crypt-800 p-3 text-center">
              <dt className="text-xs uppercase tracking-wide text-bone/80">Focus time</dt>
              <dd className="font-mono text-2xl font-bold tabular-nums text-ecto-400" data-testid="focus-time">
                {toHHMMSS(focus)}
              </dd>
            </div>
            <div className="rounded-xl bg-crypt-800 p-3 text-center">
              <dt className="text-xs uppercase tracking-wide text-bone/80">Times haunted</dt>
              <dd className="font-mono text-2xl font-bold tabular-nums text-blood-400" data-testid="slack-count">
                {state.slackingOffCount}
              </dd>
            </div>
          </dl>

          <section aria-labelledby="report-tasks">
            <h3 id="report-tasks" className="mb-2 text-sm font-semibold text-bone/90">
              Tasks conquered ({completed.length})
            </h3>
            {completed.length === 0 ? (
              <p className="text-sm text-bone/70">None this time. The ghost noticed.</p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                {completed.map((t) => (
                  <li key={t.id} className="flex gap-2">
                    <span aria-hidden className="text-ecto-400">
                      ✓
                    </span>
                    <span className="break-words">{t.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <blockquote className="rounded-xl border border-ecto-500/40 bg-crypt-800 p-4 text-center italic" aria-live="polite">
            “{state.currentRoast ?? fallback}”
            <footer className="mt-1 text-xs not-italic text-bone/70">— your Ghost Buddy</footer>
          </blockquote>

          <button
            type="button"
            onClick={onDismiss}
            autoFocus
            className="rounded-lg bg-ecto-400 px-4 py-2 font-semibold text-crypt-950 hover:bg-ecto-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pumpkin-400"
          >
            Rise again (new session)
          </button>
        </div>
      )}
    </dialog>
  );
}
