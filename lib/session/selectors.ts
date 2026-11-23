import type { GhostState, SessionState, Task } from '@/lib/types';

export const elapsedSeconds = (s: SessionState): number =>
  Math.max(0, s.durationSeconds - s.remainingSeconds);

export const focusSeconds = (s: SessionState): number =>
  Math.max(0, elapsedSeconds(s) - s.totalSlackSeconds);

export const completedThisSession = (s: SessionState): Task[] =>
  s.tasks.filter(
    (t) => t.completed && t.completedAt !== null && t.completedAt >= (s.sessionStartedAt ?? 0),
  );

export const currentTaskName = (s: SessionState): string =>
  s.tasks.find((t) => !t.completed)?.name ?? 'your studies';

export const isSessionActive = (s: SessionState): boolean =>
  s.timerStatus !== 'stopped' && !s.sessionEnded;

export function ghostStateOf(s: SessionState, now: number): GhostState {
  if (s.sessionEnded) return 'celebratory';
  if (s.hauntMode) return 'haunting';
  if (s.jumpscareUntil !== null && s.jumpscareUntil > now) return 'jumpscare';
  if (s.timerStatus === 'running') {
    // Last 5 minutes of a session: ghost gets tense
    return s.remainingSeconds <= 300 && s.durationSeconds > 300 ? 'tense' : 'calm';
  }
  return 'idle';
}
