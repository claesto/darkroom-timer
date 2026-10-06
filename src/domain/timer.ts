export const TIMER_IDS = ['DEVELOP', 'STOP', 'FIX'] as const;

export type TimerId = (typeof TIMER_IDS)[number];
export type TimerStatus = 'READY' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETED';
export type DurationSeconds = number & { readonly __brand: 'DurationSeconds' };

export interface TimerRecord {
  id: TimerId;
  configuredSeconds: number;
  remainingSeconds: number;
  remainingMilliseconds: number;
  status: TimerStatus;
  startedAtEpochMs: number | null;
  deadlineEpochMs: number | null;
  startedAtMonotonicMs: number | null;
  runStartedRemainingMilliseconds: number | null;
  lastStartedAtEpochMs: number | null;
}

export interface TimerApplicationState {
  schemaVersion: 2;
  timers: Record<TimerId, TimerRecord>;
  soundMuted: boolean;
  updatedAtEpochMs: number;
  completionSequence: number;
  announcement: string;
}

export interface ClockReading {
  epochMs: number;
  monotonicMs: number;
}

export type TimerAction =
  | { type: 'EDIT_DURATION'; id: TimerId; seconds: number; clock: ClockReading }
  | { type: 'START'; id: TimerId; clock: ClockReading }
  | { type: 'PAUSE'; id: TimerId; clock: ClockReading }
  | { type: 'STOP'; id: TimerId; clock: ClockReading }
  | { type: 'RESET'; id: TimerId; clock: ClockReading }
  | { type: 'CLEAR'; id: TimerId; clock: ClockReading }
  | { type: 'TOGGLE_SOUND'; clock: ClockReading }
  | { type: 'TICK'; clock: ClockReading };

export const MAX_DURATION_SECONDS = 100 * 60 * 60 - 1;

export function makeTimer(
  id: TimerId,
  configuredSeconds: number,
  status: TimerStatus = 'READY',
): TimerRecord {
  return {
    id,
    configuredSeconds,
    remainingSeconds: configuredSeconds,
    remainingMilliseconds: configuredSeconds * 1000,
    status,
    startedAtEpochMs: null,
    deadlineEpochMs: null,
    startedAtMonotonicMs: null,
    runStartedRemainingMilliseconds: null,
    lastStartedAtEpochMs: null,
  };
}

export function clearRunClock(timer: TimerRecord): TimerRecord {
  return {
    ...timer,
    startedAtEpochMs: null,
    deadlineEpochMs: null,
    startedAtMonotonicMs: null,
    runStartedRemainingMilliseconds: null,
  };
}

export function remainingMillisecondsAt(timer: TimerRecord, clock: ClockReading): number {
  if (timer.status !== 'RUNNING' || timer.deadlineEpochMs === null) {
    return timer.remainingMilliseconds;
  }

  const baseMilliseconds = timer.runStartedRemainingMilliseconds ?? timer.remainingMilliseconds;
  const wallElapsedMs = clock.epochMs - (timer.startedAtEpochMs ?? clock.epochMs);
  const monotonicElapsedMs = clock.monotonicMs - (timer.startedAtMonotonicMs ?? clock.monotonicMs);
  const elapsedMs = Math.max(0, wallElapsedMs, monotonicElapsedMs);
  const remainingMs = Math.max(0, baseMilliseconds - elapsedMs);

  return Math.min(baseMilliseconds, remainingMs);
}

export function remainingAt(timer: TimerRecord, clock: ClockReading): number {
  return Math.ceil(remainingMillisecondsAt(timer, clock) / 1000);
}
