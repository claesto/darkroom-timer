import {
  clearRunClock,
  MAX_DURATION_SECONDS,
  remainingMillisecondsAt,
  type ClockReading,
  type TimerAction,
  type TimerApplicationState,
  type TimerId,
  type TimerRecord,
} from './timer';

function announce(
  state: TimerApplicationState,
  text: string,
  clock: ClockReading,
): TimerApplicationState {
  return {
    ...state,
    updatedAtEpochMs: clock.epochMs,
    announcement: text,
  };
}

function finishTimer(timer: TimerRecord): TimerRecord {
  return clearRunClock({
    ...timer,
    status: 'COMPLETED',
    remainingSeconds: 0,
    remainingMilliseconds: 0,
  });
}

function pauseRunning(
  state: TimerApplicationState,
  clock: ClockReading,
  status: 'PAUSED' | 'STOPPED',
  message: string,
): TimerApplicationState {
  const running = Object.values(state.timers).find((timer) => timer.status === 'RUNNING');
  if (!running) return state;

  const milliseconds = remainingMillisecondsAt(running, clock);
  if (milliseconds <= 0) {
    return announce(
      {
        ...state,
        timers: { ...state.timers, [running.id]: finishTimer(running) },
        completionSequence: state.completionSequence + 1,
      },
      `${running.id} timer completed.`,
      clock,
    );
  }

  const frozen = clearRunClock({
    ...running,
    status,
    remainingSeconds: Math.ceil(milliseconds / 1000),
    remainingMilliseconds: milliseconds,
  });
  return announce({ ...state, timers: { ...state.timers, [running.id]: frozen } }, message, clock);
}

function startTimer(
  state: TimerApplicationState,
  id: TimerId,
  clock: ClockReading,
): TimerApplicationState {
  const selected = state.timers[id];
  const current = Object.values(state.timers).find((timer) => timer.status === 'RUNNING');
  if (selected.status === 'RUNNING' || selected.status === 'COMPLETED') return state;
  const startMilliseconds =
    selected.status === 'READY'
      ? selected.configuredSeconds * 1000
      : selected.remainingMilliseconds;
  if (startMilliseconds <= 0) {
    return announce(state, 'Set a duration greater than 00:00:00 to start.', clock);
  }

  let next = state;
  if (current && current.id !== id) {
    next = pauseRunning(next, clock, 'PAUSED', `${current.id} timer paused.`);
    if (next.timers[current.id].status === 'COMPLETED') return next;
  }

  const timer = next.timers[id];

  const started: TimerRecord = {
    ...timer,
    status: 'RUNNING',
    remainingSeconds: Math.ceil(startMilliseconds / 1000),
    remainingMilliseconds: startMilliseconds,
    startedAtEpochMs: clock.epochMs,
    deadlineEpochMs: clock.epochMs + startMilliseconds,
    startedAtMonotonicMs: clock.monotonicMs,
    runStartedRemainingMilliseconds: startMilliseconds,
    lastStartedAtEpochMs: clock.epochMs,
  };

  return announce(
    {
      ...next,
      timers: { ...next.timers, [id]: started },
    },
    `${id} timer started.`,
    clock,
  );
}

export function timerReducer(
  state: TimerApplicationState,
  action: TimerAction,
): TimerApplicationState {
  const { clock } = action;

  switch (action.type) {
    case 'EDIT_DURATION': {
      const timer = state.timers[action.id];
      if (
        timer.status === 'RUNNING' ||
        !Number.isSafeInteger(action.seconds) ||
        action.seconds < 0 ||
        action.seconds > MAX_DURATION_SECONDS
      ) {
        return state;
      }
      const updated: TimerRecord = {
        ...clearRunClock(timer),
        configuredSeconds: action.seconds,
        remainingSeconds: action.seconds,
        remainingMilliseconds: action.seconds * 1000,
        status: 'READY',
      };
      return announce(
        { ...state, timers: { ...state.timers, [action.id]: updated } },
        `${action.id} duration updated.`,
        clock,
      );
    }
    case 'START':
      return startTimer(state, action.id, clock);
    case 'PAUSE': {
      const timer = state.timers[action.id];
      if (timer.status !== 'RUNNING') return state;
      const next = pauseRunning(state, clock, 'PAUSED', `${action.id} timer paused.`);
      return next;
    }
    case 'STOP': {
      const timer = state.timers[action.id];
      if (timer.status !== 'RUNNING' && timer.status !== 'PAUSED') return state;
      const base =
        timer.status === 'RUNNING'
          ? pauseRunning(state, clock, 'STOPPED', `${action.id} timer stopped.`)
          : announce(
              {
                ...state,
                timers: {
                  ...state.timers,
                  [action.id]: { ...timer, status: 'STOPPED' },
                },
              },
              `${action.id} timer stopped.`,
              clock,
            );
      return base;
    }
    case 'RESET': {
      const timer = state.timers[action.id];
      const reset = {
        ...clearRunClock(timer),
        status: 'READY' as const,
        remainingSeconds: timer.configuredSeconds,
        remainingMilliseconds: timer.configuredSeconds * 1000,
      };
      return announce(
        { ...state, timers: { ...state.timers, [action.id]: reset } },
        `${action.id} timer reset.`,
        clock,
      );
    }
    case 'CLEAR': {
      const timer = state.timers[action.id];
      const cleared = {
        ...clearRunClock(timer),
        configuredSeconds: 0,
        remainingSeconds: 0,
        remainingMilliseconds: 0,
        status: 'READY' as const,
      };
      return announce(
        { ...state, timers: { ...state.timers, [action.id]: cleared } },
        `${action.id} timer cleared.`,
        clock,
      );
    }
    case 'TOGGLE_SOUND': {
      const soundMuted = !state.soundMuted;
      return announce(
        { ...state, soundMuted },
        `Completion sound ${soundMuted ? 'muted' : 'unmuted'}.`,
        clock,
      );
    }
    case 'TICK': {
      const running = Object.values(state.timers).find((timer) => timer.status === 'RUNNING');
      if (!running) return state;
      const milliseconds = remainingMillisecondsAt(running, clock);
      if (milliseconds <= 0) {
        return announce(
          {
            ...state,
            timers: {
              ...state.timers,
              [running.id]: finishTimer(running),
            },
            completionSequence: state.completionSequence + 1,
          },
          `${running.id} timer completed.`,
          clock,
        );
      }
      const seconds = Math.ceil(milliseconds / 1000);
      if (running.remainingSeconds === seconds) return state;
      return {
        ...state,
        timers: {
          ...state.timers,
          [running.id]: {
            ...running,
            remainingSeconds: seconds,
            remainingMilliseconds: milliseconds,
          },
        },
        updatedAtEpochMs: clock.epochMs,
      };
    }
  }
}
