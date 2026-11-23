export type TimerStatus = 'stopped' | 'running' | 'paused';
export type GhostState = 'idle' | 'calm' | 'tense' | 'haunting' | 'jumpscare' | 'celebratory';
export type SlackSource = 'visibility' | 'idle';
export type RoastMode = 'roast' | 'congratulate';

/** Feynman-mode AI request (separate from roast so it carries the student's explanation text). */
export interface FeynmanRequest {
  topicName: string;
  explanation: string;
}

export interface FeynmanResponse {
  feedback: string;
  /** Highlights: what was clear in the explanation. */
  clear: string;
  /** Gaps: what was missing or could be clearer. */
  missing: string;
  /** A one-sentence simplification prompt. */
  simplifyPrompt: string;
  source: 'ai' | 'fallback';
}

export interface FeynmanError {
  error: string;
}

export const MIN_DURATION_SECONDS = 60;
export const MAX_DURATION_SECONDS = 7200;
export const DEFAULT_DURATION_SECONDS = 25 * 60;
export const MAX_TASK_NAME_LENGTH = 200;
export const JUMPSCARE_MS = 1200;

export interface Task {
  id: string;
  name: string;
  completed: boolean;
  createdAt: number;
  completedAt: number | null;
}

export interface SessionState {
  // Timer
  durationSeconds: number;
  remainingSeconds: number;
  timerStatus: TimerStatus;
  endsAt: number | null;
  sessionStartedAt: number | null;
  sessionEndedAt: number | null;
  sessionEnded: boolean;

  // Tasks
  tasks: Task[];

  // Slacking
  hauntMode: boolean;
  slackSource: SlackSource | null;
  slackStartedAt: number | null;
  slackingOffCount: number;
  totalSlackSeconds: number;

  // Ghost / UI
  jumpscareUntil: number | null;
  currentRoast: string | null;
  muted: boolean;

  // Session Notes scratchpad (persisted per session key in localStorage separately)
  notes: string;
}

export interface PersistedSessionState {
  version: 2;
  durationSeconds: number;
  remainingSeconds: number;
  timerStatus: TimerStatus;
  endsAt: number | null;
  sessionStartedAt: number | null;
  sessionEndedAt: number | null;
  sessionEnded: boolean;
  tasks: Task[];
  slackingOffCount: number;
  totalSlackSeconds: number;
  muted: boolean;
  notes: string;
}

export type SessionAction =
  | { type: 'SET_DURATION'; minutes: number }
  | { type: 'START_TIMER'; now: number }
  | { type: 'PAUSE_TIMER'; now: number }
  | { type: 'RESUME_TIMER'; now: number }
  | { type: 'RESET_TIMER' }
  | { type: 'TICK'; now: number }
  | { type: 'FINISH_SESSION'; now: number }
  | { type: 'DISMISS_REPORT' }
  | { type: 'ADD_TASK'; id: string; name: string; now: number }
  | { type: 'TOGGLE_TASK'; id: string; now: number }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'SLACK_START'; source: SlackSource; now: number }
  | { type: 'SLACK_END'; now: number; jumpscare: boolean }
  | { type: 'CLEAR_JUMPSCARE' }
  | { type: 'SET_ROAST'; message: string | null }
  | { type: 'SET_MUTED'; muted: boolean }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'RESTORE_STATE'; persisted: PersistedSessionState; now: number };

export interface GhostRoastRequest {
  taskName: string;
  slackingDuration: number;
  mode: RoastMode;
}

export interface GhostRoastResponse {
  message: string;
  source: 'ai' | 'fallback';
}

export interface GhostRoastError {
  error: string;
}
