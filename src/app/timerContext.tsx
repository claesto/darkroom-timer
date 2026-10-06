import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { timerReducer } from '../domain/transitions';
import type { ClockReading, TimerAction, TimerApplicationState, TimerId } from '../domain/timer';
import { loadApplicationState, saveApplicationState } from '../storage/localStorageAdapter';
import { playCompletionSignal } from '../audio/completionSignal';

interface TimerContextValue {
  state: TimerApplicationState;
  displayClock: ClockReading;
  dispatch: (action: TimerCommand) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);
type TimerCommand = TimerAction extends infer Action
  ? Action extends { clock: ClockReading }
    ? Omit<Action, 'clock'>
    : never
  : never;

function readClock(): ClockReading {
  return { epochMs: Date.now(), monotonicMs: performance.now() };
}

export function TimerProvider({ children }: PropsWithChildren): JSX.Element {
  const [state, dispatchReducer] = useReducer(timerReducer, undefined, () =>
    loadApplicationState(),
  );
  const [displayClock, setDisplayClock] = useState(readClock);
  const handledCompletion = useRef(state.completionSequence);

  const dispatch = useCallback((action: TimerCommand) => {
    dispatchReducer({ ...action, clock: readClock() } as TimerAction);
  }, []);

  useEffect(() => {
    if (!Object.values(state.timers).some((timer) => timer.status === 'RUNNING')) return;
    const reconcile = () => {
      const clock = readClock();
      setDisplayClock(clock);
      dispatchReducer({ type: 'TICK', clock });
    };

    const interval = window.setInterval(reconcile, 250);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') reconcile();
    };
    window.addEventListener('focus', reconcile);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', reconcile);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [state.timers]);

  useEffect(() => {
    saveApplicationState(state);
  }, [state]);

  useEffect(() => {
    if (state.completionSequence <= handledCompletion.current) return;
    handledCompletion.current = state.completionSequence;
    const completed = Object.values(state.timers).find(
      (timer) => timer.status === 'COMPLETED' && timer.remainingSeconds === 0,
    );
    if (completed && !state.soundMuted) playCompletionSignal();
  }, [state.completionSequence, state.soundMuted, state.timers]);

  const value = useMemo(() => ({ state, displayClock, dispatch }), [state, displayClock, dispatch]);
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimerContext(): TimerContextValue {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimerContext must be used inside TimerProvider.');
  return context;
}

export function useTimer(id: TimerId) {
  const { state, displayClock, dispatch } = useTimerContext();
  return {
    timer: state.timers[id],
    displayClock,
    dispatch,
  };
}

export function useTimerIds(): readonly TimerId[] {
  return ['DEVELOP', 'STOP', 'FIX'];
}
