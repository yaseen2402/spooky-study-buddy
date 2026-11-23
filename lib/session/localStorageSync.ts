import {
  MAX_DURATION_SECONDS,
  MAX_TASK_NAME_LENGTH,
  MIN_DURATION_SECONDS,
  type PersistedSessionState,
  type SessionState,
  type Task,
} from '@/lib/types';

export const STORAGE_KEY = 'ssb_session';

export type ReadResult =
  | { status: 'empty' }
  | { status: 'ok'; data: PersistedSessionState }
  | { status: 'corrupt' };

export function toPersisted(s: SessionState): PersistedSessionState {
  return {
    version: 2,
    durationSeconds: s.durationSeconds,
    remainingSeconds: s.remainingSeconds,
    timerStatus: s.timerStatus,
    endsAt: s.endsAt,
    sessionStartedAt: s.sessionStartedAt,
    sessionEndedAt: s.sessionEndedAt,
    sessionEnded: s.sessionEnded,
    tasks: s.tasks.map((t) => ({ ...t })),
    slackingOffCount: s.slackingOffCount,
    totalSlackSeconds: s.totalSlackSeconds,
    muted: s.muted,
    notes: s.notes,
  };
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isNonNegInt = (v: unknown): v is number => isNum(v) && Number.isInteger(v) && v >= 0;
const isNullableNum = (v: unknown): v is number | null => v === null || isNum(v);

function isValidTask(v: unknown): v is Task {
  if (!isObj(v)) return false;
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.name === 'string' &&
    v.name.trim().length > 0 &&
    v.name.length <= MAX_TASK_NAME_LENGTH &&
    typeof v.completed === 'boolean' &&
    isNum(v.createdAt) &&
    isNullableNum(v.completedAt) &&
    (v.completed ? v.completedAt !== null : v.completedAt === null)
  );
}

export function isValidPersistedState(v: unknown): v is PersistedSessionState {
  if (!isObj(v)) return false;
  if (v.version !== 2) return false;
  if (!isNonNegInt(v.durationSeconds)) return false;
  if (v.durationSeconds < MIN_DURATION_SECONDS || v.durationSeconds > MAX_DURATION_SECONDS) return false;
  if (!isNonNegInt(v.remainingSeconds) || v.remainingSeconds > v.durationSeconds) return false;
  if (v.timerStatus !== 'stopped' && v.timerStatus !== 'running' && v.timerStatus !== 'paused') return false;
  if (!isNullableNum(v.endsAt)) return false;
  if ((v.timerStatus === 'running') !== (v.endsAt !== null)) return false;
  if (!isNullableNum(v.sessionStartedAt) || !isNullableNum(v.sessionEndedAt)) return false;
  if (typeof v.sessionEnded !== 'boolean') return false;
  if (v.sessionEnded && v.timerStatus !== 'stopped') return false;
  if (!Array.isArray(v.tasks) || !v.tasks.every(isValidTask)) return false;
  if (new Set(v.tasks.map((t) => (t as Task).id)).size !== v.tasks.length) return false;
  if (!isNonNegInt(v.slackingOffCount) || !isNonNegInt(v.totalSlackSeconds)) return false;
  if (typeof v.muted !== 'boolean') return false;
  if (typeof v.notes !== 'string' && v.notes !== undefined) return false;
  return true;
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function read(): ReadResult {
  const ls = storage();
  if (!ls) return { status: 'empty' };
  let raw: string | null;
  try {
    raw = ls.getItem(STORAGE_KEY);
  } catch {
    return { status: 'empty' };
  }
  if (raw === null) return { status: 'empty' };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isValidPersistedState(parsed)) return { status: 'ok', data: parsed };
  } catch {
    // fall through
  }
  try {
    ls.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return { status: 'corrupt' };
}

/** Returns false if the write failed (quota, private mode, storage disabled). */
export function write(s: SessionState): boolean {
  const ls = storage();
  if (!ls) return false;
  try {
    ls.setItem(STORAGE_KEY, JSON.stringify(toPersisted(s)));
    return true;
  } catch {
    return false;
  }
}
