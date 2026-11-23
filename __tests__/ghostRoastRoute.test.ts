/**
 * @jest-environment node
 */
import fc from 'fast-check';
import { CONGRATULATIONS, TAUNTS } from '@/lib/roast/fallbackRoasts';

const ORIGINAL_KEY = process.env.ANTHROPIC_API_KEY;

async function loadRoute() {
  let mod: typeof import('@/app/api/ghost-roast/route') | undefined;
  jest.isolateModules(() => {
    mod = require('@/app/api/ghost-roast/route');
  });
  return mod!;
}

let ipCounter = 0;
const post = (body: unknown, ip = `10.0.0.${++ipCounter % 250}-${ipCounter}`) =>
  new Request('http://localhost/api/ghost-roast', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});
afterAll(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
});

const validBodyArb = fc.record({
  taskName: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim() !== ''),
  slackingDuration: fc.double({ min: 0, max: 1e6, noNaN: true }),
  mode: fc.constantFrom('roast' as const, 'congratulate' as const),
});

const invalidBodyArb = fc.oneof(
  validBodyArb.map((b) => ({ ...b, taskName: '' })),
  validBodyArb.map((b) => ({ ...b, taskName: '   ' })),
  validBodyArb.map((b) => ({ ...b, taskName: 'x'.repeat(201) })),
  validBodyArb.map((b) => ({ ...b, taskName: 42 })),
  validBodyArb.map(({ taskName: _omit, ...rest }) => rest),
  fc.tuple(validBodyArb, fc.double({ max: -Number.MIN_VALUE, noNaN: true })).map(([b, d]) => ({ ...b, slackingDuration: d })),
  validBodyArb.map((b) => ({ ...b, slackingDuration: '10' })),
  validBodyArb.map((b) => ({ ...b, mode: 'tickle' })),
  fc.constant(null),
  fc.constant([1, 2, 3]),
);

describe('/api/ghost-roast', () => {
  // Feature: spooky-study-buddy, Property 9: ghost roast API validates request body
  it('P9: rejects invalid bodies with 400 and an error message', async () => {
    const { POST } = await loadRoute();
    await fc.assert(
      fc.asyncProperty(invalidBodyArb, async (body) => {
        const res = await POST(post(body));
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(typeof data.error).toBe('string');
        expect(data.error.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: spooky-study-buddy, Property 10: ghost roast API accepts valid request bodies
  it('P10: accepts valid bodies and returns a fallback line for the mode when no key is set', async () => {
    const { POST } = await loadRoute();
    await fc.assert(
      fc.asyncProperty(validBodyArb, async (body) => {
        const res = await POST(post(body));
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.source).toBe('fallback');
        expect(body.mode === 'roast' ? TAUNTS : CONGRATULATIONS).toContain(data.message);
      }),
      { numRuns: 100 },
    );
  });

  it('returns 400 for malformed JSON', async () => {
    const { POST } = await loadRoute();
    const res = await POST(post('{not json'));
    expect(res.status).toBe(400);
  });

  it('rate-limits a single client to 10 requests per minute', async () => {
    const { POST } = await loadRoute();
    const body = { taskName: 'Math', slackingDuration: 5, mode: 'roast' };
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push((await POST(post(body, '1.2.3.4'))).status);
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});
