# Research: Darkroom Triple Timer

## Timestamp and Monotonic Clock Strategy

**Decision**: Use `Date.now()`-based epoch deadlines as durable persisted timing data so a timer
can be recovered across reloads and closed tabs. While the page is alive, use a monotonic clock
(`performance.now()`) for elapsed-time calculations to avoid drift from scheduling delays and
mid-session system-clock adjustments. Low-frequency interval callbacks refresh the view but never
represent elapsed seconds. Reconcile immediately on load, when `visibilitychange` reports the page
visible, and on window focus. On restore, compute remaining time from the saved remaining snapshot
minus non-negative wall-clock elapsed time, clamped at zero and never above the saved snapshot.
Restore directly as COMPLETED when the deadline has passed.

**Rationale**: Wall-clock timestamps survive reload and closure, while monotonic time is stable
against system-clock changes only within the active page lifetime. Background callbacks can be
throttled and animation frames can stop while hidden, so counting callbacks is inaccurate. The
visibility and focus reconciliation restores the correct display without requiring a worker.

**Alternatives considered**:
- Counting one second per interval callback was rejected because browser throttling, sleep, and
  delayed JavaScript execution cause drift.
- `requestAnimationFrame` was rejected as the timer source because it can stop when the page is
  hidden.
- A Web Worker was rejected as unnecessary complexity and it would not survive a closed tab.
- Monotonic time alone was rejected because it cannot be persisted meaningfully across reloads.

**Known limitation**: A browser cannot know true elapsed real time across page closure if the
system wall clock is adjusted while closed. The deterministic restore rule never increases the
saved remaining value on a backward adjustment.

## Local Persistence and Validation

**Decision**: Persist one versioned JSON object in a single localStorage key. It contains the fixed
three timer records, sound preference, schema version, timestamps, and remaining-duration snapshot.
Use a small hand-written validator to check the version, fixed identities, exact state set, numeric
ranges, timestamp shape, and the at-most-one-running invariant before accepting saved data. Unknown
versions or corrupt data fall back to defaults. Catch storage read/write failures at the adapter
boundary; continue operating in memory when storage is unavailable.

**Rationale**: One record avoids partial updates across timer-specific keys. A version field lets
future revisions reject or deliberately migrate incompatible records. A focused validator avoids
adding a runtime package for a small fixed schema and satisfies the project's dependency restraint.

**Alternatives considered**:
- Separate keys per timer risk inconsistent partial writes.
- Unversioned shape inspection risks silently accepting incompatible future data.
- A schema-validation package could reduce hand-written checks but adds dependency weight for a
  small, fixed state structure.
- Full cross-tab synchronization using `storage` events or `BroadcastChannel` is not required for
  the specified last-interaction-wins behavior and would add complexity; each tab reconciles on
  focus/visibility and its own next load.

For malformed multiple-RUNNING data, preserve only the most recently started valid record as
RUNNING and freeze the others as PAUSED. Any other invalid state falls back safely to defaults.

## React State, Rendering, and Completion Effects

**Decision**: Keep timer transitions as pure functions over application state, action, and explicit
clock input. A single application-level state source enforces the one-running invariant. A light
interval only refreshes displayed derived time. Completion is an explicit one-time transition; its
audio and live announcement are side effects emitted only for a newly completed timer, not inferred
from a timer already loaded in COMPLETED state.

**Rationale**: Explicit clock input makes domain tests deterministic and separates rules from
presentation. Side effects must not repeat on rerender, restore, or React Strict Mode development
effect replays. Completion feedback should originate from the transition edge and be deduplicated
by timer/completion event identity. AudioContext initialization must be unlocked from a user gesture
to comply with browser autoplay policies; failure to play cannot affect completion state.

**Alternatives considered**:
- Inferring completion from render-time state comparisons is more vulnerable to duplicate effects
  during remount/reconciliation.
- A one-shot timeout as the authority fails under throttling and cannot recover after reload.
- A state-management framework is unnecessary for a three-timer application; the reducer/context
  approach is sufficient.

## Testing Boundaries

**Decision**:
- Test pure domain transitions and persistence validation using injected clocks and plain values;
  no fake timers are needed for pure functions.
- Test interval refresh, visibility/focus reconciliation, UI transitions and announcements with
  Vitest, React Testing Library, fake timers, controlled `Date`, and synthetic visibility events.
- Use Playwright for a small set of configure/start/switch/pause/refresh/completion, keyboard, and
  responsive browser flows. Use its Clock API where compatible with the installed version; clock
  control must be installed before time-dependent app code runs.

**Rationale**: Deterministic lower-level tests cover exact edges cheaply, while a small browser suite
checks integration in the actual page and browser storage environment. Tests should avoid long
real-time waits.

**Alternatives considered**:
- Real elapsed-time waits are slow and flaky.
- Testing visibility only in Playwright requires awkward control of browser visibility state; use
  component-level synthetic events for precise reconciliation coverage.

**Risk to validate during implementation**: Confirm Playwright Clock behavior across `page.reload()`
with the selected Playwright version. If the clock does not persist across navigation, re-arm it
after reload or test elapsed restore at the domain/component layer.

## GitHub Pages Deployment

**Decision**: Configure Vite with the project base path `/darkroom-timer/`. Build static files to
`dist/`; use GitHub Actions with the Pages configure, upload-artifact, and deploy actions after the
required checks. Grant only required Pages and OIDC permissions. No secrets or server runtime are
needed.

**Rationale**: This repository is a project site, so root-relative `/` assets would resolve
incorrectly. Actions deployment avoids a separate publishing branch and supports checks before
release. No `404.html` router fallback is necessary because this single-page app has no client-side
routes.

**Alternatives considered**:
- Root base path is appropriate for a user/organization site or a custom domain but not the
  repository project path.
- Publishing via a `gh-pages` branch adds a second branch to maintain and is not needed for the
  static Actions workflow.

## References

- MDN, [`Performance.now()`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
- MDN, [`visibilitychange` event](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event)
- web.dev, [Using the Page Visibility API](https://web.dev/articles/page-visibility)
- MDN, [Autoplay guide for media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- Vitest, [Mocking timers](https://vitest.dev/guide/mocking/timers)
- Playwright, [Clock](https://playwright.dev/docs/clock)
- Vite, [Deploying a Static Site: GitHub Pages](https://vite.dev/guide/static-deploy#github-pages)
