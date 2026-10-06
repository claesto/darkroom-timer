# Tasks: Darkroom Timer

**Input**: Design documents from `specs/001-triple-timer/`

**Prerequisites**: `plan.md`, `spec.md`; supporting decisions in `research.md`, `data-model.md`,
and runnable scenarios in `quickstart.md`.

**Tests**: Tests are included because the constitution and specification explicitly require
automated timer-domain tests and interaction coverage. Write domain tests before their implementation.

**Organization**: Tasks are grouped by the six user stories in `spec.md`. Each phase has a
standalone verification checkpoint; later stories build on the shared application created earlier.

## Format: `- [ ] [TaskID] [P?] [Story?] Description`

- **[P]** means the task uses files separate from other simultaneously runnable tasks and has no
  dependency on unfinished work.
- **[Story]** maps story-phase tasks to `spec.md`.
- Each task lists target files and a measurable completion condition.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the static React application and quality tooling.

- [ ] T001 Initialize the npm project in `package.json` with React, React DOM, TypeScript, Vite, Lucide React, Vitest, React Testing Library, Playwright, ESLint, and Prettier; include scripts for dev, build, preview, lint, format check, typecheck, unit tests, component tests, and e2e tests; validation: `npm install` resolves and each script has an executable command.
- [ ] T002 [P] Configure strict browser TypeScript settings in `tsconfig.json` and `tsconfig.app.json`; include `strict`, `noEmit`, and DOM libraries; validation: `npx tsc --noEmit` succeeds for the starter app and rejects implicit `any`.
- [ ] T003 [P] Configure Vite entry/build and project Pages base `/darkroom-timer/` in `vite.config.ts`, `index.html`, and `src/main.tsx`; validation: `npm run build` emits `dist/index.html` with app asset URLs under `/darkroom-timer/`.
- [ ] T004 [P] Configure ESLint and Prettier in `eslint.config.js` and `.prettierrc.json`; validation: `npm run lint` and `npm run format:check` pass on the starter files.
- [ ] T005 [P] Configure Vitest and Testing Library setup in `vitest.config.ts` and `tests/setup.ts`; validation: `npm run test` discovers and passes a minimal test without browser dependencies.
- [ ] T006 [P] Configure Playwright browser test runner in `playwright.config.ts`; validation: `npm run test:e2e -- --list` discovers the e2e directory without running a test.

**Checkpoint**: `npm run dev` serves the starter page, and lint, format, typecheck, unit-test and build scripts run successfully.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create shared typed domain/state primitives and styling tokens required by all stories.

- [ ] T007 Define shared design tokens and baseline page styles in `src/styles/tokens.css` and `src/styles/global.css`; validation: starter page uses local CSS, dark background, readable contrast, visible focus treatment, and no external hosted assets.
- [ ] T008 Define `TimerId`, `TimerStatus`, `DurationSeconds`, timer record and application state types in `src/domain/timer.ts`; validation: TypeScript permits exactly DEVELOP/STOP/FIX identities and the five specified states.
- [ ] T009 Define deterministic action types and reducer boundary in `src/domain/transitions.ts`; validation: reducer accepts explicit clock inputs and contains no React or browser storage imports.
- [ ] T010 Create fixed default records and ordering for exactly three timers in `src/domain/defaultState.ts`; validation: defaults contain one DEVELOP, one STOP, and one FIX timer, with no running timer.

**Checkpoint**: Domain types/default state are strict-typechecked, the starter app runs, and shared styles load locally.

## Phase 3: User Story 1 - Configure and Run a Timer (Priority: P1) 🎯 MVP

**Goal**: Configure each timer and accurately run a countdown to zero.

**Independent Test**: Set DEVELOP to `00:00:05`, start it, verify RUNNING/countdown, then verify
COMPLETED at `00:00:00`. Verify zero duration cannot start and `01:30:00` displays correctly.

### Tests for User Story 1

- [ ] T011 [P] [US1] After T008, add duration conversion, validation, and `HH:MM:SS` formatting tests in `tests/unit/duration.test.ts`; assert whole-number inputs, hours 0–99, minutes/seconds 0–59, zero handling, long durations, and non-negative formatting; validation: tests fail until T013 is complete.
- [ ] T012 [P] [US1] After T008-T009, add domain transition tests for READY start, completion at deadline, zero-duration rejection, and non-negative remaining time in `tests/unit/transitions.test.ts`; inject timestamps instead of waiting; validation: tests fail until T014 is complete.

### Implementation for User Story 1

- [ ] T013 [US1] After T011, implement duration parsing/validation, total-seconds conversion, and zero-padded formatting in `src/domain/duration.ts`; accept integer hours 0–99 and minutes/seconds 0–59; reject incomplete, negative, decimal, out-of-range, and zero-start durations; validation: all T011 cases pass and formatting supports hours through 99.
- [ ] T014 [US1] After T012-T013, implement READY start and timestamp-derived completion in `src/domain/transitions.ts`; store configured and remaining durations as non-negative integer seconds and transition at deadline to COMPLETED exactly once; validation: all T012 cases pass with injected time and remaining duration never falls below zero.
- [ ] T015 [P] [US1] After T008, build semantic `TimeDisplay` and `DurationEditor` components in `src/components/TimeDisplay.tsx` and `src/components/DurationEditor.tsx`; label hour/minute/second inputs and expose field errors; validation: Testing Library can locate every input by accessible name and invalid values are explained without applying them.
- [ ] T016 [US1] After T014-T015, build `TimerCard` and `TimerGrid` for the three fixed timers in `src/components/TimerCard.tsx` and `src/components/TimerGrid.tsx`; display label, configured duration, remaining time and textual state; validation: exactly three cards are rendered in DEVELOP/STOP/FIX order.
- [ ] T017 [US1] After T010, T014, and T016, implement the initial app shell and connect duration edits and Start to domain state in `src/App.tsx`, `src/app/timerContext.tsx`, and `src/main.tsx`; validation: user can configure and start any nonzero timer, while 00:00:00 remains unstartable with a clear message.
- [ ] T018 [US1] After T017, add focused UI tests for configuring, starting, invalid/zero input, and visible countdown state in `tests/components/TimerCard.test.tsx`; validation: tests exercise controls by accessible role/name and pass against T015–T017.

**Checkpoint**: The runnable app supports all three configurable timers, countdown, accurate completion and zero-duration rejection without persistence.

## Phase 4: User Story 2 - Pause, Stop, and Switch Timers (Priority: P1)

**Goal**: Pause, stop, resume, and switch timers without ever running more than one.

**Independent Test**: Start DEVELOP, start STOP and verify DEVELOP is PAUSED while STOP is RUNNING;
pause/resume STOP, stop it, and verify Start continues from its frozen remainder.

### Tests for User Story 2

- [ ] T019 [P] [US2] Extend transition tests in `tests/unit/transitions.test.ts` for pause, resume from PAUSED/STOPPED, stop, and switching timers; validation: assert one RUNNING maximum after every action and frozen remaining values on pause/stop.

### Implementation for User Story 2

- [ ] T020 [US2] Implement PAUSED, STOPPED, resume, and atomic timer-switch actions in `src/domain/transitions.ts`; Starting a different timer first pauses the current RUNNING timer, and Stop retains the reconciled remaining duration; validation: T019 passes and all five status states have explicit transition behavior.
- [ ] T021 [US2] Implement state-aware Start, Pause, and secondary Stop controls in `src/components/TimerControls.tsx` and integrate them with `src/components/TimerCard.tsx`; validation: Start appears for READY/PAUSED/STOPPED, Pause only for RUNNING, and Stop is distinct from Pause.
- [ ] T022 [US2] Add interaction tests for pause/resume, stop/continue, and switching in `tests/components/TimerCard.test.tsx`; validation: accessible user actions yield the required states and only one timer is RUNNING.

**Checkpoint**: Timer switching, pausing, stopping and continuation behave deterministically and are interaction-tested.

## Phase 5: User Story 3 - Reset and Clear Safely (Priority: P2)

**Goal**: Restore configured duration or clear it without accidental loss of meaningful progress.

**Independent Test**: Advance STOP, cancel then confirm Reset and verify READY at the configured time;
Clear a configured timer and verify READY at zero.

### Tests for User Story 3

- [ ] T023 [P] [US3] Add reset and clear transition tests in `tests/unit/transitions.test.ts`; validate reset retains configured duration and clear sets configured/remaining to zero, both ending READY; validation: tests fail before T024.
- [ ] T024 [P] [US3] Add confirmation interaction tests in `tests/components/ConfirmActionDialog.test.tsx`; verify cancel preserves state, confirm performs the action, and no confirmation appears when nothing meaningful would be discarded; validation: tests fail before T025.

### Implementation for User Story 3

- [ ] T025 [US3] Implement Reset and Clear transitions in `src/domain/transitions.ts`; Reset sets remaining to configured duration and READY, Clear sets both durations to zero and READY; validation: T023 passes for READY, RUNNING, PAUSED, STOPPED, and COMPLETED inputs.
- [ ] T026 [US3] Implement accessible native confirmation dialog with a tested semantic fallback in `src/components/ConfirmActionDialog.tsx`; provide named Confirm and Cancel actions and return focus to the invoking control; validation: keyboard open/close, focus return, and cancellation pass T024.
- [ ] T027 [US3] Add Reset/Clear controls and deliberate-confirmation rules to `src/components/TimerControls.tsx` and `src/components/TimerCard.tsx`; ask confirmation only when progress/duration would be discarded; validation: T024 passes and confirmed actions produce T025 states.

**Checkpoint**: Reset/Clear are distinct, safe, and leave configured durations and progress correct after confirm or cancel.

## Phase 6: User Story 4 - Persist and Recover Timer State (Priority: P2)

**Goal**: Preserve configuration and recover running timers against real elapsed time after refresh,
closure, throttling, sleep, and visibility changes.

**Independent Test**: Start DEVELOP, wait or advance controlled time, reload, and verify remaining
time matches the deadline; reload after deadline and verify COMPLETED at zero. Simulate invalid and
unavailable storage and confirm app remains usable.

### Tests for User Story 4

- [ ] T028 [P] [US4] Add version, schema, numeric-range, timer-identity, and malformed-data tests in `tests/unit/persistence.test.ts`; include unsupported versions and multiple RUNNING records; validation: invalid state is rejected or safely normalized according to `src/domain/persistence.ts` rules.
- [ ] T029 [P] [US4] Add deadline restore and elapsed-time reconciliation tests in `tests/unit/transitions.test.ts`; cover passed deadline, hidden-tab-sized elapsed jump, backwards wall-clock movement, and one-running invariant; validation: deterministic injected timestamps produce clamped correct states.
- [ ] T030 [P] [US4] Add storage adapter failure tests in `tests/unit/localStorageAdapter.test.ts`; make get/set throw and verify in-memory defaults/state remain usable; validation: no storage exception escapes the adapter.

### Implementation for User Story 4

- [ ] T031 [US4] Implement pure persisted-state validation and restoration in `src/domain/persistence.ts`; schema version is 1, IDs are exactly DEVELOP/STOP/FIX, statuses are exactly READY/RUNNING/PAUSED/STOPPED/COMPLETED, durations are integers 0–356400, remaining is 0–configured, and at most one timer is RUNNING; unsupported/corrupt state falls back safely; validation: T028 passes.
- [ ] T032 [US4] Implement a one-key versioned localStorage adapter in `src/storage/localStorageAdapter.ts`; catch get/set failures and store configured durations, remaining durations, states, running deadline/reference, schema version, and sound preference; validation: T030 passes and malformed input does not escape as an exception.
- [ ] T033 [US4] Implement restore-time deadline reconciliation and multiple-running recovery in `src/domain/transitions.ts` and `src/domain/persistence.ts`; use wall-clock epoch timestamps for reload recovery, never restore remaining above the saved snapshot after a backward clock change, complete at zero, and retain only the most recently started timer as RUNNING; validation: T029 passes.
- [ ] T034 [US4] Integrate state initialization and persistence in `src/app/timerContext.tsx`; hydrate validated state before first interactive use and persist each committed state update; validation: refresh restores configured/state data and app still operates when storage is unavailable.
- [ ] T035 [US4] Implement active monotonic clock refresh and focus/visibility reconciliation in `src/app/useTimerClock.ts` and `src/app/timerContext.tsx`; interval ticks only refresh presentation, and visible/focus events reconcile immediately; validation: simulated throttling and visibility return produce deadline-derived remaining time rather than tick-count time.
- [ ] T036 [US4] Add persistence/restore integration tests in `tests/components/persistence.test.tsx`; cover refresh hydration, completion while closed, sound preference round-trip, corrupt storage, and denied storage; validation: all listed recovery cases pass without a backend.

**Checkpoint**: Timers and preferences survive refresh, running time reconciles from timestamps, and unavailable/corrupt storage does not block use.

## Phase 7: User Story 5 - Completion Feedback and Sound Preference (Priority: P3)

**Goal**: Provide clear visual completion feedback and an optional, persisted local audible signal.

**Independent Test**: Complete a timer with sound enabled and disabled; visual completion is always
clear, signal plays only when enabled and available, and each completion transition signals once.

### Tests for User Story 5

- [ ] T037 [P] [US5] Add tests for one-time completion effect requests and sound preference changes in `tests/unit/transitions.test.ts`; validation: reconciliation/rerender of an already-completed timer does not request a second signal.
- [ ] T038 [P] [US5] Add audio utility tests in `tests/unit/completionSignal.test.ts`; cover local generation, muted suppression, and unavailable/throwing Web Audio; validation: audio errors never alter completed timer state.

### Implementation for User Story 5

- [ ] T039 [US5] Implement local optional completion signal via Web Audio API in `src/audio/completionSignal.ts`; initialize/resume only after a user gesture and handle unavailable audio without throwing into timer state; validation: signal generation has no network requests and failure leaves completion intact.
- [ ] T040 [US5] Implement persisted mute/unmute control in `src/components/SoundPreference.tsx` and `src/app/timerContext.tsx`; expose an accessible label and store preference through the versioned state adapter; validation: preference survives reload and can be operated by keyboard.
- [ ] T041 [US5] Connect one-time completion transition events to visual feedback, a polite live announcement, and audio in `src/app/timerContext.tsx` and `src/components/TimerCard.tsx`; do not replay on restoring already-COMPLETED state; validation: T037–T038 pass and each live timer completion produces one signal request.

**Checkpoint**: Completion is prominent and announced, optional audio is local, deduplicated, and mute preference persists.

## Phase 8: User Story 6 - Responsive and Accessible Use (Priority: P2)

**Goal**: Make the full timer interface usable on desktop, tablet, and mobile with keyboard and
assistive technology.

**Independent Test**: Complete all timer operations using keyboard only, verify accessible names
and state/completion announcements, then inspect wide and narrow layouts and reduced-motion mode.

### Tests for User Story 6

- [ ] T042 [P] [US6] Add keyboard and accessibility behavior tests in `tests/components/accessibility.test.tsx`; cover accessible names, logical focus, visible state text, no per-second live announcements, completion/state announcement, and reduced-motion setting; validation: tests fail when an input/control is unnamed or countdown display is placed in a per-second live region.
- [ ] T043 [P] [US6] Add Playwright responsive and keyboard smoke tests in `tests/e2e/accessibility-responsive.spec.ts`; verify all three timers, keyboard start/control use, and narrow viewport reachability; validation: tests pass at mobile and desktop viewport sizes.

### Implementation for User Story 6

- [ ] T044 [US6] Complete semantic grouping, labels/descriptions, live-region behavior, and focus management in `src/components/TimerCard.tsx`, `src/components/DurationEditor.tsx`, `src/components/TimerControls.tsx`, and `src/components/ConfirmActionDialog.tsx`; timer ticks must not be announced every second; validation: T042 passes with all functionality keyboard-operable.
- [ ] T045 [US6] Implement responsive timer grid and card sizing in `src/components/TimerGrid.module.css` and `src/components/TimerCard.module.css`; show three columns on wide screens and stacked cards on narrow screens with active controls easy to reach; validation: no horizontal overflow and all controls remain visible/reachable at 320px, tablet, and desktop widths.
- [ ] T046 [US6] Implement refined original visual hierarchy, accessible accents, tabular numerals, focus states, target sizing, and reduced-motion styling in `src/styles/tokens.css`, `src/styles/global.css`, and component CSS modules; validation: state remains identifiable without color, focus is visible, motion is suppressed with `prefers-reduced-motion`, and interactive targets meet the WCAG 2.2 AA target-size criterion or documented exception.

**Checkpoint**: Keyboard, screen-reader, reduced-motion, high-contrast status, and responsive layout requirements are verified.

## Phase 9: Polish and Release Readiness

**Purpose**: Complete open-source documentation, automated deployment, and cross-cutting quality gates.

- [ ] T047 [P] Add a GitHub Pages Actions workflow in `.github/workflows/pages.yml` that runs lint, format check, typecheck, unit/component tests, e2e tests, and build before publishing `dist/`; use least-privilege Pages/OIDC permissions and no secrets; validation: workflow YAML parses and deployment artifact contains static app assets.
- [ ] T048 [P] Document project purpose, open-source contribution/use notes, prerequisites, development scripts, architecture, timer semantics, persistence/recovery, testing, preview, and GitHub Pages deployment in `README.md`; validation: every documented command matches `package.json` and deployment steps require no secret.
- [ ] T049 Add critical user journeys for configure/start/switch/pause/refresh/completion in `tests/e2e/timer-workflow.spec.ts`; use Playwright controlled time and re-arm its clock after reload if necessary; validation: journey passes without long real-time waits and tests closed-time completion recovery.
- [ ] T050 Remove placeholder UI, debug output, unused dependencies, and dead styles from `src/`, `package.json`, and `tests/`; validation: no placeholder/dead controls/debug logging remain and lint reports no unused imports.
- [ ] T051 Run and resolve all release checks using `package.json`, `playwright.config.ts`, and Vite build configuration; validation: lint, format check, strict typecheck, unit tests, component tests, Playwright e2e, and production build all pass, and `dist/` uses `/darkroom-timer/` asset paths.
- [ ] T052 Run the complete runnable scenarios from `specs/001-triple-timer/quickstart.md`; validation: configure/start, switch, reset/clear, refresh recovery, invalid input, storage/audio failure, keyboard, responsive, and reduced-motion scenarios pass.

**Checkpoint**: The open-source application is documented, CI/deployment is configured, all feature acceptance scenarios and quality gates pass.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately; T001 establishes the package and scripts. T002–T006
  depend on the package baseline and can be parallelized after T001.
- **Foundational (Phase 2)**: Depends on setup; T007–T010 establish design and typed domain
  primitives before story work.
- **US1 (Phase 3)**: Depends on setup and foundation; establishes the runnable timer MVP.
- **US2 (Phase 4)**: Depends on US1 timer types and visible controls.
- **US3 (Phase 5)**: Depends on US1/US2 timer transitions and controls.
- **US4 (Phase 6)**: Depends on domain state and controls from US1–US3; persistence has to preserve
  every existing timer state.
- **US5 (Phase 7)**: Depends on US4 application state/storage so mute preference persists, and on
  US1 completion transition.
- **US6 (Phase 8)**: Depends on UI controls/dialog components created in US1–US5.
- **Polish (Phase 9)**: Can begin documentation/workflow in parallel after project scripts exist;
  final quality gates and full quickstart depend on all stories.

### User Story Dependencies

```text
Setup -> Foundation -> US1 -> US2 -> US3 -> US4 -> US5 -> US6 -> Final validation
                                                        \-> Docs/Pages workflow after scripts exist
```

- **US1 (P1)**: First implementation milestone; no later story dependency.
- **US2 (P1)**: Extends US1 state transitions and card controls; not meaningful without the MVP.
- **US3 (P2)**: Extends existing timer controls and states from US1/US2.
- **US4 (P2)**: Persists the complete timer state model from US1–US3.
- **US5 (P3)**: Completion uses US1; persisted mute setting uses US4.
- **US6 (P2)**: Verifies and refines the controls and UI after functional stories are integrated.

### Parallel Opportunities

- After T001: T002, T003, T004, T005, and T006 touch separate configuration files and can proceed
  in parallel.
- After T008: T009 and T010 can be developed separately; T007 is independent of domain types.
- In US1: T011 and T012 tests can be written in parallel; T015 component work can proceed while
  domain test/logic tasks are in progress, but T016 waits for T015 and T014.
- In US3: T023 and T024 are separate test files and can proceed in parallel.
- In US4: T028, T029, and T030 target distinct tests and can proceed in parallel after US1–US3.
- In US5: T037 and T038 can proceed in parallel; T039 audio code is independent of mute UI.
- In US6: T042 and T043 can proceed in parallel; responsive CSS can be authored independently of
  accessibility test cases once the components exist.
- In Polish: T047 and T048 are independent; T049 is independent of README edits; final T051/T052
  require all implementation to be merged.

## Parallel Example: User Story 1

```text
After T008-T010:
1. Write tests T011 and T012 in parallel.
2. Implement T013 and T014 against those tests.
3. In parallel with domain work, implement T015 components.
4. Integrate T016-T017 after component and domain contracts are available.
5. Complete T018 and independently verify the US1 checkpoint.
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete setup and foundational phases.
2. Complete US1 duration tests, pure timer behavior, and the one-page three-card UI.
3. Validate configure/start/countdown/completion and zero-duration feedback independently.
4. Keep the app runnable at the US1 checkpoint; then incrementally add control semantics and persistence.

### Incremental Delivery

1. Deliver US1 countdown MVP.
2. Add US2 pause/stop/switch behavior, then US3 safe reset/clear.
3. Add US4 persistence and reload/visibility recovery.
4. Add US5 completion audio preference, then US6 responsive/accessibility verification.
5. Finish documentation, Pages workflow, and all cross-cutting release checks.

### Story Completion Criteria

| Story | Independent verification |
|---|---|
| US1 | Configure DEVELOP to five seconds, start, observe countdown and COMPLETED at zero; invalid zero cannot start. |
| US2 | Start DEVELOP then STOP; verify automatic pause, explicit pause/resume, Stop retains remaining time, and one-running invariant. |
| US3 | Reset partial progress to configured READY duration; Clear to zero; cancellation changes nothing. |
| US4 | Refresh a running timer and recover accurate remaining time; restore expired timer as COMPLETED; corrupt/blocked storage does not prevent use. |
| US5 | Completion is visibly announced; optional local sound plays once only when unmuted; mute preference survives refresh and audio failure is harmless. |
| US6 | Keyboard-only operation, labelled controls, no per-second screen-reader announcements, reduced motion, and usable mobile/tablet/desktop layouts. |

## Format and Traceability Notes

- Every task uses `- [ ] Tnnn`; story-phase tasks include their `[USn]` label.
- `[P]` is present only where target files are independent of incomplete tasks.
- Every task identifies target file paths and an observable validation condition.
- Story labels map to the specification: US1 configure/run; US2 pause/stop/switch; US3 reset/clear;
  US4 persistence/recovery; US5 completion feedback; US6 responsive/accessibility.
- No external contracts exist for this static client-only application.
