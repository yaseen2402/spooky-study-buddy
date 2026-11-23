'use client';

import { useSession } from '@/lib/session/SessionContext';
import { toMMSS } from '@/lib/utils/formatTime';

const btn =
  'rounded-lg px-4 py-2 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecto-400 disabled:cursor-not-allowed disabled:opacity-50';
const primary = `${btn} bg-ecto-400 text-crypt-950 hover:bg-ecto-300`;
const secondary = `${btn} border border-crypt-600 bg-crypt-800 text-bone hover:bg-crypt-700`;
const danger = `${btn} border border-blood-500/60 bg-crypt-800 text-blood-400 hover:bg-blood-700/30`;

interface Props {
  /** Runs inside the click handler (user gesture) before starting/resuming: unlocks audio, asks for notifications. */
  onUserGesture: () => void;
}

export function TimerDisplay({ onUserGesture }: Props) {
  const { state, dispatch } = useSession();
  const { timerStatus, remainingSeconds, durationSeconds, sessionEnded } = state;
  const progress = durationSeconds > 0 ? 1 - remainingSeconds / durationSeconds : 0;

  const start = () => {
    onUserGesture();
    dispatch({ type: timerStatus === 'paused' ? 'RESUME_TIMER' : 'START_TIMER', now: Date.now() });
  };

  return (
    <section aria-labelledby="timer-heading" className="flex w-full flex-col items-center gap-4">
      <h2 id="timer-heading" className="sr-only">
        Timer
      </h2>
      <div
        role="timer"
        aria-live="off"
        aria-label={`${toMMSS(remainingSeconds)} remaining`}
        className="font-mono text-7xl font-bold tabular-nums tracking-tight text-bone sm:text-8xl"
      >
        {toMMSS(remainingSeconds)}
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-crypt-800"
        role="progressbar"
        aria-label="Session progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-ecto-500 to-pumpkin-400 transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <p className="text-sm text-bone/80" aria-live="polite">
        {timerStatus === 'running' && 'Studying… the ghost is watching.'}
        {timerStatus === 'paused' && 'Paused. The ghost is waiting patiently. For now.'}
        {timerStatus === 'stopped' && !sessionEnded && 'Set a length, add a task, and begin.'}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {timerStatus === 'stopped' && (
          <button type="button" className={primary} onClick={start} disabled={sessionEnded} aria-label="Start study session">
            Start
          </button>
        )}
        {timerStatus === 'running' && (
          <button
            type="button"
            className={secondary}
            onClick={() => dispatch({ type: 'PAUSE_TIMER', now: Date.now() })}
            aria-label="Pause timer"
          >
            Pause
          </button>
        )}
        {timerStatus === 'paused' && (
          <button type="button" className={primary} onClick={start} aria-label="Resume timer">
            Resume
          </button>
        )}
        {timerStatus !== 'stopped' && (
          <>
            <button
              type="button"
              className={secondary}
              onClick={() => dispatch({ type: 'RESET_TIMER' })}
              aria-label="Reset timer and abandon this session"
            >
              Reset
            </button>
            <button
              type="button"
              className={danger}
              onClick={() => dispatch({ type: 'FINISH_SESSION', now: Date.now() })}
              aria-label="End session now and see your Survival Report"
            >
              End session
            </button>
          </>
        )}
      </div>
    </section>
  );
}
