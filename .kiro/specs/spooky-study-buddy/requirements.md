# Requirements Document

## Introduction

Spooky Study Buddy is a browser-based productivity application built with Next.js 14+ (App Router), TypeScript, and Tailwind CSS. It uses a Halloween/horror aesthetic to keep users focused during study sessions. The app pairs a Pomodoro-style timer and task list with cross-tab slacking-off detection, escalating spooky consequences for procrastination, AI-generated ghost roasts, and an end-of-session survival report. All session state is persisted in localStorage so the experience survives page refreshes.

## Glossary

- **App**: The Spooky Study Buddy Next.js web application.
- **Timer**: The countdown timer component that tracks a user's active study interval.
- **Task**: A named study goal the user enters before or during a session.
- **Session**: A continuous study period from timer start to timer completion or manual stop.
- **Ghost_Companion**: The animated character rendered on screen that reacts to timer and focus states.
- **Haunt_Mode**: The state the App enters when slacking-off is detected, triggering visual, audio, and notification effects.
- **Slacking_Off_Event**: An occurrence where the user switches away from the tab or becomes idle, incrementing the haunted count.
- **Idle_Detector**: The subsystem that monitors mouse and keyboard inactivity to detect user idleness.
- **Visibility_Monitor**: The subsystem that uses the Page Visibility API to detect tab switches.
- **Notification_Service**: The subsystem that requests permission from and dispatches browser desktop notifications via the Web Notifications API.
- **Audio_Engine**: The subsystem that synthesises an eerie drone and heartbeat in code using the Web Audio API (no audio asset files).
- **Ghost_Roast_API**: The Next.js API route at `/api/ghost-roast` that calls the Anthropic Claude API to generate spooky, witty remarks.
- **Focus_Duration**: Elapsed session time minus the total time spent in Slacking_Off_Events.
- **Roast_Fallback**: A locally bundled set of pre-written spooky lines used when no AI API key is configured.
- **Survival_Report**: The end-of-session modal summarising focus duration, completed tasks, and total slacking-off events.
- **LocalStorage_Store**: The browser localStorage key-value store used for all session persistence.

---

## Requirements

### Requirement 1: Pomodoro Timer

**User Story:** As a student, I want to set a countdown timer for my study session, so that I can track focused work intervals and know when to take a break.

#### Acceptance Criteria

1. THE Timer SHALL accept a user-specified duration between 1 minute and 120 minutes before a session starts.
2. WHEN the user starts the Timer, THE Timer SHALL begin counting down from the specified duration in one-second decrements, measured against wall-clock time (an end timestamp) so that background-tab timer throttling does not cause drift.
3. WHILE the Timer is counting down, THE Timer SHALL display the remaining time in MM:SS format.
4. WHEN the Timer reaches zero, THE App SHALL transition the session to a completed state and display the Survival_Report, including when the tab is hidden at that moment.
5. WHEN the user pauses the Timer, THE Timer SHALL stop decrementing and retain the remaining time.
6. WHEN the user resumes a paused Timer, THE Timer SHALL continue counting down from the retained remaining time.
7. WHEN the user resets the Timer, THE Timer SHALL return to the user-specified duration and enter a stopped state.
8. THE LocalStorage_Store SHALL persist the current timer duration, remaining time, and running/paused/stopped state so that a page refresh restores the session exactly.

---

### Requirement 2: Task List

**User Story:** As a student, I want to create and manage study tasks alongside my timer, so that I can track what I am working on and mark tasks complete.

#### Acceptance Criteria

1. THE App SHALL allow the user to add one or more named tasks before or during a session.
2. WHEN the user adds a task, THE App SHALL display the task in an ordered list immediately.
3. WHEN the user marks a task as complete, THE App SHALL visually distinguish the completed task from incomplete tasks.
4. THE LocalStorage_Store SHALL persist the full task list, including completion state, so that a page refresh restores all tasks.
5. WHEN the user deletes a task, THE App SHALL remove it from the list immediately and update the LocalStorage_Store.
6. IF the user attempts to add a task with an empty name, THEN THE App SHALL reject the submission and display an inline validation message.

---

### Requirement 3: Ghost Companion Animation

**User Story:** As a student, I want an animated ghost character on screen that reacts to my study state, so that I feel engaged and get immediate visual feedback about my focus.

#### Acceptance Criteria

1. THE Ghost_Companion SHALL be visible on screen at all times while the App is open.
2. WHILE the Timer is counting down and the user is focused, THE Ghost_Companion SHALL display a calm, friendly study animation.
3. WHILE the Timer is stopped or paused and no session is active, THE Ghost_Companion SHALL display an idle animation.
4. WHEN Haunt_Mode is active, THE Ghost_Companion SHALL display a haunting animation distinct from the calm and idle states.
5. WHEN the user returns to the tab after a Slacking_Off_Event, THE Ghost_Companion SHALL play a jumpscare animation before returning to the appropriate state.
6. WHEN the Timer reaches zero, THE Ghost_Companion SHALL display a celebratory animation.

---

### Requirement 4: Cross-Tab Slacking-Off Detection

**User Story:** As a student, I want the app to detect when I switch away from the tab or stop interacting, so that it can remind me to get back to studying.

#### Acceptance Criteria

1. WHILE the Timer is running, WHEN the user navigates away from the App tab, THE Visibility_Monitor SHALL detect the tab switch within 500 ms and record a Slacking_Off_Event.
2. WHEN the user returns to the App tab after a Slacking_Off_Event, THE Visibility_Monitor SHALL end the Slacking_Off_Event and trigger the return-to-tab effects.
3. WHILE the Timer is running, the tab is visible, and no mouse, keyboard, scroll, or touch input is received for 60 consecutive seconds, THE Idle_Detector SHALL record a Slacking_Off_Event.
4. WHEN the user produces input after an idle Slacking_Off_Event, THE Idle_Detector SHALL end the Slacking_Off_Event.
5. THE App SHALL increment the cumulative Slacking_Off_Event count at the moment an event begins (not when it ends), so events are counted even if the tab is closed or refreshed mid-event, and SHALL persist the count in LocalStorage_Store.
6. IF the Timer is not running (stopped or paused), THEN THE Visibility_Monitor and Idle_Detector SHALL remain inactive and SHALL NOT record Slacking_Off_Events.
7. IF a Slacking_Off_Event is already active, THEN a second detection (from either detector) SHALL NOT start or count another event.
8. WHILE the tab is hidden, THE Idle_Detector SHALL be suspended, since the browser delivers no input events to hidden tabs.
9. THE App SHALL accumulate the total duration of all Slacking_Off_Events in the current session.

---

### Requirement 5: Haunt Mode Visual Effects

**User Story:** As a student, I want dramatic visual effects when I am slacking off, so that I am strongly compelled to return to studying.

#### Acceptance Criteria

1. WHEN a Slacking_Off_Event begins, THE App SHALL change the browser tab title to a flashing sequence alternating between the normal title and "👁️ I SEE YOU SLACKING..." at an interval of 1 second.
2. WHEN a Slacking_Off_Event begins, THE App SHALL replace the browser favicon with a creepy red icon.
3. WHEN the user returns to the tab after a Slacking_Off_Event, THE App SHALL restore the normal tab title and favicon within 500 ms.
4. WHEN a Slacking_Off_Event begins, THE App SHALL apply a CSS screen-glitch animation to the page.
5. WHEN the user returns to the tab after a Slacking_Off_Event, THE App SHALL play the Ghost_Companion jumpscare animation before transitioning to the normal visual state.
6. WHILE Haunt_Mode is active, THE App SHALL apply a persistent red-tint overlay to the viewport.

> Note: criteria 4 and 6 are only perceptible during idle Slacking_Off_Events (tab still visible). For tab-switch events the user-visible channels are the tab title, favicon, audio, and desktop notification (Requirements 5.1–5.2, 6, 7).

---

### Requirement 6: Haunt Mode Audio Effects

**User Story:** As a student, I want escalating eerie sounds while I am slacking off, so that the app creates an uncomfortable sense of urgency to return to studying.

#### Acceptance Criteria

1. WHEN a Slacking_Off_Event begins, THE Audio_Engine SHALL begin playing an eerie ambient audio track.
2. WHILE a Slacking_Off_Event is active, THE Audio_Engine SHALL increase the audio volume by 10% every 30 seconds, up to a maximum of 100% volume.
3. WHEN the user returns to the tab after a Slacking_Off_Event, THE Audio_Engine SHALL fade the audio out within 2 seconds and then stop playback.
4. THE App SHALL provide a mute toggle that the user can activate at any time to silence all Audio_Engine output.
5. WHEN the mute toggle is active, THE Audio_Engine SHALL remain silent regardless of session or Haunt_Mode state.
6. IF the browser does not support the Web Audio API, THEN THE Audio_Engine SHALL disable itself silently and the App SHALL continue without audio.
7. THE Audio_Engine SHALL be created or resumed inside the user's Start-button click handler, so that browser autoplay policies permit later playback while the tab is hidden.

---

### Requirement 7: Browser Desktop Notifications

**User Story:** As a student, I want the app to send me a desktop notification when I am slacking off, so that I am alerted even when I am not looking at the screen.

#### Acceptance Criteria

1. WHEN the user clicks Start for the first time, THE Notification_Service SHALL request the user's permission to display browser desktop notifications (browsers block or suppress permission prompts that are not triggered by a user gesture).
2. IF the user grants notification permission, THEN THE Notification_Service SHALL send a desktop notification within 5 seconds of a Slacking_Off_Event beginning.
3. THE desktop notification SHALL include a spooky message and a title of "👻 Your Ghost Buddy is watching…".
4. IF the user has already granted or denied permission (as reported by the browser's `Notification.permission`), THEN THE Notification_Service SHALL NOT request permission again.
5. WHEN the user clicks the desktop notification, THE App tab SHALL be brought to focus and the notification closed.
6. WHEN an AI roast arrives while the tab is hidden, THE Notification_Service SHALL send it as a desktop notification that replaces the earlier one for the same event.

---

### Requirement 8: AI Ghost Roasts

**User Story:** As a student, I want witty, spooky AI-generated taunts when I am procrastinating, so that I feel genuinely called out and motivated to get back to work.

#### Acceptance Criteria

1. WHEN a Slacking_Off_Event has been active for 10 seconds, THE Ghost_Roast_API SHALL be called with the current task name (the first incomplete task, or "your studies" if there is none) and slacking duration as context.
2. WHEN the Ghost_Roast_API returns a successful response, THE App SHALL display the roast message in the Ghost_Companion speech bubble within 500 ms of receiving the response, and SHALL also deliver it as a desktop notification if the tab is hidden (Requirement 7.6).
3. THE Ghost_Roast_API SHALL generate roast messages that reference the current task name and adopt a spooky, witty persona.
4. WHEN the user completes a session (Timer reaches zero), THE Ghost_Roast_API SHALL be called to generate an encouraging, spooky congratulatory remark.
5. IF the Ghost_Roast_API request fails or no API key is configured, THEN THE App SHALL display a randomly selected message from the Roast_Fallback set.
6. THE Roast_Fallback set SHALL contain at least 10 procrastination taunts and at least 5 session-completion encouragements, kept in separate lists, and fallback selection SHALL match the requested mode.
7. THE Ghost_Roast_API route SHALL validate that the incoming request body contains a non-empty task name string of at most 200 characters, a non-negative finite slacking duration number, and a mode of `roast` or `congratulate` before calling the AI provider.
8. IF the Ghost_Roast_API receives an invalid request body, THEN THE route SHALL return an HTTP 400 response with a descriptive error message.
9. THE Ghost_Roast_API SHALL read its key from the `ANTHROPIC_API_KEY` server environment variable and SHALL never expose it to the client.
10. THE Ghost_Roast_API SHALL rate-limit requests per client IP (default 10 per minute) and SHALL return HTTP 429 when the limit is exceeded; the client SHALL treat 429 like any other failure and use the Roast_Fallback.

---

### Requirement 9: Session Persistence

**User Story:** As a student, I want my session state saved automatically, so that a page refresh or accidental tab close does not lose my progress.

#### Acceptance Criteria

1. THE LocalStorage_Store SHALL persist the timer duration, remaining time, timer end timestamp, running/paused/stopped state, task list, task completion states and timestamps, cumulative Slacking_Off_Event count, total slacking duration, mute state, and whether the session has ended (so a refresh while the Survival_Report is open restores it).
2. WHEN the App loads, THE App SHALL read the LocalStorage_Store and restore all persisted session state before rendering the interactive UI; until restoration completes, a lightweight placeholder SHALL be rendered so that server-rendered and client-rendered markup match.
3. WHEN any session state changes, THE App SHALL write the updated state to LocalStorage_Store within 500 ms of the change.
4. WHEN the user starts a new session after a previous session has ended, THE App SHALL clear the previous session's state from LocalStorage_Store.
5. IF the LocalStorage_Store contains malformed or incompatible data, THEN THE App SHALL discard the corrupted data, initialise a clean session state, and display a non-blocking warning to the user.

---

### Requirement 10: Survival Report

**User Story:** As a student, I want a summary of my session when I finish, so that I can see how focused I was and feel rewarded for completing my study time.

#### Acceptance Criteria

1. WHEN a session ends (Timer reaches zero or user activates an "End Session" button, available while the Timer is running or paused), THE App SHALL display the Survival_Report modal.
2. THE Survival_Report SHALL display the Focus_Duration in HH:MM:SS format.
3. THE Survival_Report SHALL display the list of tasks whose completion timestamp falls within the session.
4. THE Survival_Report SHALL display the total number of Slacking_Off_Events recorded during the session.
5. WHEN the Survival_Report is displayed, THE Ghost_Companion SHALL display the celebratory animation.
6. WHEN the user dismisses the Survival_Report, THE App SHALL return to the initial state with the timer reset, session counters zeroed, completed tasks removed, and incomplete tasks kept for the next session.
7. THE Survival_Report SHALL include the AI-generated congratulatory remark from the Ghost_Roast_API (or a Roast_Fallback message if the API is unavailable).

---

### Requirement 11: Accessibility and Usability

**User Story:** As a student with accessibility needs, I want the app to remain usable with keyboard navigation and sufficient colour contrast, so that I am not excluded by the horror aesthetic.

#### Acceptance Criteria

1. THE App SHALL meet WCAG 2.1 Level AA colour contrast requirements for all text and interactive elements in the default (non-Haunt_Mode) state.
2. THE App SHALL provide a "Reduce Motion" mode that disables CSS animations and the Ghost_Companion jumpscare when the user's OS-level `prefers-reduced-motion` media feature is set to `reduce`.
3. THE App SHALL be fully operable using keyboard navigation alone, with all interactive elements reachable via Tab and activatable via Enter or Space.
4. ALL images and animated elements SHALL have descriptive `alt` text or `aria-label` attributes.
5. WHEN Haunt_Mode flashing effects are active, THE App SHALL limit the flash frequency to no more than 3 flashes per second to meet WCAG 2.3.1 (seizure safety).
