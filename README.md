# Darkroom Timer

A quiet, precise browser timer for the three stages of a traditional darkroom workflow:
**DEVELOP**, **STOP**, and **FIX**. Configure each duration once on a single screen, then run the
stages quickly and reliably while working.

Darkroom Timer is an open-source, client-side project. It has no account, backend, telemetry,
external API, or remote runtime dependency. Timer settings remain in the current browser only.

## Features

- Three independent configurable countdowns with READY, RUNNING, PAUSED, STOPPED, and COMPLETED
  states.
- Timestamp-derived elapsed time, single-running-timer behavior, and refresh recovery.
- Reset and clear actions with deliberate confirmation when meaningful progress or a configured
  duration would be discarded.
- Optional locally generated completion sound and a persisted mute preference.
- Responsive, keyboard-operable interface with reduced-motion support and non-per-second
  announcements for assistive technology.

## Requirements

- Node.js 22 or newer and npm.
- A current browser with JavaScript enabled. Audio and browser storage are optional.

## Local development

```sh
npm ci
npm run dev
```

Vite prints the local development URL. The application is a static single-page site and does not
need a server-side service.

## Quality checks

```sh
npm run lint
npm run format:check
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run preview
```

Playwright requires its Chromium browser to be installed once:

```sh
npx playwright install chromium
```

Unit and component tests use Vitest and React Testing Library. Browser-level critical journeys use
Playwright. Timer-domain functions accept explicit clock values so transition and recovery tests
remain deterministic.

## Timer behavior and local data

Each timer has a configured duration and a remaining duration. READY starts from its configured
duration; PAUSED and STOPPED resume from the saved remainder. Starting a different timer pauses the
currently running one. Reset restores the configured duration; Clear removes it. A completed timer
stays at `00:00:00` until reset or edited.

Countdowns are reconciled from timestamps instead of subtracting one second per callback. During an
active page, the monotonic clock is used alongside wall-clock reconciliation. A versioned record in
browser localStorage supports reload recovery. Invalid or incompatible records fall back to sensible
defaults, and storage failures do not prevent the app from working in memory. Since a browser cannot
know how much real time elapsed if the device clock changed while the page was closed, recovery
never increases a saved timer's remaining time.

## Build and GitHub Pages

```sh
npm run build
npm run preview
```

The production bundle is emitted to `dist/` and uses the `/darkroom-timer/` project-site path. The
GitHub Actions workflow validates pull requests and publishes the static build from `main` to
GitHub Pages without repository secrets. In repository settings, select **GitHub Actions** as the
Pages source.

## Contributing

Contributions should preserve the project's small client-side scope, timer accuracy, privacy, and
keyboard/accessibility behavior. Before submitting a change, run the quality checks above and
describe any user-visible timer or persistence behavior changes in the pull request.

The project uses the [MIT License](LICENSE).
