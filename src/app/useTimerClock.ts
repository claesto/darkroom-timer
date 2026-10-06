import { remainingAt } from '../domain/timer';
import { useTimerContext } from './timerContext';

export function useRemainingSeconds(timerId: 'DEVELOP' | 'STOP' | 'FIX'): number {
  const { state, displayClock } = useTimerContext();
  return remainingAt(state.timers[timerId], displayClock);
}
