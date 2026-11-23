import fc from 'fast-check';
import { nextVolume } from '@/lib/audio/volume';
import { IdleDetector } from '@/lib/detection/IdleDetector';
import { CONGRATULATIONS, TAUNTS, getFallback } from '@/lib/roast/fallbackRoasts';
import { fetchRoast } from '@/lib/roast/ghostRoastClient';
import { createRateLimiter } from '@/lib/roast/rateLimit';
import { toHHMMSS, toMMSS } from '@/lib/utils/formatTime';

describe('formatTime', () => {
  it.each([
    [0, '00:00'],
    [90, '01:30'],
    [7200, '120:00'],
  ])('toMMSS(%i) = %s', (s, out) => expect(toMMSS(s)).toBe(out));

  it.each([
    [0, '00:00:00'],
    [3661, '01:01:01'],
    [7199, '01:59:59'],
  ])('toHHMMSS(%i) = %s', (s, out) => expect(toHHMMSS(s)).toBe(out));

  it('handles bad input', () => {
    expect(toMMSS(-5)).toBe('00:00');
    expect(toHHMMSS(Number.NaN)).toBe('00:00:00');
  });
});

describe('audio volume', () => {
  // Feature: spooky-study-buddy, Property 11: audio volume escalation stays within bounds
  it('P11: escalation stays in [0, 1] and never decreases', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1, noNaN: true }), fc.nat({ max: 200 }), (start, steps) => {
        let v = start;
        for (let i = 0; i < steps; i++) {
          const next = nextVolume(v);
          expect(next).toBeGreaterThanOrEqual(0);
          expect(next).toBeLessThanOrEqual(1);
          expect(next).toBeGreaterThanOrEqual(Math.min(v, 1) - 0.05); // rounding to 0.1 never drops a full step
          v = next;
        }
      }),
      { numRuns: 200 },
    );
  });

  it('reaches 100% after 9 steps from 10%', () => {
    let v = 0.1;
    for (let i = 0; i < 9; i++) v = nextVolume(v);
    expect(v).toBe(1);
    expect(nextVolume(v)).toBe(1);
  });
});

describe('fallback roasts', () => {
  it('has enough non-empty lines in each list', () => {
    expect(TAUNTS.length).toBeGreaterThanOrEqual(10);
    expect(CONGRATULATIONS.length).toBeGreaterThanOrEqual(5);
    for (const line of [...TAUNTS, ...CONGRATULATIONS]) expect(line.trim()).not.toBe('');
  });

  it('picks from the list matching the mode', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 0.9999999, noNaN: true }), (r) => {
        expect(TAUNTS).toContain(getFallback('roast', () => r));
        expect(CONGRATULATIONS).toContain(getFallback('congratulate', () => r));
      }),
    );
  });
});

describe('rate limiter', () => {
  it('allows N per window then blocks until the window resets', () => {
    const allow = createRateLimiter(3, 1000);
    expect([allow('a', 0), allow('a', 1), allow('a', 2), allow('a', 3)]).toEqual([true, true, true, false]);
    expect(allow('b', 3)).toBe(true);
    expect(allow('a', 1000)).toBe(true);
  });
});

describe('ghostRoastClient', () => {
  const req = { taskName: 'Math', slackingDuration: 10, mode: 'roast' as const };
  afterEach(() => {
    (global as { fetch?: unknown }).fetch = undefined;
  });

  it.each([400, 429, 500])('returns null on HTTP %i', async (status) => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status, json: async () => ({ error: 'x' }) });
    await expect(fetchRoast(req)).resolves.toBeNull();
  });

  it('returns null on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('offline'));
    await expect(fetchRoast(req)).resolves.toBeNull();
  });

  it('returns the trimmed message on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ message: '  Boo!  ' }) });
    await expect(fetchRoast(req)).resolves.toBe('Boo!');
  });
});

describe('IdleDetector', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('fires idle after the threshold and active on the next input', () => {
    const onIdle = jest.fn();
    const onActive = jest.fn();
    const d = new IdleDetector(60_000, onIdle, onActive);
    d.start();
    jest.advanceTimersByTime(59_999);
    expect(onIdle).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onIdle).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('keydown'));
    expect(onActive).toHaveBeenCalledTimes(1);
    d.stop();
  });

  it('input resets the countdown', () => {
    const onIdle = jest.fn();
    const d = new IdleDetector(60_000, onIdle, jest.fn());
    d.start();
    jest.advanceTimersByTime(50_000);
    window.dispatchEvent(new Event('mousemove'));
    jest.advanceTimersByTime(50_000);
    expect(onIdle).not.toHaveBeenCalled();
    d.stop();
  });

  it('does not fire while suspended, and restarts the countdown on resume', () => {
    const onIdle = jest.fn();
    const d = new IdleDetector(60_000, onIdle, jest.fn());
    d.start();
    d.suspend();
    jest.advanceTimersByTime(120_000);
    expect(onIdle).not.toHaveBeenCalled();
    d.resume();
    jest.advanceTimersByTime(60_000);
    expect(onIdle).toHaveBeenCalledTimes(1);
    d.stop();
  });
});
