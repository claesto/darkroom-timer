import { makeTimer, type TimerApplicationState, type TimerId } from './timer';

export const DEFAULT_DURATIONS: Record<TimerId, number> = {
  DEVELOP: 5 * 60,
  STOP: 30,
  FIX: 5 * 60,
};

export function createDefaultState(now = Date.now()): TimerApplicationState {
  return {
    schemaVersion: 2,
    timers: {
      DEVELOP: makeTimer('DEVELOP', DEFAULT_DURATIONS.DEVELOP),
      STOP: makeTimer('STOP', DEFAULT_DURATIONS.STOP),
      FIX: makeTimer('FIX', DEFAULT_DURATIONS.FIX),
    },
    soundMuted: false,
    updatedAtEpochMs: now,
    completionSequence: 0,
    announcement: '',
  };
}
