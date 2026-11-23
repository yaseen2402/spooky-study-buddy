import fc from 'fast-check';
import { initialState, sessionReducer } from '@/lib/session/sessionReducer';
import type { SessionAction, SessionState, Task } from '@/lib/types';

export const T0 = 1_700_000_000_000;

export const durationArb = fc.integer({ min: 1, max: 120 }).map((m) => m * 60);

export const taskArb: fc.Arbitrary<Task> = fc
  .record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0).map((s) => s.trim()),
    completed: fc.boolean(),
    createdAt: fc.integer({ min: T0 - 1e9, max: T0 }),
  })
  .map((t) => ({ ...t, completedAt: t.completed ? t.createdAt + 1 : null }));

export const taskListArb = fc.uniqueArray(taskArb, { selector: (t) => t.id, maxLength: 8 });

export function runningState(durationSeconds: number, tasks: Task[] = []): SessionState {
  let s = sessionReducer({ ...initialState, tasks }, { type: 'SET_DURATION', minutes: durationSeconds / 60 });
  s = sessionReducer(s, { type: 'START_TIMER', now: T0 });
  return s;
}

/** Random action sequences exercising the whole reducer surface, with monotonically increasing time. */
export const actionSeqArb: fc.Arbitrary<SessionAction[]> = fc
  .array(
    fc.tuple(
      fc.integer({ min: 0, max: 120_000 }),
      fc.constantFrom(
        'START',
        'PAUSE',
        'RESUME',
        'TICK',
        'SLACK_START',
        'SLACK_END',
        'ADD',
        'TOGGLE',
        'FINISH',
        'RESET',
      ),
      fc.string({ maxLength: 10 }),
    ),
    { maxLength: 40 },
  )
  .map((steps) => {
    let now = T0;
    const actions: SessionAction[] = [{ type: 'SET_DURATION', minutes: 5 }];
    steps.forEach(([dt, kind, text], i) => {
      now += dt;
      switch (kind) {
        case 'START': actions.push({ type: 'START_TIMER', now }); break;
        case 'PAUSE': actions.push({ type: 'PAUSE_TIMER', now }); break;
        case 'RESUME': actions.push({ type: 'RESUME_TIMER', now }); break;
        case 'TICK': actions.push({ type: 'TICK', now }); break;
        case 'SLACK_START': actions.push({ type: 'SLACK_START', source: i % 2 ? 'idle' : 'visibility', now }); break;
        case 'SLACK_END': actions.push({ type: 'SLACK_END', now, jumpscare: true }); break;
        case 'ADD': actions.push({ type: 'ADD_TASK', id: `t${i}`, name: text || 'task', now }); break;
        case 'TOGGLE': actions.push({ type: 'TOGGLE_TASK', id: `t${Math.max(0, i - 1)}`, now }); break;
        case 'FINISH': actions.push({ type: 'FINISH_SESSION', now }); break;
        case 'RESET': actions.push({ type: 'RESET_TIMER' }); break;
      }
    });
    return actions;
  });

export const replay = (actions: SessionAction[], from: SessionState = initialState) =>
  actions.reduce(sessionReducer, from);
