import fc from 'fast-check';
import {
  STORAGE_KEY,
  isValidPersistedState,
  read,
  toPersisted,
  write,
} from '@/lib/session/localStorageSync';
import { sessionReducer } from '@/lib/session/sessionReducer';
import { T0, actionSeqArb, replay } from './arbitraries';

beforeEach(() => localStorage.clear());

describe('localStorageSync — properties', () => {
  // Feature: spooky-study-buddy, Property 4: session state persistence round trip
  it('P4: any reachable state survives write → read → restore', () => {
    fc.assert(
      fc.property(actionSeqArb, (actions) => {
        localStorage.clear();
        const s = replay(actions);
        const persisted = toPersisted(s);
        expect(isValidPersistedState(persisted)).toBe(true);

        expect(write(s)).toBe(true);
        const result = read();
        expect(result.status).toBe('ok');
        if (result.status !== 'ok') return;
        expect(result.data).toEqual(persisted);

        // Restoring at a moment that doesn't move the timer gives back the same persisted fields.
        const now = s.endsAt !== null ? s.endsAt - s.remainingSeconds * 1000 : T0;
        const restored = sessionReducer(s, { type: 'RESTORE_STATE', persisted: result.data, now });
        expect(toPersisted(restored)).toEqual(persisted);
      }),
      { numRuns: 200 },
    );
  });

  // Feature: spooky-study-buddy, Property 5: corrupted localStorage yields clean state
  it('P5: any invalid stored string is reported corrupt and removed', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.json(),
          fc.constant('{"version":1,"durationSeconds":60}'),
          actionSeqArb.map((a) => JSON.stringify({ ...toPersisted(replay(a)), version: 3 })),
          actionSeqArb.map((a) => JSON.stringify({ ...toPersisted(replay(a)), timerStatus: 'flying' })),
        ),
        (raw) => {
          let valid = false;
          try {
            valid = isValidPersistedState(JSON.parse(raw));
          } catch {
            valid = false;
          }
          fc.pre(!valid);
          localStorage.setItem(STORAGE_KEY, raw);
          expect(read()).toEqual({ status: 'corrupt' });
          expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('localStorageSync — examples', () => {
  it('reports empty when nothing is stored', () => {
    expect(read()).toEqual({ status: 'empty' });
  });

  it('returns false instead of throwing when storage is full', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    expect(write(replay([]))).toBe(false);
    spy.mockRestore();
  });

  it('rejects a running state without endsAt', () => {
    const p = { ...toPersisted(replay([])), timerStatus: 'running' as const, endsAt: null };
    expect(isValidPersistedState(p)).toBe(false);
  });
});
