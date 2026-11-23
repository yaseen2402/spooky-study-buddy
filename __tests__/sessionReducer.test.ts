import fc from 'fast-check';
import { elapsedSeconds, focusSeconds } from '@/lib/session/selectors';
import { initialState, sessionReducer } from '@/lib/session/sessionReducer';
import type { SessionState } from '@/lib/types';
import { T0, actionSeqArb, durationArb, replay, runningState, taskListArb } from './arbitraries';

const NUM_RUNS = { numRuns: 200 };

describe('sessionReducer — properties', () => {
  // Feature: spooky-study-buddy, Property 1: timer remaining time follows wall-clock time
  it('P1: remaining follows wall-clock time regardless of intermediate ticks', () => {
    fc.assert(
      fc.property(
        durationArb,
        fc.array(fc.integer({ min: 0, max: 600_000 }), { maxLength: 20 }),
        (duration, gaps) => {
          let s = runningState(duration);
          let now = T0;
          for (const g of gaps) {
            now += g;
            s = sessionReducer(s, { type: 'TICK', now });
          }
          const expected = Math.max(0, Math.ceil(duration - (now - T0) / 1000));
          expect(s.remainingSeconds).toBe(expected);
          if (expected === 0) {
            expect(s.sessionEnded).toBe(true);
            expect(s.timerStatus).toBe('stopped');
          }
        },
      ),
      NUM_RUNS,
    );
  });

  // Feature: spooky-study-buddy, Property 2: pause then resume is a time-preserving round trip
  it('P2: pause then resume preserves remaining time', () => {
    fc.assert(
      fc.property(durationArb, fc.integer({ min: 0, max: 50_000 }), fc.integer({ min: 0, max: 1e7 }), (d, t1off, gap) => {
        const t1 = T0 + t1off;
        const t2 = t1 + gap;
        const paused = sessionReducer(runningState(d), { type: 'PAUSE_TIMER', now: t1 });
        const resumed = sessionReducer(paused, { type: 'RESUME_TIMER', now: t2 });
        expect(resumed.remainingSeconds).toBe(paused.remainingSeconds);
        expect(resumed.endsAt).toBe(t2 + paused.remainingSeconds * 1000);
        expect(resumed.timerStatus).toBe('running');
      }),
      NUM_RUNS,
    );
  });

  // Feature: spooky-study-buddy, Property 3: reset returns timer to initial duration
  it('P3: reset returns to the configured duration from any reachable state', () => {
    fc.assert(
      fc.property(actionSeqArb, (actions) => {
        const s = replay(actions);
        if (s.sessionEnded) return; // reset is disabled while the report is open
        const r = sessionReducer(s, { type: 'RESET_TIMER' });
        expect(r.remainingSeconds).toBe(r.durationSeconds);
        expect(r.timerStatus).toBe('stopped');
        expect(r.endsAt).toBeNull();
      }),
      NUM_RUNS,
    );
  });

  // Feature: spooky-study-buddy, Property 6: task addition grows the list
  it('P6: adding a non-blank task grows the list by one with the trimmed name', () => {
    fc.assert(
      fc.property(taskListArb, fc.string({ minLength: 1, maxLength: 300 }).filter((s) => s.trim() !== ''), (tasks, name) => {
        const s = sessionReducer({ ...initialState, tasks }, { type: 'ADD_TASK', id: 'new-id', name, now: T0 });
        expect(s.tasks).toHaveLength(tasks.length + 1);
        expect(s.tasks.at(-1)!.name).toBe(name.trim().slice(0, 200));
      }),
      NUM_RUNS,
    );
  });

  // Feature: spooky-study-buddy, Property 7: whitespace-only task names are rejected
  it('P7: whitespace-only names leave state unchanged', () => {
    fc.assert(
      fc.property(taskListArb, fc.string({ unit: fc.constantFrom(' ', '\t', '\n', '\r') }), (tasks, name) => {
        const before = { ...initialState, tasks };
        expect(sessionReducer(before, { type: 'ADD_TASK', id: 'x', name, now: T0 })).toBe(before);
      }),
      NUM_RUNS,
    );
  });

  // Feature: spooky-study-buddy, Property 8: task deletion removes exactly one task
  it('P8: deleting a task by id removes exactly that task', () => {
    fc.assert(
      fc.property(
        taskListArb.filter((t) => t.length > 0),
        fc.nat(),
        (tasks, idx) => {
          const target = tasks[idx % tasks.length];
          const s = sessionReducer({ ...initialState, tasks }, { type: 'DELETE_TASK', id: target.id });
          expect(s.tasks).toHaveLength(tasks.length - 1);
          expect(s.tasks.some((t) => t.id === target.id)).toBe(false);
        },
      ),
      NUM_RUNS,
    );
  });

  // Feature: spooky-study-buddy, Property 12: slacking-off count increments once per started event
  it('P12: count never decreases and rises once per accepted SLACK_START', () => {
    fc.assert(
      fc.property(actionSeqArb, (actions) => {
        let s: SessionState = initialState;
        for (const a of actions) {
          const prev = s;
          s = sessionReducer(s, a);
          if (a.type === 'RESET_TIMER' || a.type === 'DISMISS_REPORT') continue; // explicit resets
          expect(s.slackingOffCount).toBeGreaterThanOrEqual(prev.slackingOffCount);
          const accepted = a.type === 'SLACK_START' && prev.timerStatus === 'running' && !prev.hauntMode;
          expect(s.slackingOffCount - prev.slackingOffCount).toBe(accepted ? 1 : 0);
        }
      }),
      NUM_RUNS,
    );
  });

  // Feature: spooky-study-buddy, Property 13: focus duration is bounded
  it('P13: 0 ≤ focus ≤ elapsed ≤ duration in every reachable state', () => {
    fc.assert(
      fc.property(actionSeqArb, (actions) => {
        const s = replay(actions);
        expect(focusSeconds(s)).toBeGreaterThanOrEqual(0);
        expect(focusSeconds(s)).toBeLessThanOrEqual(elapsedSeconds(s));
        expect(elapsedSeconds(s)).toBeLessThanOrEqual(s.durationSeconds);
      }),
      NUM_RUNS,
    );
  });

  // Feature: spooky-study-buddy, Property 15: slacking is never recorded while the timer is not running
  it('P15: SLACK_START is ignored unless running', () => {
    fc.assert(
      fc.property(actionSeqArb, fc.constantFrom('idle' as const, 'visibility' as const), (actions, source) => {
        const s = replay(actions);
        if (s.timerStatus === 'running') return;
        expect(sessionReducer(s, { type: 'SLACK_START', source, now: T0 + 1e9 })).toBe(s);
      }),
      NUM_RUNS,
    );
  });
});

describe('sessionReducer — examples', () => {
  it('finishes exactly when the deadline passes', () => {
    const s = runningState(60);
    expect(sessionReducer(s, { type: 'TICK', now: T0 + 59_001 }).remainingSeconds).toBe(1);
    const done = sessionReducer(s, { type: 'TICK', now: T0 + 60_000 });
    expect(done.sessionEnded).toBe(true);
    expect(done.remainingSeconds).toBe(0);
  });

  it('counts a slack at its start and adds its duration on end', () => {
    let s = runningState(600);
    s = sessionReducer(s, { type: 'SLACK_START', source: 'visibility', now: T0 + 10_000 });
    expect(s.slackingOffCount).toBe(1);
    expect(s.hauntMode).toBe(true);
    s = sessionReducer(s, { type: 'SLACK_START', source: 'idle', now: T0 + 12_000 });
    expect(s.slackingOffCount).toBe(1);
    s = sessionReducer(s, { type: 'SLACK_END', now: T0 + 40_000, jumpscare: true });
    expect(s.hauntMode).toBe(false);
    expect(s.totalSlackSeconds).toBe(30);
    expect(s.jumpscareUntil).toBe(T0 + 40_000 + 1200);
  });

  it('only charges slack time up to the deadline when the timer expires mid-slack', () => {
    let s = runningState(60);
    s = sessionReducer(s, { type: 'SLACK_START', source: 'visibility', now: T0 + 20_000 });
    s = sessionReducer(s, { type: 'TICK', now: T0 + 500_000 });
    expect(s.sessionEnded).toBe(true);
    expect(s.totalSlackSeconds).toBe(40);
    expect(focusSeconds(s)).toBe(20);
  });

  it('dismissing the report keeps incomplete tasks and drops completed ones', () => {
    let s = sessionReducer(initialState, { type: 'ADD_TASK', id: 'a', name: 'A', now: T0 });
    s = sessionReducer(s, { type: 'ADD_TASK', id: 'b', name: 'B', now: T0 });
    s = sessionReducer(s, { type: 'START_TIMER', now: T0 });
    s = sessionReducer(s, { type: 'TOGGLE_TASK', id: 'a', now: T0 + 1000 });
    s = sessionReducer(s, { type: 'FINISH_SESSION', now: T0 + 2000 });
    s = sessionReducer(s, { type: 'DISMISS_REPORT' });
    expect(s.tasks.map((t) => t.id)).toEqual(['b']);
    expect(s.sessionEnded).toBe(false);
    expect(s.remainingSeconds).toBe(s.durationSeconds);
    expect(s.slackingOffCount).toBe(0);
  });

  it('un-completing a task clears completedAt', () => {
    let s = sessionReducer(initialState, { type: 'ADD_TASK', id: 'a', name: 'A', now: T0 });
    s = sessionReducer(s, { type: 'TOGGLE_TASK', id: 'a', now: T0 + 1 });
    expect(s.tasks[0].completedAt).toBe(T0 + 1);
    s = sessionReducer(s, { type: 'TOGGLE_TASK', id: 'a', now: T0 + 2 });
    expect(s.tasks[0]).toMatchObject({ completed: false, completedAt: null });
  });

  it('clamps duration to 1–120 minutes and ignores it while running', () => {
    expect(sessionReducer(initialState, { type: 'SET_DURATION', minutes: 0 }).durationSeconds).toBe(60);
    expect(sessionReducer(initialState, { type: 'SET_DURATION', minutes: 500 }).durationSeconds).toBe(7200);
    const running = runningState(600);
    expect(sessionReducer(running, { type: 'SET_DURATION', minutes: 5 })).toBe(running);
  });
});
