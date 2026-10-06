# Feature Specification: Darkroom Triple Timer

**Feature Branch**: `001-triple-timer`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "Build a single page triple timer web application inspired by the functional concept of the Paterson Triple Timer, with an entirely original interface and visual identity. Exactly three user-configurable countdown timers: DEVELOP, STOP, FIX, operated from one screen in a darkroom workflow."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure and run a timer (Priority: P1)

A darkroom user sets a duration (hours, minutes, seconds) for each of DEVELOP, STOP and FIX, then starts a timer and watches it count down accurately to 00:00:00, at which point it is COMPLETED.

**Why this priority**: This is the core value; without it nothing else matters.

**Independent Test**: Set DEVELOP to 00:05:00, start it, and verify the state is RUNNING and remaining time decreases in line with real time until it reaches COMPLETED at 00:00:00.

**Acceptance Scenarios**:

1. **Given** DEVELOP is configured to 00:05:00, **When** the user starts it, **Then** its state becomes RUNNING and remaining time counts down accurately.
2. **Given** a timer has one second remaining, **When** that second elapses, **Then** it shows 00:00:00, enters COMPLETED and never becomes negative.
3. **Given** a timer is configured as 00:00:00, **When** the user attempts to start it, **Then** it does not start and the interface explains what must be corrected.
4. **Given** a duration longer than 59 minutes (e.g. 01:30:00), **When** displayed, **Then** it is shown in HH:MM:SS format.

---

### User Story 2 - Pause, stop, and switch between timers (Priority: P1)

The user controls the workflow: pausing, stopping, resuming, and moving from one timer to the next, with only one timer ever running.

**Why this priority**: Real darkroom use is a sequence of timers; correct hand-over between them is essential.

**Independent Test**: Run DEVELOP, start STOP, and confirm DEVELOP is PAUSED and STOP is RUNNING; then Stop a running timer and Start it again to confirm it continues from its remaining time.

**Acceptance Scenarios**:

1. **Given** DEVELOP is running, **When** the user pauses it, **Then** remaining time freezes; and **When** Start is selected again, **Then** it resumes from that remaining time.
2. **Given** DEVELOP is running, **When** the user starts STOP, **Then** DEVELOP becomes PAUSED and STOP becomes RUNNING.
3. **Given** FIX is running, **When** the user selects Stop, **Then** FIX becomes STOPPED and retains its remaining time, and Start continues from that value.
4. **Given** a timer is PAUSED or STOPPED, **When** viewed, **Then** the two states are visually and semantically distinct.

---

### User Story 3 - Reset and clear safely (Priority: P2)

The user can return a timer to its configured duration (Reset) or empty it entirely (Clear), without accidentally losing progress or settings.

**Why this priority**: Needed to reuse the timers between prints, but secondary to running them.

**Independent Test**: Let STOP partially elapse, Reset it with deliberate confirmation, and verify READY at its configured duration; Clear it and verify READY at 00:00:00.

**Acceptance Scenarios**:

1. **Given** STOP has partially elapsed, **When** the user resets it (and confirms), **Then** it returns to its configured duration and READY.
2. **Given** a timer with a configured duration or elapsed progress, **When** the user selects Clear, **Then** a deliberate confirmation is required before the duration and remaining time are set to 00:00:00 and the timer becomes READY.
3. **Given** a timer in READY with no elapsed progress, **When** the user resets it, **Then** no confirmation is needed.

---

### User Story 4 - Survive refresh and closure (Priority: P2)

Settings and timer states persist in the browser; a running timer reflects real elapsed time after a refresh or after the page was inactive.

**Why this priority**: Accidental refreshes, device sleep, or screen lock must not ruin a timed process.

**Independent Test**: Start DEVELOP, refresh, and verify remaining time reflects real elapsed time; leave a short timer closed past its end and verify COMPLETED at 00:00:00.

**Acceptance Scenarios**:

1. **Given** DEVELOP is running, **When** the page is refreshed, **Then** remaining time reflects actual elapsed real time and it remains RUNNING.
2. **Given** a timer would have reached zero while the page was closed or inactive, **When** the page is reopened, **Then** it is COMPLETED at 00:00:00.
3. **Given** saved data is unreadable or storage is unavailable, **When** the app loads, **Then** it starts with sensible defaults and remains fully usable.

---

### User Story 5 - Completion feedback and sound control (Priority: P3)

On completion the user gets clear visual feedback and an optional sound, which can be muted; the preference persists.

**Why this priority**: Valuable in the dark, but timers work without it.

**Independent Test**: Complete a timer with sound on and off and verify visual feedback in both cases and sound only when unmuted.

**Acceptance Scenarios**:

1. **Given** a timer completes, **When** sound is unmuted and available, **Then** an audible signal plays along with visual feedback.
2. **Given** sound is muted or unavailable, **When** a timer completes, **Then** only visual feedback is shown and the app remains fully usable.
3. **Given** the user mutes sound, **When** the page is refreshed, **Then** the muted preference is retained.

---

### User Story 6 - Use on any device with assistive technology (Priority: P2)

The app is usable on desktop, tablet and mobile with mouse, touch or keyboard, and is understandable to screen-reader users.

**Why this priority**: Required by the project constitution for every feature.

**Independent Test**: Operate every control by keyboard only and at phone, tablet and desktop widths; inspect with a screen reader.

**Acceptance Scenarios**:

1. **Given** a large screen, **When** the app is shown, **Then** all three timers are visible together.
2. **Given** a small screen, **When** the app is shown, **Then** timers may stack vertically while the active timer and its controls stay easy to reach.
3. **Given** a screen reader, **When** navigating, **Then** each timer's name, remaining time, state and controls are identifiable, and remaining time is not announced every second.
4. **Given** reduced-motion is requested, **When** the app animates, **Then** non-essential motion is removed.

### Edge Cases

- Hours, minutes or seconds left empty, non-numeric, negative, decimal, or minutes/seconds above 59: the field is flagged with a clear message and the value is not applied; the timer cannot start until corrected.
- Very large hour values: capped at a documented maximum (see Assumptions) with a clear message.
- Editing while RUNNING: not allowed; fields are disabled until the timer is paused or stopped.
- Editing a PAUSED, STOPPED or COMPLETED timer returns it to READY with the new duration (discarding elapsed progress, with deliberate confirmation if progress would be lost).
- Starting a COMPLETED timer: not possible until it is reset or edited.
- Persisted data shows more than one RUNNING timer: only one (the most recently started) is restored as running; others are restored as PAUSED.
- Device clock changes backwards between sessions: remaining time never increases above what was saved and never goes negative.
- Two tabs open on the same data: the last interaction wins; the app must not show negative or inconsistent time.

## Requirements *(mandatory)*

### Functional Requirements

**Presentation**
- **FR-001**: The app MUST show exactly three timers, labelled DEVELOP, STOP and FIX, together on one page.
- **FR-002**: Each timer MUST display its label, configured duration, remaining time and current state.
- **FR-003**: Supported states MUST be READY, RUNNING, PAUSED, STOPPED and COMPLETED, each shown with text (not colour alone).
- **FR-004**: Remaining time MUST be shown as HH:MM:SS, supporting hours beyond 59 minutes.
- **FR-005**: A timer reaching zero MUST stop at 00:00:00 and become COMPLETED; remaining time MUST never be negative.

**Configuration**
- **FR-006**: Each timer MUST be independently configurable in hours, minutes and seconds.
- **FR-007**: Inputs MUST accept whole numbers only; minutes and seconds MUST be 0–59.
- **FR-008**: Invalid or incomplete input MUST be indicated clearly with an explanatory message, and MUST NOT be applied.
- **FR-009**: A 00:00:00 duration MUST NOT be startable, and the interface MUST explain what to correct.
- **FR-010**: Users MUST be able to edit a timer only while it is not running.
- **FR-011**: Editing a valid duration MUST return that timer to READY with the new duration.

**Start / Pause / Stop**
- **FR-012**: Start MUST begin a READY timer and resume a PAUSED or STOPPED timer from its remaining time.
- **FR-013**: At most one timer MAY be RUNNING; starting a different timer MUST first pause the running one.
- **FR-014**: Pause MUST freeze remaining time without restoring the configured duration, and the timer MAY later resume.
- **FR-015**: Stop MUST freeze remaining time and mark the timer STOPPED without resetting it; Start MUST continue from the stopped value.
- **FR-016**: Stop and Pause MUST be visually and semantically distinct.

**Reset / Clear**
- **FR-017**: Reset MUST stop the timer, restore remaining time to the configured duration, retain the configured duration, and set READY.
- **FR-018**: Clear MUST stop the timer, set both configured duration and remaining time to 00:00:00, and set READY.
- **FR-019**: Reset and Clear MUST require deliberate confirmation when they would discard elapsed progress (Reset) or a configured duration or elapsed progress (Clear).

**Persistence**
- **FR-020**: Configured durations, remaining times and states MUST persist across page refresh in the same browser, with no account.
- **FR-021**: Restoring a RUNNING timer MUST compute remaining time from real elapsed time; if it would have reached zero it MUST restore as COMPLETED at 00:00:00.
- **FR-022**: At most one persisted timer MAY be restored as RUNNING.
- **FR-023**: Corrupt, incompatible or unavailable stored data MUST fall back safely to defaults without blocking use.

**Completion feedback**
- **FR-024**: Completion MUST produce clear visual feedback.
- **FR-025**: An optional audible signal MUST be provided, with a mute/unmute control whose state persists.
- **FR-026**: The app MUST be fully usable with sound muted or unavailable and MUST NOT require browser notifications.

**Responsive & accessible**
- **FR-027**: The app MUST be usable on desktop, tablet and mobile; timers are visible together on large screens and MAY stack on small screens while keeping active controls easy to reach.
- **FR-028**: All controls MUST work with mouse, touch and keyboard, with logical focus order and visible focus.
- **FR-029**: Every input and control MUST have an accessible name; screen readers MUST be able to identify each timer, its remaining time, state and controls.
- **FR-030**: Remaining time MUST NOT be announced every second; state changes and completion MUST be announced.
- **FR-031**: Reduced-motion preferences MUST be respected.

**Out of scope**: accounts, cloud sync, backend services, multiple saved presets, stopwatch/count-up, laps, analytics/telemetry, sharing between devices, push notifications, native mobile apps.

### Key Entities

- **Timer**: one of DEVELOP, STOP or FIX; has a configured duration, remaining time, and state.
- **Duration**: hours, minutes, seconds, convertible to a total of whole seconds.
- **Timer State**: READY, RUNNING, PAUSED, STOPPED or COMPLETED.
- **Saved Session**: the persisted durations, remaining times, states, the running timer's reference time, and the mute preference.
- **Preferences**: sound muted or unmuted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can configure all three timers and start the first in under 30 seconds.
- **SC-002**: Over a 60-minute run, displayed remaining time deviates from real elapsed time by no more than 1 second, including after the tab was inactive or the device slept.
- **SC-003**: After a refresh, a running timer's remaining time is within 1 second of the true value in 100% of cases.
- **SC-004**: Switching from one running timer to another takes a single action and never leaves two timers running.
- **SC-005**: 100% of invalid inputs and zero-duration start attempts show an explanatory message and change no timer state.
- **SC-006**: Every function is operable by keyboard alone, and all interactive elements meet WCAG 2.2 AA contrast and target-size requirements at phone, tablet and desktop widths.
- **SC-007**: Screen-reader users receive state and completion announcements but no per-second countdown announcements.
- **SC-008**: Unavailable storage or sound leaves the app fully usable.

## Assumptions

- Stop is available while a timer is RUNNING or PAUSED; Pause is available while RUNNING.
- Clear sets the configured duration to 00:00:00 (the description says it "changes" both values; empty is assumed).
- A reasonable maximum of 99 hours applies to the hours field.
- Confirmation for Reset, Clear, and edits that discard progress uses a deliberate interaction (e.g. confirm step or press-and-hold), chosen at design time.
- A persisted RUNNING timer restored on reload keeps counting; if more than one is persisted, the most recently started wins and others become PAUSED.
- Users have a modern evergreen browser with local storage available in normal use; the app remains usable without it.
- Completion visual feedback persists until the user acknowledges or interacts with the timer.
- Original visual identity and the project constitution govern all design and quality decisions.
