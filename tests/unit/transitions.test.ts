import { describe, expect, it } from 'vitest';
import { createDefaultState } from '../../src/domain/defaultState';
import { timerReducer } from '../../src/domain/transitions';
import { remainingAt, type ClockReading } from '../../src/domain/timer';

const initialClock: ClockReading = { epochMs: 1_000_000, monotonicMs: 100 };

function editAndStart(id: 'DEVELOP' | 'STOP' | 'FIX', seconds: number) {
  let state = createDefaultState(initialClock.epochMs);
  state = timerReducer(state, { type: 'EDIT_DURATION', id, seconds, clock: initialClock });
  return timerReducer(state, { type: 'START', id, clock: initialClock });
}

describe('timer transitions', () => {
  it('starts a configured timer against wall and monotonic clock references', () => {
    const state = editAndStart('DEVELOP', 5);
    expect(state.timers.DEVELOP.status).toBe('RUNNING');
    expect(state.timers.DEVELOP.deadlineEpochMs).toBe(initialClock.epochMs + 5000);
  });

  it('does not start a zero timer or pause another running timer', () => {
    let state = editAndStart('DEVELOP', 5);
    state = timerReducer(state, {
      type: 'EDIT_DURATION',
      id: 'STOP',
      seconds: 0,
      clock: initialClock,
    });
    const result = timerReducer(state, { type: 'START', id: 'STOP', clock: initialClock });
    expect(result.timers.DEVELOP.status).toBe('RUNNING');
    expect(result.timers.STOP.status).toBe('READY');
    expect(result.announcement).toMatch(/greater than 00:00:00/);
  });

  it('pauses on switch and resumes from its frozen remainder', () => {
    let state = editAndStart('DEVELOP', 5);
    const afterTwoSeconds = { epochMs: initialClock.epochMs + 2000, monotonicMs: 2100 };
    state = timerReducer(state, { type: 'START', id: 'STOP', clock: afterTwoSeconds });
    expect(state.timers.DEVELOP.status).toBe('PAUSED');
    expect(state.timers.DEVELOP.remainingSeconds).toBe(3);
    expect(state.timers.STOP.status).toBe('RUNNING');
    state = timerReducer(state, {
      type: 'START',
      id: 'DEVELOP',
      clock: { epochMs: afterTwoSeconds.epochMs + 500, monotonicMs: 2600 },
    });
    expect(state.timers.STOP.status).toBe('PAUSED');
    expect(state.timers.DEVELOP.status).toBe('RUNNING');
  });

  it('distinguishes Stop from Pause and resumes a stopped timer', () => {
    let state = editAndStart('FIX', 9);
    state = timerReducer(state, {
      type: 'STOP',
      id: 'FIX',
      clock: { epochMs: initialClock.epochMs + 2400, monotonicMs: 2500 },
    });
    expect(state.timers.FIX.status).toBe('STOPPED');
    expect(state.timers.FIX.remainingSeconds).toBe(7);
    state = timerReducer(state, {
      type: 'START',
      id: 'FIX',
      clock: { epochMs: initialClock.epochMs + 3000, monotonicMs: 3100 },
    });
    expect(state.timers.FIX.status).toBe('RUNNING');
    expect(state.timers.FIX.runStartedRemainingMilliseconds).toBe(6600);
  });

  it('preserves fractional seconds across repeated pause and resume cycles', () => {
    let state = editAndStart('DEVELOP', 10);
    state = timerReducer(state, {
      type: 'PAUSE',
      id: 'DEVELOP',
      clock: { epochMs: initialClock.epochMs + 1234, monotonicMs: 1334 },
    });
    expect(state.timers.DEVELOP.remainingMilliseconds).toBe(8766);
    state = timerReducer(state, {
      type: 'START',
      id: 'DEVELOP',
      clock: { epochMs: initialClock.epochMs + 5000, monotonicMs: 5100 },
    });
    state = timerReducer(state, {
      type: 'PAUSE',
      id: 'DEVELOP',
      clock: { epochMs: initialClock.epochMs + 5500, monotonicMs: 5600 },
    });
    expect(state.timers.DEVELOP.remainingMilliseconds).toBe(8266);
  });

  it('resets and clears while preserving their distinct effects', () => {
    let state = editAndStart('STOP', 11);
    state = timerReducer(state, {
      type: 'RESET',
      id: 'STOP',
      clock: initialClock,
    });
    expect(state.timers.STOP).toMatchObject({
      configuredSeconds: 11,
      remainingSeconds: 11,
      status: 'READY',
    });
    state = timerReducer(state, { type: 'CLEAR', id: 'STOP', clock: initialClock });
    expect(state.timers.STOP).toMatchObject({
      configuredSeconds: 0,
      remainingSeconds: 0,
      status: 'READY',
    });
  });

  it('completes once at zero and never becomes negative', () => {
    let state = editAndStart('DEVELOP', 1);
    const deadline = {
      epochMs: initialClock.epochMs + 1000,
      monotonicMs: initialClock.monotonicMs + 1000,
    };
    state = timerReducer(state, { type: 'TICK', clock: deadline });
    expect(state.timers.DEVELOP.status).toBe('COMPLETED');
    expect(state.timers.DEVELOP.remainingSeconds).toBe(0);
    expect(state.completionSequence).toBe(1);
    const again = timerReducer(state, {
      type: 'TICK',
      clock: { epochMs: deadline.epochMs + 10_000, monotonicMs: deadline.monotonicMs + 10_000 },
    });
    expect(again.completionSequence).toBe(1);
    expect(again.timers.DEVELOP.remainingSeconds).toBe(0);
  });

  it('uses the greatest elapsed source during active clock reconciliation', () => {
    const state = editAndStart('FIX', 8);
    expect(
      remainingAt(state.timers.FIX, {
        epochMs: initialClock.epochMs + 3500,
        monotonicMs: initialClock.monotonicMs + 1000,
      }),
    ).toBe(5);
  });

  it('ignores invalid duration edits outside the valid range', () => {
    const state = createDefaultState();
    const result = timerReducer(state, {
      type: 'EDIT_DURATION',
      id: 'FIX',
      seconds: -4,
      clock: initialClock,
    });
    expect(result.timers.FIX).toEqual(state.timers.FIX);
  });
});
