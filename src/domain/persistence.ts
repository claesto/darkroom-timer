import { createDefaultState } from './defaultState';
import {
  clearRunClock,
  MAX_DURATION_SECONDS,
  TIMER_IDS,
  type ClockReading,
  type TimerApplicationState,
  type TimerId,
  type TimerRecord,
  type TimerStatus,
} from './timer';

export interface PersistedState {
  schemaVersion: 2;
  timers: Record<TimerId, TimerRecord>;
  soundMuted: boolean;
  updatedAtEpochMs: number;
}

const STATUSES: readonly TimerStatus[] = ['READY', 'RUNNING', 'PAUSED', 'STOPPED', 'COMPLETED'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSafeTimestamp(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isFiniteDurationMilliseconds(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isValidTimer(value: unknown, id: TimerId): value is TimerRecord {
  if (!isRecord(value)) return false;
  const status = value.status;
  if (value.id !== id || typeof status !== 'string' || !STATUSES.includes(status as TimerStatus)) {
    return false;
  }
  if (
    !Number.isSafeInteger(value.configuredSeconds) ||
    (value.configuredSeconds as number) < 0 ||
    (value.configuredSeconds as number) > MAX_DURATION_SECONDS ||
    !Number.isSafeInteger(value.remainingSeconds) ||
    (value.remainingSeconds as number) < 0 ||
    (value.remainingSeconds as number) > (value.configuredSeconds as number) ||
    !isFiniteDurationMilliseconds(value.remainingMilliseconds) ||
    (value.remainingMilliseconds as number) > (value.configuredSeconds as number) * 1000 ||
    (value.remainingSeconds as number) !== Math.ceil((value.remainingMilliseconds as number) / 1000)
  ) {
    return false;
  }
  if (status === 'COMPLETED' && value.remainingMilliseconds !== 0) return false;
  if (
    status === 'READY' &&
    (value.remainingSeconds !== value.configuredSeconds ||
      value.remainingMilliseconds !== (value.configuredSeconds as number) * 1000)
  ) {
    return false;
  }
  if (status === 'RUNNING') {
    return (
      isSafeTimestamp(value.startedAtEpochMs) &&
      isFiniteDurationMilliseconds(value.deadlineEpochMs) &&
      isSafeTimestamp(value.lastStartedAtEpochMs) &&
      isFiniteDurationMilliseconds(value.runStartedRemainingMilliseconds) &&
      (value.runStartedRemainingMilliseconds as number) > 0 &&
      (value.runStartedRemainingMilliseconds as number) <=
        (value.configuredSeconds as number) * 1000 &&
      Math.abs(
        (value.deadlineEpochMs as number) -
          (value.startedAtEpochMs as number) -
          (value.runStartedRemainingMilliseconds as number),
      ) < 0.01 &&
      (value.remainingMilliseconds as number) <=
        (value.runStartedRemainingMilliseconds as number) &&
      value.startedAtMonotonicMs === null
    );
  }
  return (
    value.startedAtEpochMs === null &&
    value.deadlineEpochMs === null &&
    value.startedAtMonotonicMs === null &&
    value.runStartedRemainingMilliseconds === null &&
    (value.lastStartedAtEpochMs === null || isSafeTimestamp(value.lastStartedAtEpochMs))
  );
}

export function parsePersistedState(raw: string): PersistedState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(parsed) || !isRecord(parsed.timers)) {
    return null;
  }

  const ids = Object.keys(parsed.timers).sort();
  if (ids.join(',') !== [...TIMER_IDS].sort().join(',')) return null;

  const schemaVersion = parsed.schemaVersion;
  if (
    (schemaVersion !== 1 && schemaVersion !== 2) ||
    typeof parsed.soundMuted !== 'boolean' ||
    !isSafeTimestamp(parsed.updatedAtEpochMs)
  ) {
    return null;
  }

  const timers = {} as Record<TimerId, TimerRecord>;
  for (const id of TIMER_IDS) {
    const source = parsed.timers[id];
    const timer =
      schemaVersion === 1 && isRecord(source)
        ? {
            ...source,
            remainingMilliseconds:
              typeof source.remainingSeconds === 'number' ? source.remainingSeconds * 1000 : null,
            runStartedRemainingMilliseconds:
              typeof source.runStartedRemainingSeconds === 'number'
                ? source.runStartedRemainingSeconds * 1000
                : null,
          }
        : source;
    if (!isValidTimer(timer, id)) return null;
    timers[id] = timer;
  }

  const activeTimers = Object.values(timers).filter((timer) => timer.status === 'RUNNING');
  if (activeTimers.length > 1) {
    const winner = [...activeTimers].sort(
      (a, b) => (b.lastStartedAtEpochMs ?? 0) - (a.lastStartedAtEpochMs ?? 0),
    )[0];
    for (const timer of activeTimers) {
      if (timer.id !== winner?.id) {
        timers[timer.id] = clearRunClock({ ...timer, status: 'PAUSED' });
      }
    }
  }

  return {
    schemaVersion: 2,
    timers,
    soundMuted: parsed.soundMuted,
    updatedAtEpochMs: parsed.updatedAtEpochMs,
  };
}

export function restorePersistedState(
  persisted: PersistedState | null,
  clock: ClockReading,
): TimerApplicationState {
  if (!persisted) return createDefaultState(clock.epochMs);

  const timers = { ...persisted.timers };
  let announcement = '';
  const running = Object.values(timers).find((timer) => timer.status === 'RUNNING');
  if (running) {
    const snapshot = running.runStartedRemainingMilliseconds ?? running.remainingMilliseconds;
    const remainingMilliseconds = Math.min(
      snapshot,
      Math.max(0, (running.deadlineEpochMs ?? clock.epochMs) - clock.epochMs),
    );
    if (remainingMilliseconds === 0) {
      timers[running.id] = clearRunClock({
        ...running,
        status: 'COMPLETED',
        remainingSeconds: 0,
        remainingMilliseconds: 0,
      });
      announcement = `${running.id} timer completed while away.`;
    } else {
      timers[running.id] = {
        ...running,
        remainingSeconds: Math.ceil(remainingMilliseconds / 1000),
        remainingMilliseconds,
        startedAtEpochMs: clock.epochMs,
        deadlineEpochMs: clock.epochMs + remainingMilliseconds,
        startedAtMonotonicMs: clock.monotonicMs,
        runStartedRemainingMilliseconds: remainingMilliseconds,
      };
    }
  }

  return {
    schemaVersion: 2,
    timers,
    soundMuted: persisted.soundMuted,
    updatedAtEpochMs: clock.epochMs,
    completionSequence: 0,
    announcement,
  };
}

export function serializeState(state: TimerApplicationState): string {
  const persisted: PersistedState = {
    schemaVersion: 2,
    timers: Object.fromEntries(
      TIMER_IDS.map((id) => [id, { ...state.timers[id], startedAtMonotonicMs: null }]),
    ) as Record<TimerId, TimerRecord>,
    soundMuted: state.soundMuted,
    updatedAtEpochMs: state.updatedAtEpochMs,
  };
  return JSON.stringify(persisted);
}
