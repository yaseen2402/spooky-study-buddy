# Design Document

## Overview

Spooky Study Buddy is a single-page productivity application built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. Its purpose is to keep students focused during study sessions by coupling a Pomodoro-style timer with escalating Halloween-horror consequences for procrastination.

The application runs entirely in the browser. There is no server-side user state; all session data persists in `localStorage`. The only server-side code is the `/api/ghost-roast` Next.js route handler, which calls the Anthropic Claude API (`@anthropic-ai/sdk`, model `claude-opus-5-5`) to generate spooky taunts. When no `ANTHROPIC_API_KEY` is configured, the route returns a line from a locally bundled fallback set.

### Key design principles

- **Client-first**: every interactive subsystem (timer, detection, audio, notifications) lives in `'use client'` components or plain TypeScript modules imported by them. Server Components render only the static shell; the API route is the only server logic.
- **Single source of truth**: all mutable session state lives in one React context (`SessionContext`). Subsystems read from and dispatch actions to that context. `localStorage` is a mirror, written within 500 ms of any state change.
- **Wall-clock time, not tick counts**: browsers throttle timers in hidden tabs (Chrome may run them only once a minute after ~5 min hidden). The timer stores an `endsAt` timestamp and derives `remainingSeconds` from `Date.now()`, so throttling never causes drift and a refresh restores time exactly.
- **Design for the hidden tab**: during a tab-switch slack the user cannot see the page. The channels that reach them are the tab title, the favicon, audio, and desktop notifications, so those are treated as primary; on-page effects (tint, glitch, speech bubble) matter mainly for idle slacks and on return.
- **User-gesture gating**: audio and notification permission are both initialised inside the Start-button click handler, because browsers block autoplay and suppress permission prompts that lack a user gesture.
- **Graceful degradation**: the Audio Engine, Notification Service, and AI route each have defined fallback paths so a capability gap never crashes the app.
- **Accessibility by default**: reduced-motion, keyboard navigation, and colour-contrast requirements are addressed at the component level, not retrofitted.

---

## Architecture

### High-level component tree

```
app/
├── layout.tsx                  (Server Component — HTML shell, fonts, global CSS)
├── page.tsx                    (Server Component — renders <SessionProvider><StudyBuddyApp/></SessionProvider>)
├── globals.css                 (Tailwind layers + haunt/ghost keyframes + reduced-motion rules)
└── api/ghost-roast/route.ts    (POST handler — validates body, rate-limits, calls Claude, returns roast)

components/
├── StudyBuddyApp.tsx           ('use client' — root client boundary, composes panels, owns side-effect hooks)
├── timer/
│   ├── TimerDisplay.tsx        (MM:SS readout; Start / Pause / Resume / Reset / End Session controls)
│   └── DurationPicker.tsx      (1–120 min slider + number input, only visible while stopped)
├── tasks/
│   ├── TaskList.tsx            (ordered list of TaskItem)
│   ├── TaskItem.tsx            (checkbox, label, delete)
│   └── TaskInput.tsx           (new-task form with inline validation)
├── ghost/
│   ├── GhostCompanion.tsx      (inline SVG ghost; CSS animation class per GhostState)
│   └── RoastBubble.tsx         (speech bubble over the ghost)
├── haunt/
│   ├── HauntOverlay.tsx        (red-tint overlay + CSS glitch, ≤ 3 Hz)
│   └── JumpscareFlash.tsx      (brief full-screen flash on tab return)
├── report/
│   └── SurvivalReport.tsx      (modal: focus time, completed tasks, slack count, roast)
└── ui/
    ├── MuteToggle.tsx
    ├── ReduceMotionToggle.tsx  (manual override in addition to the OS preference)
    └── Toast.tsx               (non-blocking warnings, e.g. corrupt storage)

lib/
├── types.ts                    (all shared types — see Data Models)
├── session/
│   ├── SessionContext.tsx      (React context + useReducer; hydration gate; debounced persistence)
│   ├── sessionReducer.ts       (pure reducer, all state transitions)
│   ├── selectors.ts            (pure derived values: focusSeconds, completedThisSession, currentTaskName)
│   └── localStorageSync.ts     (read/write helpers, schema validation, corruption recovery)
├── detection/
│   ├── VisibilityMonitor.ts    (Page Visibility API wrapper)
│   └── IdleDetector.ts         (input-inactivity tracker, 60 s threshold, suspend/resume)
├── audio/
│   ├── AudioEngine.ts          (Web Audio synthesised drone + heartbeat, gain scheduling)
│   └── volume.ts               (pure escalation math)
├── notifications/
│   └── NotificationService.ts  (Web Notifications wrapper; gesture-gated permission; click-to-focus)
├── roast/
│   ├── ghostRoastClient.ts     (fetch wrapper for /api/ghost-roast)
│   ├── fallbackRoasts.ts       (separate taunt / congratulation lists, mode-aware picker)
│   ├── validateRoastRequest.ts (pure request validation, shared by route + tests)
│   └── rateLimit.ts            (in-memory per-IP fixed-window limiter)
└── utils/
    ├── formatTime.ts           (seconds → MM:SS, seconds → HH:MM:SS)
    └── tabEffects.ts           (title flashing, favicon swap)
```

### Data flow

```
User interaction ──► component dispatches action (with `now: Date.now()` where time matters)
                          │
                          ▼
              sessionReducer (pure; no Date.now() inside)
                          │
            ┌─────────────┴──────────────┐
            ▼                            ▼
  context consumers re-render    debounced (300 ms) localStorageSync.write

Side-effect hooks in StudyBuddyApp (all gated on timerStatus === 'running'):
  VisibilityMonitor ──► SLACK_START{source:'visibility'} / SLACK_END ; suspends IdleDetector while hidden
  IdleDetector      ──► SLACK_START{source:'idle'} / SLACK_END
  1 s ticker        ──► TICK{now}  (reducer derives remaining from endsAt; FINISH when ≤ 0)
  hauntMode effect  ──► AudioEngine.start/stop, tabEffects, NotificationService.notify(taunt)
  10 s slack timer  ──► fetchRoast ► SET_ROAST ► (if hidden) notify(roast, same tag)
  sessionEnded      ──► fetchRoast{mode:'congratulate'} ► SET_ROAST
```

---

## Components and Interfaces

### SessionContext

Provides `state`, `dispatch`, `hydrated: boolean`, and `storageWarning: string | null`.

- Initial render (server and first client render) uses `initialState` and `hydrated = false`; `StudyBuddyApp` renders a placeholder until hydrated, so server and client markup match.
- A mount effect calls `localStorageSync.read()`. `{ status: 'ok', data }` → dispatch `RESTORE_STATE`; `{ status: 'corrupt' }` → set `storageWarning`; `{ status: 'empty' }` → nothing. Then `hydrated = true`.
- After hydration, an effect writes `state` with a 300 ms debounce (meets the 500 ms requirement). A `beforeunload` / `pagehide` listener flushes the pending write immediately.

### Timer (TimerDisplay + ticker hook)

- `START_TIMER{now}` sets `endsAt = now + remainingSeconds*1000`, `timerStatus = 'running'`, and `sessionStartedAt = now` if not set.
- `TICK{now}` sets `remainingSeconds = max(0, ceil((endsAt - now)/1000))`. When it reaches 0 the reducer applies the same transition as `FINISH_SESSION`.
- `PAUSE_TIMER{now}` freezes `remainingSeconds` from `endsAt` and clears `endsAt`. `RESUME_TIMER{now}` recomputes `endsAt` from the frozen value.
- `RESET_TIMER` restores `remainingSeconds = durationSeconds`, `timerStatus = 'stopped'`, `endsAt = null` (tasks untouched).
- `FINISH_SESSION{now}` (End Session button or timer zero) freezes the timer, ends any active slack (adding its duration), sets `sessionEnded = true`, `sessionEndedAt = now`, `ghostState = 'celebratory'`.
- A ticker `useEffect` dispatches `TICK{Date.now()}` every 1 000 ms while running, and once immediately on `visibilitychange` to visible. Because the reducer uses wall-clock time, throttled or missed ticks never cause drift.
- The Start handler also calls `audioEngine.unlock()` and `notificationService.requestPermissionIfNeeded()` (user-gesture requirement).

### GhostCompanion

Inline SVG ghost (no Lottie). `ghostState` maps to a CSS class: `ghost-idle` (slow float), `ghost-calm` (gentle bob with a book), `ghost-haunting` (shake, red eyes), `ghost-jumpscare` (scale-up lunge), `ghost-celebratory` (bounce). Under reduced motion (OS preference or manual toggle), all animation is disabled via CSS and `jumpscare` renders as `haunting`. The container has `role="img"` and an `aria-label` that describes the current state.

Ghost state is derived, with one transient override:

```
sessionEnded            → 'celebratory'
hauntMode               → 'haunting'
jumpscareUntil > now    → 'jumpscare'   (set on SLACK_END, 1 200 ms; skipped under reduced motion)
timerStatus==='running' → 'calm'
otherwise               → 'idle'
```

### HauntOverlay and JumpscareFlash

`HauntOverlay` is a fixed full-viewport `<div aria-hidden pointer-events-none>`. While `hauntMode` is on it shows a 25% red tint and the `haunt-glitch` animation. The keyframes run at 0.5 s per cycle (2 Hz), under the 3 Hz WCAG 2.3.1 limit. `JumpscareFlash` shows a 600 ms dark-red radial flash with the ghost face when the jumpscare state begins, and is not rendered under reduced motion.

### SurvivalReport

A native `<dialog>` opened with `showModal()` when `sessionEnded` is true. It reads `focusSeconds`, `completedThisSession`, `slackingOffCount`, and `currentRoast` (falling back to `getFallback('congratulate')` while the AI call is pending or failed). The dismiss button and `Escape` (`cancel` event) dispatch `DISMISS_REPORT`.

`DISMISS_REPORT` resets the timer to `durationSeconds`, zeroes `slackingOffCount` / `totalSlackSeconds`, clears `sessionStartedAt` / `sessionEndedAt` / `currentRoast` / `sessionEnded`, removes completed tasks, and keeps incomplete ones.

### AudioEngine (lib/audio/AudioEngine.ts)

A plain TypeScript class held in a `useRef`. Sound is synthesised, so there are no asset files or licensing concerns.

```typescript
class AudioEngine {
  unlock(): void            // create AudioContext (or resume) — call from a click handler
  start(): void             // build drone (2 detuned low oscillators + LFO tremolo) and heartbeat
                            // (scheduled "lub-dub" sine thumps); gain at 0.1; start 30 s escalation
  stop(): void              // clear escalation; ramp master gain to 0 over 2 s; stop nodes after ramp
  setMuted(m: boolean): void // master gain → 0 when muted; restore current level when unmuted
  get supported(): boolean
}
```

The escalation maths lives in `volume.ts` as `nextVolume(v) = min(1, round1(v + 0.1))`, so it can be tested without audio. If `AudioContext` is unavailable, `supported` is false, every method is a no-op, and `MuteToggle` shows "Audio unavailable".

### NotificationService (lib/notifications/NotificationService.ts)

```typescript
class NotificationService {
  get permission(): NotificationPermission | 'unsupported'   // reads Notification.permission live
  async requestPermissionIfNeeded(): Promise<void>           // only when permission === 'default'; at most once per page load
  notify(body: string, tag?: string): void                   // title fixed to "👻 Your Ghost Buddy is watching…"
}
```

`notify` creates the notification with `{ body, tag, renotify: true, icon: '/favicon-haunted.svg' }` and sets `onclick = () => { window.focus(); n.close(); }`. Each slack event uses tag `ssb-slack-<startedAt>`, so the AI roast notification replaces the immediate taunt. There is no `localStorage` cache, because `Notification.permission` is the source of truth.

### VisibilityMonitor and IdleDetector (lib/detection/)

```typescript
class VisibilityMonitor {
  constructor(onHidden: () => void, onVisible: () => void)
  start(): void; stop(): void
}

class IdleDetector {
  constructor(thresholdMs: number, onIdle: () => void, onActive: () => void)
  start(): void            // listens to mousemove, mousedown, keydown, wheel, touchstart, scroll (passive)
  stop(): void
  suspend(): void          // clears the timer (used while tab hidden)
  resume(): void           // restarts the countdown from now
}
```

Both are mounted only while `timerStatus === 'running'`. Input events are throttled to one reset per 250 ms.

### Ghost Roast route (app/api/ghost-roast/route.ts)

1. Get the client IP from the `x-forwarded-for` header (first entry), falling back to `'local'`. Call `rateLimit(ip)` (10 requests per 60 s window) and return `429 { error }` if over the limit.
2. Parse JSON (`400` if it isn't JSON). Run `validateRoastRequest(body)`; return `400 { error }` on failure.
3. If `process.env.ANTHROPIC_API_KEY` is unset, return `200 { message: getFallback(mode), source: 'fallback' }`.
4. Otherwise call Claude:
   - `client.beta.messages.create({ model: 'claude-opus-5-5', max_tokens: 2000, output_config: { effort: 'low' }, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default', system, messages })`, where `system` holds the ghost persona and output rules (one or two sentences, under 40 words, no slurs, no self-harm references, playful not cruel).
   - The task name goes in the user message inside `<task>` tags, and the prompt tells the model to treat it as data, not instructions.
   - Read the first `text` block. On `stop_reason === 'refusal'`, an empty text block, or any SDK error, return the fallback.
   - The client is created with `timeout: 8000` and `maxRetries: 1`, so a roast arrives well before the user returns.

---

## Data Models

```typescript
// lib/types.ts
export type TimerStatus = 'stopped' | 'running' | 'paused';
export type GhostState = 'idle' | 'calm' | 'haunting' | 'jumpscare' | 'celebratory';
export type SlackSource = 'visibility' | 'idle';
export type RoastMode = 'roast' | 'congratulate';

export interface Task {
  id: string;                  // crypto.randomUUID()
  name: string;                // trimmed, 1–200 chars
  completed: boolean;
  createdAt: number;
  completedAt: number | null;  // set on completion, cleared on un-completion
}

export interface SessionState {
  // Timer
  durationSeconds: number;      // 60–7200
  remainingSeconds: number;     // authoritative while paused/stopped; derived from endsAt while running
  timerStatus: TimerStatus;
  endsAt: number | null;        // epoch ms, non-null only while running
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
  | { type: 'RESTORE_STATE'; persisted: PersistedSessionState; now: number };
```

Key reducer rules:

- `SLACK_START` is ignored unless `timerStatus === 'running'` and `hauntMode === false`. Otherwise it sets `hauntMode`, `slackSource`, `slackStartedAt`, **increments `slackingOffCount`**, and clears `currentRoast`.
- `SLACK_END` is ignored unless `hauntMode`. Otherwise it adds `round((now - slackStartedAt)/1000)` to `totalSlackSeconds`, clears the slack fields, and sets `jumpscareUntil = now + 1200` if `jumpscare` is true.
- `ADD_TASK` trims the name and ignores empty or whitespace names; names over 200 characters are truncated.
- `RESTORE_STATE` re-derives `remainingSeconds` from `endsAt` (if running and the time has passed, the session finishes). It always sets `hauntMode = false`, because a reload means the user is back.

Derived selectors (`lib/session/selectors.ts`):

- `elapsedSeconds = durationSeconds - remainingSeconds`
- `focusSeconds = max(0, elapsedSeconds - totalSlackSeconds)`
- `completedThisSession = tasks.filter(t => t.completed && t.completedAt >= (sessionStartedAt ?? 0))`
- `currentTaskName = first incomplete task name ?? 'your studies'`

### LocalStorage schema

Single key `ssb_session`, version 2:

```typescript
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
}
```

The following fields are not persisted: `hauntMode`, `slackSource`, `slackStartedAt`, `jumpscareUntil`, `currentRoast`. A slack that is in progress at reload is already counted (because the count goes up at start), but its duration up to that point is lost, which is an acceptable approximation.

`localStorageSync.read()` returns `{ status: 'empty' } | { status: 'ok', data } | { status: 'corrupt' }`. It returns `corrupt`, and removes the key, when JSON parsing fails or `isValidPersistedState` rejects the data. That check confirms `version === 2`, the numeric fields are finite and in range, `timerStatus` is one of the enum values, `endsAt` is non-null exactly when running, and every task has the correct shape. Version 1 data is treated as corrupt, so the user sees the warning once.

### Ghost Roast API request/response

```typescript
export interface GhostRoastRequest { taskName: string; slackingDuration: number; mode: RoastMode }
export interface GhostRoastResponse { message: string; source: 'ai' | 'fallback' }
export interface GhostRoastError { error: string }   // HTTP 400 or 429
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Timer remaining time follows wall-clock time

*For any* duration D (60–7200 s), start time t0, and later time t ≥ t0, applying `START_TIMER{t0}` then `TICK{t}` SHALL yield `remainingSeconds = max(0, ceil(D - (t - t0)/1000))`, regardless of how many intermediate ticks were applied.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Pause then resume is a time-preserving round trip

*For any* running state and any times t1 ≤ t2, applying `PAUSE_TIMER{t1}` then `RESUME_TIMER{t2}` SHALL leave `remainingSeconds` equal to its value at t1, and `endsAt` SHALL equal `t2 + remainingSeconds*1000`.

**Validates: Requirements 1.5, 1.6**

### Property 3: Reset returns timer to initial duration

*For any* timer state, `RESET_TIMER` SHALL set `remainingSeconds = durationSeconds`, `timerStatus = 'stopped'`, and `endsAt = null`.

**Validates: Requirements 1.7**

### Property 4: Session state persistence round trip

*For any* valid `SessionState`, `fromPersisted(toPersisted(s))` SHALL be identical to `s` on every persisted field, and `isValidPersistedState(toPersisted(s))` SHALL be true.

**Validates: Requirements 1.8, 9.1, 9.3**

### Property 5: Corrupted localStorage yields clean state

*For any* stored string that is not a valid `PersistedSessionState`, `read()` SHALL return `{ status: 'corrupt' }` and remove the key.

**Validates: Requirements 9.5**

### Property 6: Task addition grows the list

*For any* task list and any name containing a non-whitespace character, `ADD_TASK` SHALL increase the list length by exactly 1, and the new task's name SHALL equal the trimmed input (truncated to 200 characters).

**Validates: Requirements 2.1, 2.2**

### Property 7: Whitespace-only task names are rejected

*For any* string made only of whitespace, `ADD_TASK` SHALL leave the state unchanged.

**Validates: Requirements 2.6**

### Property 8: Task deletion removes exactly one task

*For any* non-empty task list and any task id in it, `DELETE_TASK` SHALL decrease the length by 1, and that id SHALL be absent.

**Validates: Requirements 2.5**

### Property 9: Ghost Roast API validates request body

*For any* body where `taskName` is missing, empty, whitespace, longer than 200 characters, or not a string, or `slackingDuration` is negative, non-finite, or not a number, or `mode` is not `roast`/`congratulate`, the route SHALL return HTTP 400 with a non-empty `error`.

**Validates: Requirements 8.7, 8.8**

### Property 10: Ghost Roast API accepts valid request bodies

*For any* valid body with no API key configured, the route SHALL return HTTP 200 with a non-empty `message` drawn from the fallback list for that mode.

**Validates: Requirements 8.1, 8.5, 8.6**

### Property 11: Audio volume escalation stays within bounds

*For any* starting volume in [0, 1] and any number of steps n, applying `nextVolume` n times SHALL give a value in [0, 1] that never decreases from one step to the next.

**Validates: Requirements 6.2**

### Property 12: Slacking-off count increments once per started event

*For any* sequence of `SLACK_START` / `SLACK_END` actions applied to a running timer, `slackingOffCount` SHALL never decrease, and SHALL equal the initial count plus the number of `SLACK_START` actions applied while `hauntMode` was false.

**Validates: Requirements 4.5, 4.7**

### Property 13: Focus duration is bounded

*For any* reachable ended state, `0 ≤ focusSeconds ≤ elapsedSeconds ≤ durationSeconds`.

**Validates: Requirements 10.2, 4.9**

### Property 14: Survival Report displays all session data

*For any* ended state, the rendered `SurvivalReport` SHALL contain `toHHMMSS(focusSeconds)`, every name in `completedThisSession`, and `slackingOffCount`.

**Validates: Requirements 10.2, 10.3, 10.4**

### Property 15: Slacking is never recorded while the timer is not running

*For any* state with `timerStatus !== 'running'`, `SLACK_START` SHALL leave the state unchanged.

**Validates: Requirements 4.6**

---

## Error Handling

| Failure scenario | Handling |
|---|---|
| `localStorage` unreadable / corrupt | Remove the key, start clean, show a non-blocking toast |
| `localStorage` write throws (quota, private mode) | Catch; keep state in memory; show the toast once ("progress may not be saved") |
| `AudioContext` unavailable | `AudioEngine.supported = false`; no-ops; the mute toggle shows that audio is unavailable |
| AudioContext suspended (no gesture yet) | `unlock()` runs in the Start click handler; `start()` also tries `resume()` |
| Notifications unsupported / denied | `permission` is `'unsupported'` or `'denied'`; `notify` does nothing; no prompt is shown again |
| `/api/ghost-roast` non-2xx, 429, timeout, network error | `fetchRoast` returns `null`; the caller uses `getFallback(mode)` |
| Claude refusal, empty text, or SDK error | The route returns a fallback with `source: 'fallback'` |
| `prefers-reduced-motion` or manual toggle | CSS disables all animations; jumpscare is skipped; the glitch is replaced by a static tint |
| Flash frequency guard | `haunt-glitch` cycle is 500 ms (2 Hz) ≤ 3 Hz |

---

## Testing Strategy

**Tooling:** Jest (via `next/jest`), React Testing Library, jsdom, and fast-check (at least 100 runs per property). Route-handler tests use the `node` environment (`@jest-environment node`) and call `POST(new Request(...))` directly.

### Unit tests
- `sessionReducer`: each action, including the boundaries (TICK at exactly `endsAt`, a SLACK_START while already haunting, TOGGLE_TASK un-completing).
- `formatTime`: `toMMSS(0)="00:00"`, `toMMSS(90)="01:30"`, `toHHMMSS(3661)="01:01:01"`.
- `localStorageSync`: empty, valid, invalid JSON, wrong version, bad shape, write that throws.
- `fallbackRoasts`: at least 10 taunts and at least 5 congratulations, all non-empty, and the picker respects the mode.
- `ghostRoastClient`: 400, 429, or a network error each return `null`.
- `NotificationService`: no prompt when permission is not `'default'`; at most one prompt per page load; click focuses the window.
- `IdleDetector`: fake timers; idle after 60 s, active on input, no firing while suspended.

### Property-based tests
Properties 1–15 above, each tagged `Feature: spooky-study-buddy, Property N`.

### Integration tests
- Visibility flow: mount the app, start the timer, fire `visibilitychange` to hidden (`hauntMode` true, count = 1), then to visible (`hauntMode` false, count still 1).
- Idle + hidden: hide the tab and advance 60 s; there is still only one slack event.

### Manual smoke checklist (real browser)
Audio plays after switching tabs; the title flashes; the favicon swaps; the notification arrives, and its text changes to the AI roast about 10 s in; clicking it focuses the tab; the timer finishes correctly after 5+ minutes hidden; a refresh mid-session restores the state.
