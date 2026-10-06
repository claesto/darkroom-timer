# Quickstart Validation: Darkroom Triple Timer

This guide describes runnable checks for the completed application. It does not prescribe internal
implementation details; see [data-model.md](data-model.md) for timer and persistence rules.

## Prerequisites

- A current Node.js LTS release and npm.
- A modern desktop or mobile browser for manual responsive and accessibility checks.
- Dependencies installed from the repository lockfile.

## Local checks

Run from the repository root:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Verify all three timer cards appear on one page, configure a
non-zero duration for each, and confirm each configured duration and remaining time is shown in
`HH:MM:SS`.

In a second terminal, run the planned quality commands:

```sh
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run preview
```

The app is expected to pass all checks; the production preview must serve a working static bundle.
Exact script names should be aligned with `package.json` when implementation tasks establish it.

## Critical manual scenarios

1. **Configure and start**: Set DEVELOP to `00:00:05`, start it, and verify RUNNING and descending
   display. At zero it becomes COMPLETED at `00:00:00`.
2. **Switch, pause, stop**: Start DEVELOP, start STOP, and verify DEVELOP becomes PAUSED and STOP
   RUNNING. Pause/resume STOP, then stop and restart it; remaining time must be retained.
3. **Reset and clear**: Advance a timer, invoke Reset, cancel then confirm, and verify configured
   duration is retained and state is READY. Clear a configured timer and verify `00:00:00`.
4. **Refresh recovery**: Run a timer, wait several seconds, reload, and verify it reflects elapsed
   wall time. Reload after its deadline and verify COMPLETED at zero.
5. **Validation and resilience**: Try blank, decimal, negative, and out-of-range minute/second
   values and zero-duration start. Verify clear errors and no invalid state transition. Disable or
   block local storage and sound and verify timer operation remains available.
6. **Accessibility and responsive**: Use keyboard only through all controls; inspect accessible
   names, focus visibility, state/completion announcements, and absence of per-second announcements.
   Check narrow mobile, tablet and wide desktop layouts, then enable reduced motion.

## Automated critical browser flow

The Playwright end-to-end suite should cover configuring/starting, switching, pause/resume, refresh
recovery, and completion without real-time long waits; tests use controlled time. Run it with
`npm run test:e2e` after installing the Playwright browser binary as required by the repository
setup.

## GitHub Pages deployment

The production build must use the `/darkroom-timer/` project-site base path. The Pages workflow
should run checks and build on the selected publishing branch, upload the static `dist/` artifact,
and deploy it with GitHub's Pages workflow actions. No application secret or backend is needed.
Verify the deployed page loads scripts and styles from the repository path and can start, persist,
and restore a timer in that browser.
