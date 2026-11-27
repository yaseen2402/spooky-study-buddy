'use client';

import { useSession } from '@/lib/session/SessionContext';
import { DurationPicker } from './DurationPicker';

interface Props {
  /** Runs inside the click handler (user gesture) before starting/resuming: unlocks audio, asks for notifications. */
  onUserGesture: () => void;
  haunted: boolean;
}

/** Controls adapt to the session state: idle → presets + start; running → pause/reset/end; haunted → apologise. */
export function StageControls({ onUserGesture, haunted }: Props) {
  const { state, dispatch } = useSession();
  const { timerStatus, sessionEnded } = state;

  const start = () => {
    onUserGesture();
    dispatch({ type: timerStatus === 'paused' ? 'RESUME_TIMER' : 'START_TIMER', now: Date.now() });
  };
  const end = () => dispatch({ type: 'FINISH_SESSION', now: Date.now() });

  if (timerStatus === 'stopped') {
    return (
      <div className="stage-controls">
        {!sessionEnded && <DurationPicker />}
        <button type="button" className="btn btn-primary" onClick={start} disabled={sessionEnded} aria-label="Start study session">
          Start Session
        </button>
      </div>
    );
  }

  if (haunted) {
    // Any click counts as activity, which ends an idle haunt; the button gives it a clear target.
    return (
      <div className="stage-controls">
        <div className="action-row">
          <button type="button" className="btn btn-haunt-clear">
            I&rsquo;m back, sorry
          </button>
          <button type="button" className="btn btn-ghost" onClick={end} aria-label="End session now and see your Survival Report">
            End Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stage-controls">
      <div className="action-row">
        {timerStatus === 'running' ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => dispatch({ type: 'PAUSE_TIMER', now: Date.now() })}
            aria-label="Pause timer"
          >
            Pause
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={start} aria-label="Resume timer">
            Resume
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => dispatch({ type: 'RESET_TIMER' })}
          aria-label="Reset timer and abandon this session"
        >
          Reset
        </button>
        <button type="button" className="btn btn-ghost" onClick={end} aria-label="End session now and see your Survival Report">
          End Session
        </button>
      </div>
    </div>
  );
}
