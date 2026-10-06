import { describe, expect, it } from 'vitest';
import { createDefaultState } from '../../src/domain/defaultState';
import {
  parsePersistedState,
  restorePersistedState,
  serializeState,
} from '../../src/domain/persistence';
import { timerReducer } from '../../src/domain/transitions';
import type { ClockReading } from '../../src/domain/timer';

const clock: ClockReading = { epochMs: 100_000, monotonicMs: 20 };

describe('persisted timer state', () => {
  it('round-trips valid versioned application state', () => {
    const state = createDefaultState(clock.epochMs);
    const loaded = parsePersistedState(serializeState(state));
    expect(loaded?.schemaVersion).toBe(2);
    expect(loaded?.timers.FIX.configuredSeconds).toBe(state.timers.FIX.configuredSeconds);
  });

  it.each(['{broken', '{"schemaVersion":3}', 'null'])(
    'rejects corrupt or incompatible data %s',
    (raw) => {
      expect(parsePersistedState(raw)).toBeNull();
    },
  );

  it('migrates valid version 1 state to the precise version 2 shape', () => {
    const state = createDefaultState(clock.epochMs);
    const legacy = JSON.parse(serializeState(state)) as {
      schemaVersion: number;
      timers: Record<string, Record<string, unknown>>;
    };
    legacy.schemaVersion = 1;
    for (const timer of Object.values(legacy.timers)) {
      timer.runStartedRemainingSeconds = null;
      delete timer.runStartedRemainingMilliseconds;
      delete timer.remainingMilliseconds;
    }

    const migrated = parsePersistedState(JSON.stringify(legacy));
    expect(migrated?.schemaVersion).toBe(2);
    expect(migrated?.timers.DEVELOP.remainingMilliseconds).toBe(
      state.timers.DEVELOP.remainingSeconds * 1000,
    );
  });

  it('reconciles elapsed wall time after reload and completes expired timers', () => {
    let state = createDefaultState(clock.epochMs);
    state = timerReducer(state, { type: 'EDIT_DURATION', id: 'FIX', seconds: 3, clock });
    state = timerReducer(state, { type: 'START', id: 'FIX', clock });
    const restored = restorePersistedState(parsePersistedState(serializeState(state)), {
      epochMs: clock.epochMs + 1500,
      monotonicMs: 0,
    });
    expect(restored.timers.FIX.status).toBe('RUNNING');
    expect(restored.timers.FIX.remainingSeconds).toBe(2);
    const completed = restorePersistedState(parsePersistedState(serializeState(state)), {
      epochMs: clock.epochMs + 4000,
      monotonicMs: 0,
    });
    expect(completed.timers.FIX.status).toBe('COMPLETED');
    expect(completed.timers.FIX.remainingSeconds).toBe(0);
    expect(completed.completionSequence).toBe(0);
  });

  it('preserves fractional remaining time through persistence and resume', () => {
    let state = createDefaultState(clock.epochMs);
    state = timerReducer(state, { type: 'EDIT_DURATION', id: 'FIX', seconds: 5, clock });
    state = timerReducer(state, { type: 'START', id: 'FIX', clock });
    state = timerReducer(state, {
      type: 'PAUSE',
      id: 'FIX',
      clock: { epochMs: clock.epochMs + 1234, monotonicMs: clock.monotonicMs + 1234.5 },
    });

    const loaded = parsePersistedState(serializeState(state));
    const restored = restorePersistedState(loaded, {
      epochMs: clock.epochMs + 10_000,
      monotonicMs: 0,
    });
    expect(restored.timers.FIX.remainingMilliseconds).toBe(3765.5);

    state = timerReducer(restored, {
      type: 'START',
      id: 'FIX',
      clock: { epochMs: clock.epochMs + 10_000, monotonicMs: 0 },
    });
    state = timerReducer(state, {
      type: 'PAUSE',
      id: 'FIX',
      clock: { epochMs: clock.epochMs + 10_500, monotonicMs: 500.5 },
    });
    expect(state.timers.FIX.remainingMilliseconds).toBe(3265);
  });

  it('never restores more than the saved snapshot when the wall clock moves backward', () => {
    let state = createDefaultState(clock.epochMs);
    state = timerReducer(state, { type: 'EDIT_DURATION', id: 'FIX', seconds: 4, clock });
    state = timerReducer(state, { type: 'START', id: 'FIX', clock });
    const restored = restorePersistedState(parsePersistedState(serializeState(state)), {
      epochMs: clock.epochMs - 100_000,
      monotonicMs: 0,
    });
    expect(restored.timers.FIX.remainingSeconds).toBe(4);
  });

  it('restores only the most recently started timer as running', () => {
    const state = createDefaultState(clock.epochMs);
    const rawState = {
      schemaVersion: 2,
      soundMuted: false,
      updatedAtEpochMs: clock.epochMs,
      timers: Object.fromEntries(
        (['DEVELOP', 'STOP', 'FIX'] as const).map((id) => [
          id,
          {
            ...state.timers[id],
            status: id === 'DEVELOP' || id === 'STOP' ? 'RUNNING' : 'READY',
            startedAtEpochMs: id === 'DEVELOP' || id === 'STOP' ? clock.epochMs : null,
            deadlineEpochMs: id === 'DEVELOP' || id === 'STOP' ? clock.epochMs + 10_000 : null,
            startedAtMonotonicMs: null,
            runStartedRemainingMilliseconds: id === 'DEVELOP' || id === 'STOP' ? 10_000 : null,
            lastStartedAtEpochMs:
              id === 'DEVELOP' ? clock.epochMs : id === 'STOP' ? clock.epochMs + 1 : null,
            remainingSeconds:
              id === 'DEVELOP' || id === 'STOP' ? 10 : state.timers[id].remainingSeconds,
            remainingMilliseconds:
              id === 'DEVELOP' || id === 'STOP' ? 10_000 : state.timers[id].remainingMilliseconds,
            configuredSeconds:
              id === 'DEVELOP' || id === 'STOP' ? 10 : state.timers[id].configuredSeconds,
          },
        ]),
      ),
    };
    const parsed = parsePersistedState(JSON.stringify(rawState));
    expect(parsed?.timers.STOP.status).toBe('RUNNING');
    expect(parsed?.timers.DEVELOP.status).toBe('PAUSED');
  });

  it('restores defaults if the persisted document has invalid duration constraints', () => {
    const invalid = JSON.parse(serializeState(createDefaultState())) as {
      timers: Record<string, { configuredSeconds: number }>;
    };
    invalid.timers.FIX!.configuredSeconds = 400_000;
    expect(parsePersistedState(JSON.stringify(invalid))).toBeNull();
  });
});
