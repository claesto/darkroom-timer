# Data Model: Darkroom Triple Timer

## Entities

### TimerId

Stable identity for one of exactly three timers: `DEVELOP`, `STOP`, or `FIX`. Identity and display
order do not vary or depend on user-entered labels.

### Duration

An integer number of seconds representing a configured or remaining duration.

- Configured duration: integer from 0 through 359,999 seconds (99:59:59).
- Remaining duration: integer from 0 through configured duration.
- Input hours: integer from 0 through 99.
- Input minutes and seconds: integers from 0 through 59.
- Starting with zero remaining/configured duration is invalid.
- Display as zero-padded `HH:MM:SS`; hours are at least two digits and may not exceed 99.

### Timer

| Field | Type | Meaning / validation |
|---|---|---|
| `id` | TimerId | Fixed identity; exactly one each of DEVELOP, STOP, FIX |
| `configuredSeconds` | integer | Valid duration, 0–359,999 |
| `remainingSeconds` | integer | Display value, `ceil(remainingMilliseconds / 1000)` |
| `remainingMilliseconds` | finite number | Precise frozen/current duration; 0–configured duration in milliseconds |
| `status` | TimerStatus | READY, RUNNING, PAUSED, STOPPED, COMPLETED |
| `startedAtEpochMs` | integer or null | Wall-clock start/reference timestamp while RUNNING |
| `deadlineEpochMs` | integer or null | Wall-clock target completion timestamp while RUNNING |
| `startedAtMonotonicMs` | finite number or null | In-session monotonic reference while RUNNING; never relied on after reload |
| `runStartedRemainingMilliseconds` | finite number or null | Precise snapshot used with the deadlines to reconcile elapsed time; positive and at most the configured duration while RUNNING |
| `lastStartedAtEpochMs` | integer or null | Used to resolve malformed persisted state containing multiple RUNNING timers |

For non-running states, active start/deadline fields are null. READY normally has remaining equal to
configured duration. PAUSED and STOPPED retain their remaining duration. COMPLETED has zero
remaining. Reset restores READY/configured duration; Clear sets both durations to zero and READY.

### TimerStatus

Finite state set: `READY`, `RUNNING`, `PAUSED`, `STOPPED`, `COMPLETED`.

| Current state | Action | Next state | Effect |
|---|---|---|---|
| READY | Start (duration > 0) | RUNNING | Set deadline from remaining duration |
| PAUSED | Start (remaining > 0) | RUNNING | Resume from remaining duration |
| STOPPED | Start (remaining > 0) | RUNNING | Continue from stopped duration |
| RUNNING | Pause | PAUSED | Reconcile then freeze remaining |
| RUNNING / PAUSED | Stop | STOPPED | Reconcile then freeze remaining |
| Any non-running | Valid duration edit | READY | Set configured and remaining duration |
| Any state | Reset | READY | Restore configured duration |
| Any state | Clear | READY | Set configured and remaining duration to zero |
| RUNNING | Deadline reached | COMPLETED | Set remaining to zero; emit one completion transition |
| COMPLETED | Start | No transition | Must reset or edit first |

An application-level transition may pause an existing RUNNING timer as part of starting another
timer. It does so atomically before marking the selected timer RUNNING; the state must never contain
more than one RUNNING timer.

### TimerApplicationState

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` | integer | Current serialized schema version; version 2 stores millisecond precision and migrates valid version 1 records |
| `timers` | tuple/map of three Timer records | One timer for each stable identity |
| `soundMuted` | boolean | Whether completion audio is suppressed |
| `updatedAtEpochMs` | integer | Last serialized update, used for diagnostics/recovery validation |

The running timer's own timestamps and millisecond-precision remaining snapshot are stored in its Timer record. Display seconds are rounded up from the precise value; pause/resume retains the fractional remainder rather than introducing time on each cycle.
There is at most one RUNNING timer. Unknown or incompatible schema versions are rejected and lead
to defaults; do not partially trust unvalidated input.

### DurationEditorDraft

Transient UI-only strings for hours, minutes, and seconds. Drafts may be empty or invalid while the
user edits, but they do not modify domain state until all fields validate. Hours and clock fields
are independently labelled. Commit normalizes the fields to integer seconds and uses the valid
duration transition.

## Clock Reconciliation

At a run/resume transition, capture remaining duration plus wall-clock and monotonic references,
and calculate a wall-clock target completion time. For an active session, derive remaining time
from monotonic elapsed time where available, while reconciling with the wall-clock deadline so
background throttling and sleep do not pause the timer. On restore, use persisted wall-clock
timestamps and saved remaining duration; clamp elapsed time to non-negative and remaining time to
the saved snapshot. A backward wall-clock change therefore cannot increase the remaining value.
When remaining reaches zero, transition to COMPLETED exactly once and clear active timestamps.

The browser cannot establish true elapsed time across page closure when the system clock itself is
adjusted. The recovery rule is deterministic and never restores more remaining time than was saved.

## Persistence Validation

Before state is used, validate:

- exact schema version and expected top-level fields;
- exactly one record per fixed TimerId, with no duplicate or unknown identities;
- allowed state values and boolean sound preference;
- safe integer durations and timestamps, valid duration ranges and remaining <= configured;
- RUNNING records have valid finite references/deadline and positive remaining snapshot;
- non-RUNNING records have no active run timestamps;
- no more than one RUNNING timer; if corrupted input has several, retain the record with greatest
  valid `lastStartedAtEpochMs` as RUNNING and safely freeze the others as PAUSED.

Malformed or unsupported state loads defaults. Storage read/write exceptions are isolated in the
adapter; the in-memory timer remains usable.
