import {
  DEFAULT_DURATION_SECONDS,
  JUMPSCARE_MS,
  MAX_DURATION_SECONDS,
  MAX_TASK_NAME_LENGTH,
  MIN_DURATION_SECONDS,
  type SessionAction,
  type SessionState,
} from '@/lib/types';

export const initialState: SessionState = {
  durationSeconds: DEFAULT_DURATION_SECONDS,
  remainingSeconds: DEFAULT_DURATION_SECONDS,
  timerStatus: 'stopped',
  endsAt: null,
  sessionStartedAt: null,
  sessionEndedAt: null,
  sessionEnded: false,
  tasks: [],
  hauntMode: false,
  slackSource: null,
  slackStartedAt: null,
  slackingOffCount: 0,
  totalSlackSeconds: 0,
  jumpscareUntil: null,
  currentRoast: null,
  muted: false,
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Seconds left at `now` for a running timer; whole seconds, rounded up so "00:00" only shows at the end. */
export function remainingAt(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

/** Close an active slack, adding its duration. No-op if not haunting. */
function endSlack(state: SessionState, now: number): SessionState {
  if (!state.hauntMode || state.slackStartedAt === null) return state;
  const seconds = Math.max(0, Math.round((now - state.slackStartedAt) / 1000));
  return {
    ...state,
    hauntMode: false,
    slackSource: null,
    slackStartedAt: null,
    totalSlackSeconds: state.totalSlackSeconds + seconds,
  };
}

function finish(state: SessionState, now: number): SessionState {
  if (state.sessionEnded) return state;
  const remaining =
    state.timerStatus === 'running' && state.endsAt !== null
      ? remainingAt(state.endsAt, now)
      : state.remainingSeconds;
  // If the deadline passed while hidden, a slack in progress is only charged up to the deadline.
  const slackCutoff =
    state.timerStatus === 'running' && state.endsAt !== null ? Math.min(now, state.endsAt) : now;
  const closed = endSlack(state, slackCutoff);
  return {
    ...closed,
    remainingSeconds: remaining,
    timerStatus: 'stopped',
    endsAt: null,
    sessionEnded: true,
    sessionEndedAt: now,
    sessionStartedAt: closed.sessionStartedAt ?? now,
    jumpscareUntil: null,
    currentRoast: null,
  };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_DURATION': {
      if (state.timerStatus !== 'stopped' || state.sessionEnded) return state;
      const minutes = Number.isFinite(action.minutes) ? Math.round(action.minutes) : 25;
      const seconds = clamp(minutes * 60, MIN_DURATION_SECONDS, MAX_DURATION_SECONDS);
      return { ...state, durationSeconds: seconds, remainingSeconds: seconds };
    }

    case 'START_TIMER': {
      if (state.timerStatus !== 'stopped' || state.sessionEnded) return state;
      if (state.remainingSeconds <= 0) return state;
      return {
        ...state,
        timerStatus: 'running',
        endsAt: action.now + state.remainingSeconds * 1000,
        sessionStartedAt: state.sessionStartedAt ?? action.now,
      };
    }

    case 'PAUSE_TIMER': {
      if (state.timerStatus !== 'running' || state.endsAt === null) return state;
      const closed = endSlack(state, action.now);
      return {
        ...closed,
        timerStatus: 'paused',
        remainingSeconds: remainingAt(state.endsAt, action.now),
        endsAt: null,
      };
    }

    case 'RESUME_TIMER': {
      if (state.timerStatus !== 'paused') return state;
      return {
        ...state,
        timerStatus: 'running',
        endsAt: action.now + state.remainingSeconds * 1000,
      };
    }

    case 'RESET_TIMER': {
      if (state.sessionEnded) return state;
      return {
        ...state,
        timerStatus: 'stopped',
        remainingSeconds: state.durationSeconds,
        endsAt: null,
        sessionStartedAt: null,
        hauntMode: false,
        slackSource: null,
        slackStartedAt: null,
        slackingOffCount: 0,
        totalSlackSeconds: 0,
        jumpscareUntil: null,
        currentRoast: null,
      };
    }

    case 'TICK': {
      if (state.timerStatus !== 'running' || state.endsAt === null) return state;
      const remaining = remainingAt(state.endsAt, action.now);
      if (remaining <= 0) return finish(state, action.now);
      if (remaining === state.remainingSeconds) return state;
      return { ...state, remainingSeconds: remaining };
    }

    case 'FINISH_SESSION': {
      if (state.timerStatus === 'stopped' && state.sessionStartedAt === null) return state;
      return finish(state, action.now);
    }

    case 'DISMISS_REPORT': {
      if (!state.sessionEnded) return state;
      return {
        ...initialState,
        durationSeconds: state.durationSeconds,
        remainingSeconds: state.durationSeconds,
        muted: state.muted,
        tasks: state.tasks.filter((t) => !t.completed),
      };
    }

    case 'ADD_TASK': {
      const name = action.name.trim().slice(0, MAX_TASK_NAME_LENGTH);
      if (!name) return state;
      return {
        ...state,
        tasks: [
          ...state.tasks,
          { id: action.id, name, completed: false, createdAt: action.now, completedAt: null },
        ],
      };
    }

    case 'TOGGLE_TASK': {
      if (!state.tasks.some((t) => t.id === action.id)) return state;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? { ...t, completed: !t.completed, completedAt: t.completed ? null : action.now }
            : t,
        ),
      };
    }

    case 'DELETE_TASK': {
      const tasks = state.tasks.filter((t) => t.id !== action.id);
      return tasks.length === state.tasks.length ? state : { ...state, tasks };
    }

    case 'SLACK_START': {
      if (state.timerStatus !== 'running' || state.hauntMode) return state;
      return {
        ...state,
        hauntMode: true,
        slackSource: action.source,
        slackStartedAt: action.now,
        slackingOffCount: state.slackingOffCount + 1,
        currentRoast: null,
        jumpscareUntil: null,
      };
    }

    case 'SLACK_END': {
      if (!state.hauntMode) return state;
      const closed = endSlack(state, action.now);
      return { ...closed, jumpscareUntil: action.jumpscare ? action.now + JUMPSCARE_MS : null };
    }

    case 'CLEAR_JUMPSCARE':
      return state.jumpscareUntil === null ? state : { ...state, jumpscareUntil: null };

    case 'SET_ROAST':
      return state.currentRoast === action.message ? state : { ...state, currentRoast: action.message };

    case 'SET_MUTED':
      return state.muted === action.muted ? state : { ...state, muted: action.muted };

    case 'RESTORE_STATE': {
      const p = action.persisted;
      const restored: SessionState = {
        ...initialState,
        durationSeconds: p.durationSeconds,
        remainingSeconds: p.remainingSeconds,
        timerStatus: p.timerStatus,
        endsAt: p.endsAt,
        sessionStartedAt: p.sessionStartedAt,
        sessionEndedAt: p.sessionEndedAt,
        sessionEnded: p.sessionEnded,
        tasks: p.tasks,
        slackingOffCount: p.slackingOffCount,
        totalSlackSeconds: p.totalSlackSeconds,
        muted: p.muted,
      };
      // Bring a running timer up to date; finish it if the deadline passed while the page was closed.
      return sessionReducer(restored, { type: 'TICK', now: action.now });
    }

    default:
      return state;
  }
}
