import { Pause, Play, RotateCcw, Square, Trash2 } from 'lucide-react';
import type { TimerStatus } from '../domain/timer';

interface TimerControlsProps {
  status: TimerStatus;
  canStart: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onClear: () => void;
}

export function TimerControls({
  status,
  canStart,
  onStart,
  onPause,
  onStop,
  onReset,
  onClear,
}: TimerControlsProps): JSX.Element {
  return (
    <div className="timer-controls" aria-label="Timer controls">
      {status !== 'RUNNING' && status !== 'COMPLETED' ? (
        <button
          className="button button--primary"
          type="button"
          onClick={onStart}
          disabled={!canStart}
        >
          <Play size={16} aria-hidden="true" />
          Start
        </button>
      ) : null}
      {status === 'RUNNING' && (
        <button className="button button--primary" type="button" onClick={onPause}>
          <Pause size={16} aria-hidden="true" />
          Pause
        </button>
      )}
      {(status === 'RUNNING' || status === 'PAUSED') && (
        <button className="button button--secondary" type="button" onClick={onStop}>
          <Square size={14} aria-hidden="true" />
          Stop
        </button>
      )}
      <div className="timer-controls__utility">
        <button className="button button--quiet" type="button" onClick={onReset}>
          <RotateCcw size={15} aria-hidden="true" />
          Reset
        </button>
        <button className="button button--quiet" type="button" onClick={onClear}>
          <Trash2 size={15} aria-hidden="true" />
          Clear
        </button>
      </div>
    </div>
  );
}
