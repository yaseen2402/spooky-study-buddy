'use client';

import { useEffect, useMemo, useRef } from 'react';
import { GhostArt } from '@/components/ghost/GhostArt';
import { CheckIcon } from '@/components/ui/Icons';
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
  const haunts = state.slackingOffCount;

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
      className="report-modal"
      aria-labelledby="report-title"
      onCancel={(e) => {
        e.preventDefault();
        onDismiss();
      }}
    >
      {open && (
        <div className="report-body">
          <button type="button" className="modal-close-btn" onClick={onDismiss} aria-label="Close survival report">
            ×
          </button>

          <div className="report-ghost" role="img" aria-label="The ghost celebrating with a party hat">
            <GhostArt mood="celebrating" />
          </div>
          <h2 id="report-title" className="report-title">
            Survival Report
          </h2>

          <dl className="report-stats">
            <div className="stat-col">
              <dt className="stat-label">Focus Time</dt>
              <dd className="stat-value" data-testid="focus-time">
                {toHHMMSS(focus)}
              </dd>
            </div>
            <div className="stat-col">
              <dt className="stat-label">Haunted</dt>
              <dd className={`stat-value ${haunts > 0 ? 'haunts-bad' : 'haunts-zero'}`} data-testid="slack-count">
                {haunts}
              </dd>
            </div>
            <div className="stat-col">
              <dt className="stat-label">Tasks Cleared</dt>
              <dd className="stat-value">
                {completed.length}/{state.tasks.length}
              </dd>
            </div>
          </dl>

          <section className="report-tasks-wrap" aria-labelledby="report-tasks">
            <h3 id="report-tasks" className="report-tasks-heading">
              Completed this session
            </h3>
            {completed.length === 0 ? (
              <p className="report-empty">None this time. The ghost noticed.</p>
            ) : (
              <ul className="report-tasks-list">
                {completed.map((t) => (
                  <li key={t.id}>
                    <CheckIcon size={12} />
                    <span className="break-words">{t.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="report-quote" aria-live="polite">
            &ldquo;{state.currentRoast ?? fallback}&rdquo;
          </p>

          <button type="button" className="btn btn-primary" onClick={onDismiss} autoFocus>
            Start New Session
          </button>
        </div>
      )}
    </dialog>
  );
}
