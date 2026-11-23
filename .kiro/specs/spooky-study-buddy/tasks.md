# Implementation Plan: Spooky Study Buddy

## Overview

Build in priority order so there is a demoable app at every checkpoint:

1. Timer, tasks, persistence
2. Slack detection, tab title / favicon, audio
3. Notifications carrying the roast
4. Survival Report
5. Ghost animation and accessibility polish

Tasks marked `*` are optional tests that can be deferred.

## Tasks

- [x] 1. Scaffold project
  - Next.js 14 App Router + TypeScript + Tailwind 3, Jest (`next/jest`) + React Testing Library + fast-check.
  - Create `lib/types.ts` with all types from the design's Data Models section.
  - `.env.example` with `ANTHROPIC_API_KEY=`; `.gitignore` covering `.env*.local`, `.next`, `node_modules`.
  - _Requirements: all_

- [x] 2. Core state layer
  - [x] 2.1 `lib/utils/formatTime.ts` — `toMMSS`, `toHHMMSS`.
    - _Requirements: 1.3, 10.2_
  - [x] 2.2 `lib/session/sessionReducer.ts` — all actions in the design; wall-clock timer (`endsAt`); `SLACK_START` counts on start, idempotent, ignored unless running; `FINISH_SESSION`; `DISMISS_REPORT` keeps incomplete tasks.
    - _Requirements: 1.2–1.7, 2.1–2.6, 4.5–4.7, 4.9, 10.1, 10.6_
  - [x] 2.3 `lib/session/selectors.ts` — `elapsedSeconds`, `focusSeconds`, `completedThisSession`, `currentTaskName`, `ghostStateOf`.
    - _Requirements: 3.2–3.6, 8.1, 10.2, 10.3_
  - [x] 2.4 `lib/session/localStorageSync.ts` — `toPersisted`, `fromPersisted`, `isValidPersistedState`, `read`, `write` (v2 schema).
    - _Requirements: 9.1, 9.3, 9.5_
  - [x] 2.5 `lib/session/SessionContext.tsx` — hydration gate, `RESTORE_STATE`, 300 ms debounced write + flush on `pagehide`, `storageWarning`.
    - _Requirements: 9.2–9.5_
  - [x]* 2.6 Unit tests: formatTime, reducer edge cases, localStorageSync.
  - [x]* 2.7 Property tests: Properties 1, 2, 3, 6, 7, 8, 12, 13, 15 (reducer) and 4, 5 (storage).

- [x] 3. Timer + task UI
  - [x] 3.1 `DurationPicker` (slider + number, 1–120, visible only when stopped).
    - _Requirements: 1.1_
  - [x] 3.2 `TimerDisplay` (MM:SS, Start / Pause / Resume / Reset / End Session; 1 s ticker + tick on visibility restore). The Start handler unlocks audio and requests notification permission.
    - _Requirements: 1.1–1.8, 6.7, 7.1, 10.1, 11.3, 11.4_
  - [x] 3.3 `TaskInput` (inline validation), `TaskItem` (checkbox, strike-through, delete), `TaskList` (`<ol>`).
    - _Requirements: 2.1–2.6, 11.3, 11.4_
  - [x] 3.4 `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `StudyBuddyApp` shell with placeholder until hydrated.
    - _Requirements: 9.2, 11.1_

- [x] 4. Checkpoint — timer, tasks, and refresh-restore work in the browser; state tests pass.

- [x] 5. Slack detection + haunt effects
  - [x] 5.1 `VisibilityMonitor`, `IdleDetector` (with `suspend` / `resume`, throttled input).
    - _Requirements: 4.1–4.4, 4.8_
  - [x] 5.2 `useSlackDetection` hook in `StudyBuddyApp`: mounts both only while running; suspends idle while hidden; dispatches `SLACK_START` / `SLACK_END` (jumpscare unless reduced motion).
    - _Requirements: 4.1–4.8, 3.5_
  - [x] 5.3 `tabEffects` — title flash at 1 s; favicon swap to `/favicon-haunted.svg`; restore on end.
    - _Requirements: 5.1–5.3_
  - [x] 5.4 `lib/audio/volume.ts` + `AudioEngine` (synthesised drone + heartbeat, 30 s escalation, 2 s fade, mute, unsupported no-op).
    - _Requirements: 6.1–6.7_
  - [x] 5.5 `HauntOverlay` (red tint + 2 Hz glitch), `JumpscareFlash`, `MuteToggle`.
    - _Requirements: 5.4–5.6, 6.4, 6.5, 11.5_
  - [x]* 5.6 Unit tests: IdleDetector (fake timers). Property test: Property 11.

- [x] 6. Notifications + roasts
  - [x] 6.1 `NotificationService` (permission read live, prompt once per page load only when `'default'`, tag-based replace, click → focus).
    - _Requirements: 7.1–7.6_
  - [x] 6.2 `fallbackRoasts` (≥ 10 taunts, ≥ 5 congratulations, `getFallback(mode)`); `validateRoastRequest`; `rateLimit`.
    - _Requirements: 8.6–8.8, 8.10_
  - [x] 6.3 `app/api/ghost-roast/route.ts` — Claude via `@anthropic-ai/sdk` (`claude-opus-5-5`, effort `low`, server-side refusal fallback), fallback when the key is absent or on error.
    - _Requirements: 8.3–8.5, 8.7–8.10_
  - [x] 6.4 `ghostRoastClient.fetchRoast`; the `useRoasts` hook sends an immediate fallback taunt notification on slack start, fetches the AI roast at 10 s and then sets the bubble and replaces the notification if hidden, and fetches the congratulation on session end.
    - _Requirements: 7.2, 7.6, 8.1, 8.2, 8.4, 8.5_
  - [x] 6.5 `RoastBubble` (`aria-live="polite"`).
    - _Requirements: 8.2_
  - [x]* 6.6 Tests: route Properties 9, 10; ghostRoastClient; fallbackRoasts; NotificationService.

- [x] 7. Survival Report
  - [x] 7.1 `SurvivalReport` `<dialog>` — focus HH:MM:SS, tasks completed this session, slack count, roast or fallback; Dismiss / Escape → `DISMISS_REPORT`.
    - _Requirements: 10.1–10.7, 11.3_
  - [x]* 7.2 Property 14 test (mock `HTMLDialogElement.showModal` in jsdom).

- [ ] 8. Checkpoint — full flow works in a real browser (see the design's manual smoke checklist).

- [x] 9. Ghost + polish
  - [x] 9.1 `GhostCompanion` inline SVG with five CSS animation states, `role="img"` + state-specific `aria-label`.
    - _Requirements: 3.1–3.6, 11.4_
  - [x] 9.2 `ReduceMotionToggle` (sets `data-reduce-motion` on `<html>`, persisted per viewer) + CSS honouring both the toggle and `prefers-reduced-motion`.
    - _Requirements: 11.2_
  - [x] 9.3 `Toast` for `storageWarning`.
    - _Requirements: 9.5_
  - [ ] 9.4 Accessibility pass: contrast (AA), tab order, focus rings, labels, flash rate.
    - _Requirements: 11.1–11.5_
  - [x]* 9.5 Integration tests: visibility flow; idle + hidden produces one event.

- [x] 10. Final checkpoint — `npm test`, `npm run build`, `npm run lint` clean.

## Notes

- Property tests reference property numbers in `design.md`.
- The reducer never calls `Date.now()`. Time arrives in action payloads, which keeps it pure and makes the property tests deterministic.
- Subsystem classes take callbacks rather than reading context, so they can be tested on their own.
- Tasks marked `*` are optional for a faster MVP.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.4", "5.1", "5.3", "5.4", "6.1", "6.2"] },
    { "id": 2, "tasks": ["2.3", "2.5", "2.6", "2.7", "5.6", "6.3"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3", "3.4", "6.4", "6.6"] },
    { "id": 4, "tasks": ["4"] },
    { "id": 5, "tasks": ["5.2", "5.5", "6.5", "7.1"] },
    { "id": 6, "tasks": ["7.2", "8"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 8, "tasks": ["9.4", "9.5"] },
    { "id": 9, "tasks": ["10"] }
  ]
}
```
