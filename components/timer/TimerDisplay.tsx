'use client';

import { useSession } from '@/lib/session/SessionContext';
import { toMMSS } from '@/lib/utils/formatTime';

/** Oversized countdown + razor-thin progress rule (fill = time remaining). */
export function TimerDisplay() {
  const { state } = useSession();
  const { remainingSeconds, durationSeconds, timerStatus } = state;
  const remainingPct = durationSeconds > 0 ? Math.max(0, Math.min(100, (remainingSeconds / durationSeconds) * 100)) : 0;

  return (
    <section aria-labelledby="timer-heading" className="timer-block">
      <h2 id="timer-heading" className="sr-only">
        Timer
      </h2>
      <div role="timer" aria-live="off" aria-label={`${toMMSS(remainingSeconds)} remaining`} className="timer-readout">
        {toMMSS(remainingSeconds)}
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Time remaining"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(remainingPct)}
      >
        <div className="progress-fill" style={{ width: `${remainingPct}%` }} />
      </div>
      <p className="sr-only" aria-live="polite">
        {timerStatus === 'running' && 'Studying… the ghost is watching.'}
        {timerStatus === 'paused' && 'Paused.'}
      </p>
    </section>
  );
}
