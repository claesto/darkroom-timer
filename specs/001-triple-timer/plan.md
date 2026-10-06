# Implementation Plan: Darkroom Triple Timer

**Branch**: `001-triple-timer` | **Date**: 2026-10-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-triple-timer/spec.md`

## Summary

Build a single-page, static React application for the DEVELOP, STOP and FIX countdown timers.
Timer rules live in a pure typed domain layer and a single application-level reducer. Wall-clock
deadlines support restore after reload; monotonic timestamps improve in-session elapsed-time
reconciliation. A lightweight localStorage adapter validates versioned state. Reusable timer cards,
native controls, carefully scoped live announcements, responsive CSS, and a local optional Web
Audio signal provide the interface. Vitest/React Testing Library cover domain and interaction
behavior; a small Playwright suite covers critical browser recovery flows.

## Technical Context

**Language/Version**: TypeScript 5.x, strict mode; HTML and CSS

**Primary Dependencies**: React, React DOM, Vite, Lucide React, Vitest, React Testing Library,
Playwright, ESLint, Prettier

**Storage**: Versioned browser localStorage only; no server or remote runtime dependencies

**Testing**: Vitest for domain/unit and component tests; React Testing Library for user interactions;
Playwright for critical end-to-end flows; ESLint, Prettier, TypeScript check and production build

**Target Platform**: Current desktop, tablet and mobile browsers; static GitHub Pages deployment

**Project Type**: Single-page client-side web application

**Performance Goals**: Refresh the displayed countdown at approximately once per second without
using ticks as the authoritative time source; keep non-timer controls out of unnecessary updates.
The displayed time must reconcile to real elapsed time within the feature spec's one-second target.

**Constraints**: Exactly three stable timer identities; at most one running timer; zero is clamped
and completes once; no backend, authentication, analytics, telemetry, remote data, or network
runtime dependency; dark responsive original visual design; WCAG 2.2 AA; app usable without sound
or browser storage.

**Scale/Scope**: One page, three timer instances, one local preference, one local persisted state
record; no user accounts, cloud sync, presets, or other timer modes.

## Constitution Check

**Pre-design gate: PASS**

- Simplicity and focus: one route/page and exactly three data-driven timer cards; no accounts,
  analytics, dashboards, or unnecessary navigation.
- Client-side architecture: React SPA produces static files for GitHub Pages; no backend or remote
  runtime services.
- Timer correctness: pure domain transitions, explicit states, one-running invariant, timestamp
  reconciliation, and non-negative remaining durations.
- Clear interaction semantics: Start/Pause/Stop/Reset/Clear remain distinct; destructive actions
  require confirmation only when state would be discarded.
- Premium design and accessibility: original visual system, semantic controls, visible focus,
  reduced-motion support, responsive layout, and non-per-second announcements.
- Quality, resilience, privacy: strict typing; domain and interaction tests; versioned validated
  storage with safe defaults; no telemetry or unsafe HTML.

No constitution exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/001-triple-timer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md                 # Created by /speckit-tasks
```

No `contracts/` directory is planned: the app exposes no external API, service, or integration
contract. Its user-facing behavior is specified in `spec.md`.

### Source Code (repository root)

```text
index.html
vite.config.ts
tsconfig.json
package.json
eslint.config.js
playwright.config.ts
src/
├── main.tsx
├── App.tsx
├── app/
│   ├── timerContext.tsx
│   └── useTimerClock.ts
├── domain/
│   ├── timer.ts
│   ├── transitions.ts
│   ├── duration.ts
│   └── persistence.ts
├── storage/
│   └── localStorageAdapter.ts
├── audio/
│   └── completionSignal.ts
├── components/
│   ├── AppShell.tsx
│   ├── TimerGrid.tsx
│   ├── TimerCard.tsx
│   ├── TimeDisplay.tsx
│   ├── DurationEditor.tsx
│   ├── TimerControls.tsx
│   ├── GlobalControls.tsx
│   ├── SoundPreference.tsx
│   ├── ConfirmActionDialog.tsx
│   └── *.module.css
├── styles/
│   ├── tokens.css
│   └── global.css
tests/
├── unit/
│   ├── duration.test.ts
│   ├── transitions.test.ts
│   └── persistence.test.ts
├── components/
│   ├── TimerCard.test.tsx
│   └── ConfirmActionDialog.test.tsx
└── e2e/
    └── timer-workflow.spec.ts
.github/
└── workflows/
    └── pages.yml
```

**Structure Decision**: Use a single frontend project. Keep pure timer-domain logic independent of
React; components render and dispatch actions against one application-level state source. Keep
styles local to components, with shared design tokens in CSS custom properties. The tree is the
target layout; implementation tasks can adjust filenames if repository conventions emerge.

## State Model and Data Flow

`TimerId` is the fixed union `DEVELOP | STOP | FIX`. Each timer has configured duration, a
non-negative remaining-duration snapshot, state, and nullable run timestamps. States are
`READY`, `RUNNING`, `PAUSED`, `STOPPED`, and `COMPLETED`. Starting from READY loads configured
duration; resuming PAUSED or STOPPED continues the snapshot. Start atomically pauses any other
running timer before making the selected one RUNNING. Reset restores configured duration and READY;
Clear sets both durations to zero and READY. Editing is unavailable while running; a committed
valid edit sets configured and remaining duration to the new value and READY.

The pure transition layer receives explicit clock readings and returns the next application state.
A clock/reconciliation hook dispatches a low-frequency refresh while RUNNING and reconciles on load,
visibility restoration, and focus. During an active page lifetime, monotonic elapsed time avoids
system-clock adjustments. Persist an epoch deadline and remaining-time snapshot for reload recovery;
on restore, calculate from the deadline and clamp so remaining time never exceeds the saved
snapshot. A transition into COMPLETED occurs once; only that transition can request completion
audio and an accessible announcement. Storage and audio effects live outside the pure domain layer.
See [research.md](research.md) and [data-model.md](data-model.md).

## Persistence and Clock Decisions

Persist one versioned JSON state object under one localStorage key, containing the three fixed
timer records, sound preference, a wall-clock target completion timestamp for a running timer, and
the remaining-duration snapshot and start/reference timestamps used for recovery. Validate
identity, shape, numeric ranges, version, and the at-most-one-running invariant before accepting
data. Use a small hand-written validator rather than adding a schema dependency for this fixed
shape. Unknown versions, corrupt records, storage exceptions, and invalid values load safe defaults;
writes are best-effort and do not prevent in-memory operation.

During an active page lifetime, use a monotonic clock as the preferred elapsed-time source. On
restore, calculate remaining time from the persisted wall-clock deadline and clamp to zero and the
saved remaining snapshot; never increase remaining time if the wall clock moved backwards.
Reconcile on load, visibility restoration, and focus. Browsers cannot provide a trustworthy
elapsed-time source across reloads if the system clock itself changes; this limitation and the
deterministic recovery behavior are documented in [research.md](research.md).

## Testing Boundaries

- Domain unit tests: duration validation/formatting; every state transition; one-running invariant;
  completion at zero exactly once; clock reconciliation under throttling, sleep-like elapsed jumps,
  and restore; malformed/version-incompatible storage.
- Component tests: labelled fields, invalid/incomplete input, start/pause/stop/reset/clear flows,
  confirmation semantics, keyboard focus/activation, accessible status announcements without
  per-second announcements, completion signal request once, and sound toggle persistence.
- Browser end-to-end tests: configure/start; switch timers; pause/resume; refresh recovery and
  completion; desktop/mobile layout smoke and keyboard-operable core controls.
- Clock-driven tests inject or fake time; avoid real-duration waits. Verify generated output through
  lint, formatting check, strict type check, unit/component tests, Playwright critical scenarios,
  and production build.

## Responsive, Visual, and Accessibility Strategy

Use a three-column timer grid at wide viewports, with cards stacked on narrow viewports and the
running card kept prominent in document order. Keep each timer section semantically grouped, with
visible state text, labelled duration inputs, large tabular numerals, native buttons, visible focus
rings, and sufficient touch target size. Use a calm dark palette, neutral surfaces, distinct
accessible timer accents, CSS custom-property design tokens, and restrained transitions. Respect
`prefers-reduced-motion`. Use a polite live region for state transitions and completion only; do not
put the ticking numeric display in an every-second live region. Implement destructive confirmation
with a native dialog where supported and test a semantically equivalent accessible fallback.

## Deployment and Documentation

Use Vite's project-site base path for `claesto/darkroom-timer` so built assets resolve under
`/darkroom-timer/`. Build a static `dist/` bundle. Add a GitHub Actions workflow that runs checks
and build, then publishes through GitHub Pages using the standard Pages artifact/deploy actions and
least-privilege workflow permissions; deployment requires no repository secret. Update README with
purpose, local setup, development, lint/typecheck/test/build/preview commands, and Pages deployment.
No `404.html` router fallback is required because the app has no client-side routes.

## Constitution Check (Post-design)

**PASS** — the proposed design preserves the one-page, three-timer scope, client-only static
architecture, timestamp-derived timer correctness, typed/testable domain boundaries, accessible
original interface, resilient local persistence, and privacy constraints. The requested stack is
kept lean; no state-management framework or component library is added. The Web Audio API is local
and optional. No constitution exception is required.

## Complexity Tracking

No constitution violations or unjustified complexity.
