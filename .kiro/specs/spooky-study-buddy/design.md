# Design Document

## Overview

Spooky Study Buddy is a single-page productivity application built with Next.js 14+ (App Router), TypeScript, and Tailwind CSS. Its purpose is to keep students focused during study sessions by coupling a Pomodoro-style timer with escalating Halloween-horror consequences for procrastination.

The application runs entirely in the browser. There is no server-side user state; all session data persists in `localStorage`. The only server-side code is the `/api/ghost-roast` Next.js route handler, which calls an AI provider to generate spooky taunts. When no API key is configured, the route is bypassed in favour of a locally bundled fallback set.

### Key design principles

- **Client-first**: every interactive subsystem (timer, detection, audio, notifications) lives in `'use client'` components or plain TypeScript modules imported by them. Server Components render only the static shell and the API route.
- **Single source of truth**: all mutable session state lives in one React context (`SessionContext`). Subsystems read from and dispatch actions to that context. `localStorage` is kept as a mirror, written within 500 ms of any state change.
- **Graceful degradation**: the Audio Engine, Notification Service, and AI route each have defined fallback paths so a capability gap in the browser never crashes the app.
- **Accessibility by default**: reduced-motion, keyboard navigation, and colour-contrast requirements are addressed at the component level, not retrofitted.

---

## Architecture

### High-level component tree

```
app/
├── layout.tsx                  (Server Component — HTML shell, fonts, global CSS)
└── page.tsx                    (Server Component — renders <StudyBuddyApp />)

components/
├── StudyBuddyApp.tsx           ('use client' — root client boundary, composes all UI panels)
├── timer/
│   ├── TimerDisplay.tsx        (MM:SS readout, start/pause/reset controls)
│   └── DurationPicker.tsx      (1–120 min slider/input, only visible pre-session)
├── tasks/
│   ├── TaskList.tsx            (renders TaskItem list)
│   ├── TaskItem.tsx            (single task row: checkbox, label, delete)
│   └── TaskInput.tsx           (new-task form with inline validation)
├── ghost/
│   ├── GhostCompanion.tsx      (animation state machine, renders SVG/Lottie frames)
│   └── RoastBubble.tsx         (speech bubble that appears over the ghost)
├── haunt/
│   ├── HauntOverlay.tsx        (red-tint overlay + CSS glitch effect)
│   └── JumpscareFlash.tsx      (brief full-screen flash on tab return)
├── report/
│   └── SurvivalReport.tsx      (modal: focus time, completed tasks, haunt count, roast)
└── ui/
    ├── MuteToggle.tsx
    └── ReduceMotionToggle.tsx   (manual override for users who want to suppress effects)

lib/
├── session/
│   ├── SessionContext.tsx      (React context + useReducer — single state store)
│   ├── sessionReducer.ts       (pure reducer, all state transitions)
│   └── localStorageSync.ts     (read/write helpers, schema validation, corruption recovery)
├── detection/
│   ├── VisibilityMonitor.ts    (Page Visibility API wrapper)
│   └── IdleDetector.ts         (mousemove/keydown inactivity tracker, 60 s threshold)
├── audio/
│   └── AudioEngine.ts          (Web Audio API + HTML <audio> fallback, volume scheduling)
├── notifications/
│   └── NotificationService.ts  (Web Notifications API wrapper, one-shot permission)
├── roast/
│   ├── ghostRoastClient.ts     (fetch wrapper for /api/ghost-roast)
│   └── fallbackRoasts.ts       (10+ pre-written lines)
└── utils/
    ├── formatTime.ts           (seconds → MM:SS, seconds → HH:MM:SS)
    └── tabEffects.ts           (title flashing, favicon swap)

app/api/ghost-roast/
└── route.ts                    (POST handler — validates body, calls AI provider, returns roast)
```

### Data flow

```
User interaction
      │
      ▼
React component (e.g. TimerDisplay)
      │  dispatches action
      ▼
sessionReducer (pure function, returns new SessionState)
      │
      ├──► SessionContext consumers re-render
      │
      └──► localStorageSync (effect in SessionContext.tsx)
                writes updated state → localStorage within 500 ms

Side-effect subsystems (run as useEffect inside StudyBuddyApp):
  VisibilityMonitor ──► dispatch SLACK_START / SLACK_END
  IdleDetector      ──► dispatch SLACK_START / SLACK_END
  AudioEngine       ──► reacts to session.hauntMode, session.muted
  NotificationService ► reacts to session.hauntMode
  tabEffects        ──► reacts to session.hauntMode (title flash, favicon)
```

---

## Components and Interfaces

### SessionContext

The single state store. Provides `state: SessionState` and `dispatch: Dispatch<SessionAction>` to all client components via React context. Internally uses `useReducer(sessionReducer, initialState)`. An effect watches `state` and calls `localStorageSync.write(state)` with a 500 ms debounce.

### TimerDisplay

Props: none (reads from `SessionContext`).

Responsibilities:
- Render remaining time in MM:SS via `formatTime`.
- Expose Start, Pause, Resume, and Reset buttons; each dispatches the corresponding action.
- Run the countdown via `setInterval` inside a `useEffect` that fires `TICK` actions every 1 000 ms. The interval is cleared when the timer is not running.
- Detect timer-drift on tab-visibility restore by comparing `Date.now()` with the last-tick timestamp stored in state.

### GhostCompanion

Props: none (reads `session.ghostState` from `SessionContext`).

Responsibilities:
- Map `GhostState` enum values to Lottie/CSS animation classes.
- Honour `prefers-reduced-motion`: when the OS preference is `reduce`, substitute static images for all animations and skip the jumpscare.
- Render an `aria-label` on the container for screen readers.

### HauntOverlay

Renders a fixed, full-viewport `<div>` with `pointer-events: none`. When `session.hauntMode` is `true` it adds the `haunt-active` Tailwind class which applies the red-tint overlay and CSS glitch keyframes. The glitch animation is capped at 3 flashes per second to meet WCAG 2.3.1.

### SurvivalReport

Rendered as a `<dialog>` element (native modal). Receives no props; reads all data from `SessionContext`. Displays:
- Total focus duration (HH:MM:SS).
- List of completed tasks.
- Total `Slacking_Off_Event` count.
- AI roast or fallback message.

On dismiss, dispatches `END_SESSION` which clears state and resets the timer.

### AudioEngine (lib/audio/AudioEngine.ts)

A plain TypeScript class (not a React component) instantiated once and held in a `useRef` inside `StudyBuddyApp`.

```typescript
class AudioEngine {
  private ctx: AudioContext | null
  private gainNode: GainNode | null
  private source: AudioBufferSourceNode | MediaElementAudioSourceNode | null
  private volumeStepInterval: ReturnType<typeof setInterval> | null
  private muted: boolean

  start(): void          // begins ambient track at gain 0.1, starts escalation timer
  stop(): void           // cancels escalation, fades gain to 0 over 2 s, then stops source
  setMuted(m: boolean): void
  private escalate(): void  // adds 0.1 to gain every 30 s, caps at 1.0
  private fadeOut(): void   // gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 2)
}
```

The constructor attempts `new AudioContext()`. On failure (old browser) it falls back to `new Audio(src)` controlled via the `volume` property and plain `setTimeout` escalation.

### NotificationService (lib/notifications/NotificationService.ts)

```typescript
class NotificationService {
  private permissionState: NotificationPermission | 'unsupported'

  async requestPermission(): Promise<void>
  notify(title: string, body: string): void
  isDenied(): boolean
}
```

`requestPermission` is called once on `App` mount. The result is cached in `localStorage` under `ssb_notification_permission` so the app does not prompt again in the same browser session if the user denied.

### VisibilityMonitor and IdleDetector (lib/detection/)

Both are plain TypeScript classes with `start()`, `stop()` methods. They receive callbacks rather than accessing context directly, keeping them pure and testable.

```typescript
class VisibilityMonitor {
  constructor(
    private onHidden: () => void,
    private onVisible: () => void
  ) {}
  start(): void   // addEventListener('visibilitychange', ...)
  stop(): void    // removeEventListener
}

class IdleDetector {
  constructor(
    private idleThresholdMs: number,  // 60 000
    private onIdle: () => void,
    private onActive: () => void
  ) {}
  start(): void   // attaches mousemove/keydown listeners, sets 60 s timeout
  stop(): void    // removes listeners, clears timeout
  private reset(): void  // called on each input event
}
```

---

## Data Models

### SessionState

```typescript
type TimerStatus = 'stopped' | 'running' | 'paused';

type GhostState = 'idle' | 'calm' | 'haunting' | 'jumpscare' | 'celebratory';

interface Task {
  id: string;           // uuid v4
  name: string;
  completed: boolean;
  createdAt: number;    // Date.now()
}

interface SessionState {
  // Timer
  durationSeconds: number;         // user-specified total, 60–7200
  remainingSeconds: number;
  timerStatus: TimerStatus;
  lastTickAt: number | null;       // Date.now() at last TICK, for drift correction

  // Tasks
  tasks: Task[];

  // Haunt
  hauntMode: boolean;
  slackingOffCount: number;
  slackStartedAt: number | null;   // Date.now() when current slack started

  // Ghost
  ghostState: GhostState;

  // Audio
  muted: boolean;

  // Roast
  currentRoast: string | null;

  // Session lifecycle
  sessionEnded: boolean;
}
```

### LocalStorage schema

All data is stored under a single key `ssb_session` as a JSON string:

```typescript
interface PersistedSessionState {
  version: 1;
  durationSeconds: number;
  remainingSeconds: number;
  timerStatus: TimerStatus;
  lastTickAt: number | null;
  tasks: Task[];
  slackingOffCount: number;
  muted: boolean;
}
```

Fields not persisted (`hauntMode`, `ghostState`, `currentRoast`, `sessionEnded`, `slackStartedAt`) are always derived fresh on load. `hauntMode` and `slackStartedAt` are reset to `false` / `null` on page load because a reload implies the user has returned to the tab.

A second key `ssb_notification_permission` stores `'granted' | 'denied' | 'default'` to prevent repeat prompts.

**Schema validation and corruption recovery** (`lib/session/localStorageSync.ts`):

```typescript
function read(): PersistedSessionState | null {
  try {
    const raw = localStorage.getItem('ssb_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidPersistedState(parsed)) {
      localStorage.removeItem('ssb_session');
      return null;   // triggers clean-state init + non-blocking warning toast
    }
    return parsed;
  } catch {
    localStorage.removeItem('ssb_session');
    return null;
  }
}
```

`isValidPersistedState` checks that `version === 1`, numeric fields are finite numbers within range, `timerStatus` is one of the three enum values, and `tasks` is an array of objects with the correct shape.

### Ghost Roast API request/response

```typescript
// POST /api/ghost-roast
interface GhostRoastRequest {
  taskName: string;         // non-empty string
  slackingDuration: number; // non-negative number, seconds
  mode: 'roast' | 'congratulate';
}

interface GhostRoastResponse {
  message: string;
}

// Error response (HTTP 400)
interface GhostRoastError {
  error: string;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Timer countdown preserves remaining time

*For any* valid initial duration (60–7200 s) and any number of TICK actions applied while the timer is running, the resulting `remainingSeconds` SHALL equal `durationSeconds` minus the number of ticks applied, clamped to zero.

**Validates: Requirements 1.2, 1.3**

### Property 2: Pause then resume is a time-preserving round trip

*For any* running timer state with `remainingSeconds > 0`, applying PAUSE then RESUME SHALL leave `remainingSeconds` unchanged.

**Validates: Requirements 1.5, 1.6**

### Property 3: Reset returns timer to initial duration

*For any* timer state (running, paused, or stopped) with any `remainingSeconds`, applying RESET SHALL set `remainingSeconds` equal to `durationSeconds` and `timerStatus` to `'stopped'`.

**Validates: Requirements 1.7**

### Property 4: Session state persistence round trip

*For any* valid `SessionState`, serialising it to the localStorage schema and then deserialising it SHALL produce a state whose timer fields, task list, `slackingOffCount`, and `muted` flag are identical to the originals.

**Validates: Requirements 9.1, 9.3**

### Property 5: Corrupted localStorage yields clean state

*For any* string value that does not parse as a valid `PersistedSessionState`, calling `localStorageSync.read()` SHALL return `null` and SHALL remove the corrupted key from localStorage.

**Validates: Requirements 9.5**

### Property 6: Task addition grows the list

*For any* task list and any non-empty, non-whitespace task name, dispatching ADD_TASK SHALL increase the task list length by exactly 1 and the new task's `name` SHALL equal the trimmed input.

**Validates: Requirements 2.1, 2.2**

### Property 7: Whitespace-only task names are rejected

*For any* string composed entirely of whitespace characters, dispatching ADD_TASK SHALL leave the task list unchanged.

**Validates: Requirements 2.6**

### Property 8: Task deletion removes exactly one task

*For any* task list containing a task with a given `id`, dispatching DELETE_TASK with that `id` SHALL decrease the list length by exactly 1 and the deleted task SHALL no longer appear in the list.

**Validates: Requirements 2.5**

### Property 9: Ghost Roast API validates request body

*For any* request body where `taskName` is empty or `slackingDuration` is negative, the `/api/ghost-roast` route SHALL return HTTP 400 and a non-empty `error` string.

**Validates: Requirements 8.7, 8.8**

### Property 10: Ghost Roast API accepts valid request bodies

*For any* request body where `taskName` is a non-empty string and `slackingDuration` is a non-negative finite number, the `/api/ghost-roast` route SHALL return HTTP 200 and a non-empty `message` string (using the fallback set when no API key is configured).

**Validates: Requirements 8.1, 8.3, 8.5**

### Property 11: Audio volume escalation stays within bounds

*For any* starting volume in [0, 1] and any number of 30-second escalation steps, the resulting volume SHALL remain in [0, 1].

**Validates: Requirements 6.2**

### Property 12: Slacking-off count is monotonically non-decreasing

*For any* sequence of SLACK_START and SLACK_END actions, the `slackingOffCount` in the resulting state SHALL be greater than or equal to the count in the initial state, and SHALL increase by exactly 1 for each SLACK_END that follows a SLACK_START.

**Validates: Requirements 4.5**

### Property 13: Survival Report displays all session data

*For any* session state, the data rendered by `SurvivalReport` SHALL include the focus duration formatted as HH:MM:SS, the full list of completed tasks, and the cumulative `slackingOffCount`.

**Validates: Requirements 10.2, 10.3, 10.4**

---

## Error Handling

| Failure scenario | Handling |
|---|---|
| `localStorage` read throws | Catch, discard key, initialise clean state, show non-blocking toast |
| `localStorage` write throws (quota exceeded) | Catch silently; state remains in memory, toast warns user data may not persist |
| `AudioContext` not supported | Constructor falls back to `HTMLAudioElement`; if that also fails, audio is disabled silently |
| Notification permission denied | `NotificationService.isDenied()` returns `true`; no further requests; app continues without notifications |
| `/api/ghost-roast` returns non-2xx or network error | `ghostRoastClient.ts` catches, returns `null`; caller renders a random `fallbackRoasts` message |
| `/api/ghost-roast` receives invalid body | Route returns HTTP 400 with descriptive JSON error; client treats it as a fetch failure |
| AI provider rate-limited or key absent | Same as above — fallback roast message is shown |
| `prefers-reduced-motion: reduce` | `GhostCompanion` renders static images; `HauntOverlay` omits glitch keyframes; jumpscare is suppressed |
| Flash frequency guard | CSS `@keyframes haunt-glitch` is authored so the full-on/full-off cycle takes ≥ 333 ms, keeping it ≤ 3 Hz |

---

## Testing Strategy

### Unit tests (Jest + React Testing Library)

- `sessionReducer`: one test per action type, covering normal paths and boundary values (e.g. TICK when `remainingSeconds === 1`).
- `formatTime`: specific examples — `0 → "00:00"`, `3661 → "01:01:01"`.
- `localStorageSync.read/write`: mock `localStorage`, test missing key, valid key, and schema-invalid key.
- `ghostRoastClient`: mock `fetch`, assert that a 400 response causes the function to return `null`.
- `fallbackRoasts`: verify the array has at least 10 entries and each is a non-empty string.
- `AudioEngine`: mock `AudioContext` and `HTMLAudioElement`; verify `start()`, `stop()`, `setMuted()`, and `escalate()` call the right methods.

### Property-based tests (fast-check, minimum 100 iterations each)

[fast-check](https://github.com/dubzzz/fast-check) is the chosen library for TypeScript property testing.

Each test below maps to a Correctness Property defined above:

- **Property 1 — Timer countdown** `fc.property(fc.integer({min:60,max:7200}), fc.nat())` → apply N ticks, assert `remainingSeconds = max(0, duration - N)`. *Feature: spooky-study-buddy, Property 1: timer countdown preserves remaining time*
- **Property 2 — Pause/resume round trip** `fc.property(runningTimerArb)` → dispatch PAUSE then RESUME, assert `remainingSeconds` unchanged. *Feature: spooky-study-buddy, Property 2: pause then resume is a time-preserving round trip*
- **Property 3 — Reset** `fc.property(anyTimerStateArb)` → dispatch RESET, assert `remainingSeconds === durationSeconds` and status `'stopped'`. *Feature: spooky-study-buddy, Property 3: reset returns timer to initial duration*
- **Property 4 — Persistence round trip** `fc.property(validSessionStateArb)` → serialise then deserialise, assert field equality. *Feature: spooky-study-buddy, Property 4: session state persistence round trip*
- **Property 5 — Corrupt localStorage** `fc.property(fc.string())` → call `read()`, assert returns `null` and key removed. *Feature: spooky-study-buddy, Property 5: corrupted localStorage yields clean state*
- **Property 6 — Task addition** `fc.property(taskListArb, nonEmptyNonWhitespaceStringArb)` → dispatch ADD_TASK, assert length+1 and name matches. *Feature: spooky-study-buddy, Property 6: task addition grows the list*
- **Property 7 — Whitespace rejection** `fc.property(fc.stringOf(fc.constantFrom(' ', '\t', '\n')))` → dispatch ADD_TASK, assert list unchanged. *Feature: spooky-study-buddy, Property 7: whitespace-only task names are rejected*
- **Property 8 — Task deletion** `fc.property(nonEmptyTaskListArb)` → delete a random task by id, assert length-1 and id absent. *Feature: spooky-study-buddy, Property 8: task deletion removes exactly one task*
- **Property 9 — API rejects invalid body** `fc.property(invalidBodyArb)` → POST to route handler in-process, assert HTTP 400 + non-empty `error`. *Feature: spooky-study-buddy, Property 9: ghost roast API validates request body*
- **Property 10 — API accepts valid body** `fc.property(validBodyArb)` → POST with API key absent (triggers fallback), assert HTTP 200 + non-empty `message`. *Feature: spooky-study-buddy, Property 10: ghost roast API accepts valid request bodies*
- **Property 11 — Audio volume bounds** `fc.property(fc.double({min:0,max:1}), fc.nat({max:200}))` → apply N escalation steps, assert result in [0, 1]. *Feature: spooky-study-buddy, Property 11: audio volume escalation stays within bounds*
- **Property 12 — Haunt count monotone** `fc.property(slackEventSequenceArb)` → replay action sequence, assert count non-decreasing and +1 per complete SLACK_START/END pair. *Feature: spooky-study-buddy, Property 12: slacking-off count is monotonically non-decreasing*
- **Property 13 — Survival Report completeness** `fc.property(endedSessionStateArb)` → render `SurvivalReport`, assert HH:MM:SS duration present, all completed task names present, `slackingOffCount` present. *Feature: spooky-study-buddy, Property 13: survival report displays all session data*

### Integration tests

- End-to-end tab-visibility flow: mount `StudyBuddyApp` in jsdom, fire `visibilitychange` to hidden, assert `hauntMode` becomes `true`, fire `visibilitychange` to visible, assert `hauntMode` becomes `false`.
- Notification permission: mock `Notification.requestPermission`, assert it is called exactly once per mount even when called multiple times.
- `/api/ghost-roast` integration: test with a real (or stubbed) AI provider key, assert the route returns a non-empty string.

### Snapshot tests

- `SurvivalReport` rendered with a fixed seed state.
- `GhostCompanion` in each of the five `GhostState` values.
- `HauntOverlay` in active and inactive states.
