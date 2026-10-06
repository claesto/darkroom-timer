import { TimerCard } from './TimerCard';
import { TIMER_IDS } from '../domain/timer';

export function TimerGrid(): JSX.Element {
  return (
    <section className="timer-grid" aria-label="Darkroom process timers">
      {TIMER_IDS.map((id, index) => (
        <TimerCard id={id} index={`0${index + 1}`} key={id} />
      ))}
    </section>
  );
}
