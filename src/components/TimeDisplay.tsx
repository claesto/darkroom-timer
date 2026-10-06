import { formatDuration } from '../domain/duration';

interface TimeDisplayProps {
  seconds: number;
}

export function TimeDisplay({ seconds }: TimeDisplayProps): JSX.Element {
  const formatted = formatDuration(seconds);
  return (
    <div className="time-display">
      <span className="time-display__caption">TIME REMAINING</span>
      <time className="time-display__value" aria-label={`${formatted} remaining`}>
        {formatted}
      </time>
    </div>
  );
}
