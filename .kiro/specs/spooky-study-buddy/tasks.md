# Implementation Plan: Spooky Study Buddy

## Overview

Build the Spooky Study Buddy Next.js 14 application incrementally, wiring each subsystem into the shared `SessionContext` as it is implemented. The order moves from foundational state management outward to UI, side-effect subsystems, the API route, and finally property-based and integration tests.

## Tasks

- [ ] 1. Scaffold project structure and core type definitions
  - Initialise a Next.js 14 App Router project with TypeScript and Tailwind CSS.
  - Create the directory tree from the design: `components/timer`, `components/tasks`, `components/ghost`, `components/haunt`, `components/report`, `components/ui`, `lib/session`, `lib/detection`, `lib/audio`, `lib/notifications`, `lib/roast`, `lib/utils`, `app/api/ghost-roast`.
  - Define and export all shared TypeScript types in `lib/session/SessionContext.tsx`: `TimerStatus`, `GhostState`, `Task`, `SessionState`, `SessionAction`, `PersistedSessionState`, and the `GhostRoastRequest` / `GhostRoastResponse` / `GhostRoastError` interfaces from the design's Data Models section.
  - _Requirements: 1.1–1.8, 2.1–2.6, 4.1–4.6, 9.1–9.5_

- [ ] 2. Implement session state management
  - [ ] 2.1 Implement `sessionReducer` in `lib/session/sessionReducer.ts`
    - Handle all actions: `START_TIMER`, `PAUSE_TIMER`, `RESUME_TIMER`, `RESET_TIMER`, `TICK`, `ADD_TASK`, `DELETE_TASK`, `COMPLETE_TASK`, `SLACK_START`, `SLACK_END`, `SET_ROAST`, `SET_GHOST_STATE`, `END_SESSION`, `SET_MUTED`, `RESTORE_STATE`.
    - `TICK` decrements `remainingSeconds` by 1, clamped to 0; sets `timerStatus` to `'stopped'` and `sessionEnded` to `true` when it reaches 0.
    - `SLACK_START` sets `hauntMode: true` and records `slackStartedAt`; `SLACK_END` increments `slackingOffCount` and clears `hauntMode`.
    - `ADD_TASK` trims the name and rejects empty/whitespace strings (list unchanged).
    - _Requirements: 1.2–1.7, 2.1–2.6, 4.5, 9.1_

  - [ ]* 2.2 Write property test for `sessionReducer` — Timer countdown (Property 1)
    - **Property 1: Timer countdown preserves remaining time**
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 2.3 Write property test for `sessionReducer` — Pause/resume round trip (Property 2)
    - **Property 2: Pause then resume is a time-preserving round trip**
    - **Validates: Requirements 1.5, 1.6**

  - [ ]* 2.4 Write property test for `sessionReducer` — Reset (Property 3)
    - **Property 3: Reset returns timer to initial duration**
    - **Validates: Requirements 1.7**

  - [ ]* 2.5 Write property test for `sessionReducer` — Task addition (Property 6)
    - **Property 6: Task addition grows the list**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 2.6 Write property test for `sessionReducer` — Whitespace rejection (Property 7)
    - **Property 7: Whitespace-only task names are rejected**
    - **Validates: Requirements 2.6**

  - [ ]* 2.7 Write property test for `sessionReducer` — Task deletion (Property 8)
    - **Property 8: Task deletion removes exactly one task**
    - **Validates: Requirements 2.5**

  - [ ]* 2.8 Write property test for `sessionReducer` — Haunt count monotone (Property 12)
    - **Property 12: Slacking-off count is monotonically non-decreasing**
    - **Validates: Requirements 4.5**

- [ ] 3. Implement localStorage sync
  - [ ] 3.1 Implement `localStorageSync.ts` in `lib/session/`
    - Write `read(): PersistedSessionState | null` with try/catch, JSON.parse, and `isValidPersistedState` guard (checks `version === 1`, numeric ranges, `timerStatus` enum, task array shape). On invalid data: remove the key and return `null`.
    - Write `write(state: SessionState): void` with try/catch; on quota error log silently and do not rethrow.
    - Persist only the fields defined in `PersistedSessionState`: `version`, `durationSeconds`, `remainingSeconds`, `timerStatus`, `lastTickAt`, `tasks`, `slackingOffCount`, `muted`.
    - _Requirements: 9.1–9.5_

  - [ ]* 3.2 Write property test for `localStorageSync` — Persistence round trip (Property 4)
    - **Property 4: Session state persistence round trip**
    - **Validates: Requirements 9.1, 9.3**

  - [ ]* 3.3 Write property test for `localStorageSync` — Corrupt data (Property 5)
    - **Property 5: Corrupted localStorage yields clean state**
    - **Validates: Requirements 9.5**

- [ ] 4. Implement `SessionContext` and wire reducer + localStorage sync
  - Create `lib/session/SessionContext.tsx` as a `'use client'` context provider.
  - Initialise state by calling `localStorageSync.read()` on mount; if `null`, use the default initial state.
  - If the persisted data contained a corrupt-state recovery (read returned `null` after removing a key), expose a `showCorruptWarning: boolean` flag in context.
  - Use `useReducer(sessionReducer, initialState)`.
  - Add a `useEffect` that calls `localStorageSync.write(state)` with a 500 ms debounce on every state change.
  - Export `useSession()` convenience hook.
  - _Requirements: 9.1–9.5_

- [ ] 5. Checkpoint — Ensure all state-layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement utility functions
  - [ ] 6.1 Implement `formatTime` in `lib/utils/formatTime.ts`
    - Export `toMMSS(seconds: number): string` — pads minutes and seconds to two digits.
    - Export `toHHMMSS(seconds: number): string` — pads hours, minutes, and seconds.
    - _Requirements: 1.3, 10.2_

  - [ ]* 6.2 Write unit tests for `formatTime`
    - Test `toMMSS(0) === "00:00"`, `toMMSS(90) === "01:30"`.
    - Test `toHHMMSS(3661) === "01:01:01"`, `toHHMMSS(0) === "00:00:00"`.
    - _Requirements: 1.3, 10.2_

- [ ] 7. Implement Timer components
  - [ ] 7.1 Implement `DurationPicker` in `components/timer/DurationPicker.tsx`
    - Render a range slider and numeric input, both clamped to 1–120 minutes.
    - Dispatch `SET_DURATION` action (add this action to the reducer) only when `timerStatus === 'stopped'`.
    - Hide when a session is active (`timerStatus !== 'stopped'`).
    - _Requirements: 1.1_

  - [ ] 7.2 Implement `TimerDisplay` in `components/timer/TimerDisplay.tsx`
    - Read `remainingSeconds` and `timerStatus` from `useSession()`.
    - Display remaining time using `toMMSS`.
    - Render Start, Pause/Resume, and Reset buttons; dispatch corresponding actions.
    - Run the countdown via `setInterval` in a `useEffect`; fire `TICK` every 1 000 ms; clear the interval when `timerStatus !== 'running'`.
    - On `visibilitychange` restore, compute elapsed ms since `lastTickAt` and dispatch the correct number of catch-up `TICK` actions for drift correction.
    - Ensure all buttons are keyboard-accessible and have `aria-label` attributes.
    - _Requirements: 1.1–1.8, 11.3, 11.4_

- [ ] 8. Implement Task List components
  - [ ] 8.1 Implement `TaskInput` in `components/tasks/TaskInput.tsx`
    - Controlled text input + "Add" button.
    - On submit: trim the value; if empty or whitespace, display an inline validation message and do not dispatch.
    - Otherwise dispatch `ADD_TASK`.
    - Keyboard-accessible; "Add" activates on Enter.
    - _Requirements: 2.1, 2.6, 11.3_

  - [ ] 8.2 Implement `TaskItem` in `components/tasks/TaskItem.tsx`
    - Render task name, a checkbox that dispatches `COMPLETE_TASK`, and a delete button that dispatches `DELETE_TASK`.
    - Apply a visual struck-through style when `completed === true`.
    - Provide `aria-label` on the delete button.
    - _Requirements: 2.3, 2.5, 11.4_

  - [ ] 8.3 Implement `TaskList` in `components/tasks/TaskList.tsx`
    - Render an ordered list of `TaskItem` components from `useSession().state.tasks`.
    - _Requirements: 2.2_

- [ ] 9. Implement Ghost Companion components
  - [ ] 9.1 Implement `GhostCompanion` in `components/ghost/GhostCompanion.tsx`
    - Map each `GhostState` value to a distinct CSS animation class (or Lottie animation): `idle` → idle float, `calm` → calm study, `haunting` → haunting shake, `jumpscare` → jumpscare flash, `celebratory` → celebratory bounce.
    - Read `ghostState` from `useSession()`.
    - When `prefers-reduced-motion: reduce` is active (via `window.matchMedia`), substitute a static image for every animated state and suppress the jumpscare.
    - Add `aria-label="Ghost companion"` to the container.
    - _Requirements: 3.1–3.6, 11.2, 11.4_

  - [ ] 9.2 Implement `RoastBubble` in `components/ghost/RoastBubble.tsx`
    - Render a speech bubble above the ghost when `currentRoast !== null`.
    - Display the `currentRoast` string from `useSession()`.
    - _Requirements: 8.2_

- [ ] 10. Implement detection subsystems
  - [ ] 10.1 Implement `VisibilityMonitor` in `lib/detection/VisibilityMonitor.ts`
    - Plain TypeScript class with `start()` / `stop()` methods and `onHidden` / `onVisible` callbacks.
    - On `document.visibilityState === 'hidden'` call `onHidden`; on `'visible'` call `onVisible`.
    - _Requirements: 4.1, 4.2_

  - [ ] 10.2 Implement `IdleDetector` in `lib/detection/IdleDetector.ts`
    - Plain TypeScript class with `start()`, `stop()`, and private `reset()` methods.
    - Attach `mousemove` and `keydown` listeners in `start()`; each event calls `reset()` which clears and restarts the 60 000 ms timeout.
    - On timeout: call `onIdle`; on `reset()` while idle: call `onActive`.
    - `stop()` removes listeners and clears the timeout.
    - _Requirements: 4.3, 4.4, 4.6_

- [ ] 11. Implement Haunt Mode effects
  - [ ] 11.1 Implement `tabEffects` in `lib/utils/tabEffects.ts`
    - Export `startTitleFlash(normalTitle: string): void` — toggles `document.title` between `normalTitle` and `"👁️ I SEE YOU SLACKING..."` on a 1 000 ms interval.
    - Export `stopTitleFlash(normalTitle: string): void` — clears the interval and restores `normalTitle`.
    - Export `setCreepyFavicon(): void` and `restoreFavicon(): void` — swap `<link rel="icon">` href.
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 11.2 Implement `HauntOverlay` in `components/haunt/HauntOverlay.tsx`
    - Fixed, full-viewport `<div>` with `pointer-events: none`.
    - When `hauntMode === true`, apply Tailwind classes for a semi-transparent red overlay and a `haunt-glitch` CSS animation.
    - Author `@keyframes haunt-glitch` in the global CSS so each full on/off cycle takes ≥ 333 ms (≤ 3 Hz).
    - Remove all effects within 500 ms of `hauntMode` becoming `false`.
    - _Requirements: 5.4, 5.6, 11.5_

  - [ ] 11.3 Implement `JumpscareFlash` in `components/haunt/JumpscareFlash.tsx`
    - Brief full-screen flash component shown when `ghostState === 'jumpscare'`.
    - Suppressed entirely when `prefers-reduced-motion: reduce`.
    - _Requirements: 5.5, 11.2_

- [ ] 12. Implement Audio Engine
  - [ ] 12.1 Implement `AudioEngine` class in `lib/audio/AudioEngine.ts`
    - Constructor: attempt `new AudioContext()`; on failure fall back to `new Audio(src)`.
    - `start()`: begin ambient track at gain 0.1 and start the escalation interval.
    - `stop()`: cancel escalation, fade gain to 0 over 2 seconds via `linearRampToValueAtTime`, then stop the source.
    - `escalate()` (private): add 0.1 to gain every 30 000 ms, capped at 1.0.
    - `setMuted(muted: boolean)`: set gain to 0 when muted; restore last gain when unmuted.
    - For the HTML `<audio>` fallback: use `volume` property and `setTimeout`-based escalation.
    - _Requirements: 6.1–6.6_

  - [ ]* 12.2 Write property test for `AudioEngine` — Volume bounds (Property 11)
    - **Property 11: Audio volume escalation stays within bounds**
    - **Validates: Requirements 6.2**

  - [ ]* 12.3 Write unit tests for `AudioEngine`
    - Mock `AudioContext` and `HTMLAudioElement`; verify `start()`, `stop()`, `setMuted()`, and `escalate()` call the correct methods.
    - _Requirements: 6.1–6.4_

- [ ] 13. Implement Notification Service
  - [ ] 13.1 Implement `NotificationService` in `lib/notifications/NotificationService.ts`
    - `requestPermission()`: call `Notification.requestPermission()` once; cache result in `localStorage` under `ssb_notification_permission`; do not call again if already `'denied'` or `'granted'`.
    - `notify(title, body)`: create a `new Notification(title, { body })` only when `permissionState === 'granted'`.
    - `isDenied()`: return `true` when `permissionState === 'denied'`.
    - If `'Notification' in window` is false, set `permissionState` to `'unsupported'` and no-op all methods.
    - _Requirements: 7.1–7.5_

- [ ] 14. Implement Ghost Roast subsystem
  - [ ] 14.1 Implement `fallbackRoasts` in `lib/roast/fallbackRoasts.ts`
    - Export an array of at least 10 pre-written strings — a mix of procrastination taunts and session-completion encouragements.
    - Export `getRandomRoast(): string` that returns a random entry.
    - _Requirements: 8.5, 8.6_

  - [ ] 14.2 Implement `/api/ghost-roast` route handler in `app/api/ghost-roast/route.ts`
    - Parse the request body as `GhostRoastRequest`.
    - Validate: `taskName` must be a non-empty string; `slackingDuration` must be a non-negative finite number; `mode` must be `'roast'` or `'congratulate'`. Return HTTP 400 with `{ error: "..." }` on failure.
    - If `OPENAI_API_KEY` (or equivalent env var) is not set, skip the AI call and return a random `fallbackRoasts` entry as `{ message }` with HTTP 200.
    - Otherwise call the AI provider, return `{ message }` on success, or fall back to `fallbackRoasts` on error.
    - _Requirements: 8.3, 8.4, 8.5, 8.7, 8.8_

  - [ ]* 14.3 Write property test for the route handler — Rejects invalid bodies (Property 9)
    - **Property 9: Ghost Roast API validates request body**
    - **Validates: Requirements 8.7, 8.8**

  - [ ]* 14.4 Write property test for the route handler — Accepts valid bodies (Property 10)
    - **Property 10: Ghost Roast API accepts valid request bodies**
    - **Validates: Requirements 8.1, 8.3, 8.5**

  - [ ] 14.5 Implement `ghostRoastClient` in `lib/roast/ghostRoastClient.ts`
    - Export `fetchRoast(req: GhostRoastRequest): Promise<string | null>`.
    - POST to `/api/ghost-roast`, parse the JSON response; return `message` on 200, `null` on any non-2xx status or network error.
    - _Requirements: 8.1, 8.2, 8.5_

- [ ] 15. Checkpoint — Ensure all subsystem tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement Survival Report
  - [ ] 16.1 Implement `SurvivalReport` in `components/report/SurvivalReport.tsx`
    - Render as a native `<dialog>` element (modal).
    - Read all data from `useSession()`: display total focus duration via `toHHMMSS`, list of completed tasks, `slackingOffCount`, and `currentRoast` (falling back to `getRandomRoast()` if `null`).
    - Show only when `sessionEnded === true`.
    - Dismiss button dispatches `END_SESSION`, which the reducer handles by clearing state and resetting the timer.
    - Keyboard-accessible: `<dialog>` natively traps focus; ensure the dismiss button is reachable via Tab.
    - _Requirements: 10.1–10.7, 11.3_

  - [ ]* 16.2 Write property test for `SurvivalReport` — Displays all session data (Property 13)
    - **Property 13: Survival Report displays all session data**
    - **Validates: Requirements 10.2, 10.3, 10.4**

  - [ ]* 16.3 Write snapshot test for `SurvivalReport`
    - Render with a fixed seed `SessionState` and assert the snapshot.
    - _Requirements: 10.1–10.4_

- [ ] 17. Implement `MuteToggle` and `ReduceMotionToggle` UI components
  - `MuteToggle` in `components/ui/MuteToggle.tsx`: toggle button that dispatches `SET_MUTED`; reads `muted` from context; has `aria-label` and keyboard support.
  - `ReduceMotionToggle` in `components/ui/ReduceMotionToggle.tsx`: manual override toggle; when active, sets a CSS class on `<html>` that mirrors `prefers-reduced-motion: reduce` behaviour.
  - _Requirements: 6.4, 6.5, 11.2, 11.3_

- [ ] 18. Implement `StudyBuddyApp` root client component and wire all subsystems
  - Create `components/StudyBuddyApp.tsx` as `'use client'`.
  - Compose `DurationPicker`, `TimerDisplay`, `TaskInput`, `TaskList`, `GhostCompanion`, `RoastBubble`, `HauntOverlay`, `JumpscareFlash`, `SurvivalReport`, `MuteToggle`, and `ReduceMotionToggle`.
  - In `useEffect` hooks:
    - Instantiate and `start()` `VisibilityMonitor` with callbacks that dispatch `SLACK_START` / `SLACK_END` and set ghost state accordingly (`'haunting'` on hidden, `'jumpscare'` briefly then appropriate state on visible).
    - Instantiate and `start()` `IdleDetector` (only while `timerStatus === 'running'`); stop it otherwise.
    - Instantiate `AudioEngine` in a `useRef`; call `start()` when `hauntMode` becomes `true`, `stop()` when it becomes `false`.
    - Instantiate `NotificationService`; call `requestPermission()` on mount; call `notify()` within the `SLACK_START` effect.
    - Call `tabEffects.startTitleFlash` / `stopTitleFlash` and `setCreepyFavicon` / `restoreFavicon` in response to `hauntMode`.
    - After a `SLACK_START` event that has been active for 10 s, call `fetchRoast` and dispatch `SET_ROAST`.
    - On `sessionEnded`, call `fetchRoast` with `mode: 'congratulate'` and dispatch `SET_ROAST`.
    - Show a non-blocking toast when `showCorruptWarning` is `true` from `SessionContext`.
  - _Requirements: 1.1–10.7, 11.1–11.5_

- [ ] 19. Update `app/layout.tsx` and `app/page.tsx`
  - `layout.tsx`: set HTML `lang`, import global Tailwind CSS, add spooky font (e.g. Google Fonts via `next/font`).
  - `page.tsx`: render `<StudyBuddyApp />` wrapped in `SessionProvider`.
  - _Requirements: 11.1_

- [ ] 20. Checkpoint — Ensure full app renders and manual smoke test passes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Implement integration tests
  - [ ]* 21.1 Write integration test — Tab visibility flow
    - Mount `StudyBuddyApp` in jsdom, start the timer, fire `visibilitychange` to `hidden`, assert `hauntMode === true`; fire `visibilitychange` to `visible`, assert `hauntMode === false` and `slackingOffCount === 1`.
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ]* 21.2 Write integration test — Notification permission
    - Mock `Notification.requestPermission`; assert it is called exactly once per mount even when `requestPermission()` is invoked multiple times.
    - _Requirements: 7.1, 7.4_

  - [ ]* 21.3 Write integration test — `/api/ghost-roast` with stubbed AI
    - POST to the route handler in-process with a valid body and no API key configured; assert HTTP 200 and a non-empty `message` string from the fallback set.
    - _Requirements: 8.5, 8.6_

- [ ] 22. Accessibility audit and fixes
  - Verify all interactive elements meet WCAG 2.1 AA colour contrast in the default state (use jest-axe or manual audit).
  - Confirm Tab order reaches every button, input, and toggle.
  - Confirm all images and animated elements have `alt` text or `aria-label`.
  - Confirm `HauntOverlay` glitch animation is ≤ 3 Hz.
  - Confirm `prefers-reduced-motion: reduce` suppresses all animations and the jumpscare.
  - _Requirements: 11.1–11.5_

- [ ] 23. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build.
- Each property test references its property number from `design.md` for traceability.
- Property tests use `fast-check`; unit and integration tests use Jest + React Testing Library.
- Subsystem classes (`VisibilityMonitor`, `IdleDetector`, `AudioEngine`, `NotificationService`) receive callbacks rather than accessing context directly, keeping them pure and independently testable.
- The `localStorageSync` module only persists the fields defined in `PersistedSessionState` (schema version 1); transient fields (`hauntMode`, `ghostState`, etc.) are always recomputed on load.
- All `<dialog>`-based modals use the native element to get focus-trap behaviour for free.
- Tasks marked with `*` are optional and can be skipped for faster MVP.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3"] },
    { "id": 5, "tasks": ["4"] },
    { "id": 6, "tasks": ["5"] },
    { "id": 7, "tasks": ["6.1"] },
    { "id": 8, "tasks": ["6.2", "7.1", "7.2"] },
    { "id": 9, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 10, "tasks": ["9.1", "9.2"] },
    { "id": 11, "tasks": ["10.1", "10.2"] },
    { "id": 12, "tasks": ["11.1", "11.2", "11.3"] },
    { "id": 13, "tasks": ["12.1"] },
    { "id": 14, "tasks": ["12.2", "12.3", "13.1"] },
    { "id": 15, "tasks": ["14.1"] },
    { "id": 16, "tasks": ["14.2"] },
    { "id": 17, "tasks": ["14.3", "14.4", "14.5"] },
    { "id": 18, "tasks": ["15"] },
    { "id": 19, "tasks": ["16.1"] },
    { "id": 20, "tasks": ["16.2", "16.3", "17"] },
    { "id": 21, "tasks": ["18"] },
    { "id": 22, "tasks": ["19"] },
    { "id": 23, "tasks": ["20"] },
    { "id": 24, "tasks": ["21.1", "21.2", "21.3"] },
    { "id": 25, "tasks": ["22"] },
    { "id": 26, "tasks": ["23"] }
  ]
}
```
