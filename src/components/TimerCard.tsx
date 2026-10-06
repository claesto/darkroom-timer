import { useState } from 'react';
import { DurationEditor } from './DurationEditor';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import { TimeDisplay } from './TimeDisplay';
import { TimerControls } from './TimerControls';
import type { TimerId } from '../domain/timer';
import { useTimer } from '../app/timerContext';
import { useRemainingSeconds } from '../app/useTimerClock';
import { unlockCompletionAudio } from '../audio/completionSignal';
import { formatDuration } from '../domain/duration';

type PendingAction = { type: 'RESET' } | { type: 'CLEAR' } | { type: 'EDIT'; seconds: number };

const STATUS_LABELS = {
  READY: 'Ready',
  RUNNING: 'Running',
  PAUSED: 'Paused',
  STOPPED: 'Stopped',
  COMPLETED: 'Completed',
} as const;

interface TimerCardProps {
  id: TimerId;
  index: string;
}

export function TimerCard({ id, index }: TimerCardProps): JSX.Element {
  const { timer, dispatch } = useTimer(id);
  const remainingSeconds = useRemainingSeconds(id);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const hasProgress = remainingSeconds < timer.configuredSeconds;

  function editDuration(seconds: number) {
    if (hasProgress && seconds !== timer.configuredSeconds) {
      setPendingAction({ type: 'EDIT', seconds });
    } else {
      dispatch({ type: 'EDIT_DURATION', id, seconds });
    }
  }

  function confirmPending() {
    if (!pendingAction) return;
    if (pendingAction.type === 'EDIT') {
      dispatch({ type: 'EDIT_DURATION', id, seconds: pendingAction.seconds });
    } else {
      dispatch({ type: pendingAction.type, id });
    }
    setPendingAction(null);
  }

  const dialogCopy =
    pendingAction?.type === 'CLEAR'
      ? {
          title: `Clear ${id} duration?`,
          description: 'The configured duration and any remaining time will be removed.',
          confirmLabel: 'Clear timer',
        }
      : pendingAction?.type === 'RESET'
        ? {
            title: `Reset ${id} timer?`,
            description:
              'Any elapsed progress will be discarded and the configured duration restored.',
            confirmLabel: 'Reset timer',
          }
        : {
            title: `Change ${id} duration?`,
            description: 'Changing this duration will discard the current timer progress.',
            confirmLabel: 'Change duration',
          };

  return (
    <article
      className={`timer-card timer-card--${id.toLowerCase()}${timer.status === 'RUNNING' ? ' is-running' : ''}${timer.status === 'COMPLETED' ? ' is-completed' : ''}`}
      aria-labelledby={`${id}-heading`}
    >
      <header className="timer-card__header">
        <div>
          <span className="timer-card__index">{index}</span>
          <h2 id={`${id}-heading`}>{id}</h2>
        </div>
        <span className={`status-badge status-badge--${timer.status.toLowerCase()}`}>
          <span className="status-badge__marker" aria-hidden="true" />
          {STATUS_LABELS[timer.status]}
        </span>
      </header>

      <TimeDisplay seconds={remainingSeconds} />
      {timer.status === 'COMPLETED' && (
        <p className="completion-note">Process stage complete. Ready when you are.</p>
      )}

      <DurationEditor
        key={`${id}-${timer.configuredSeconds}`}
        timerId={id}
        configuredSeconds={timer.configuredSeconds}
        disabled={timer.status === 'RUNNING'}
        onSave={editDuration}
      />

      <TimerControls
        status={timer.status}
        canStart={
          timer.remainingSeconds > 0 || (timer.status === 'READY' && timer.configuredSeconds > 0)
        }
        onStart={() => {
          unlockCompletionAudio();
          dispatch({ type: 'START', id });
        }}
        onPause={() => dispatch({ type: 'PAUSE', id })}
        onStop={() => dispatch({ type: 'STOP', id })}
        onReset={() => {
          if (hasProgress) setPendingAction({ type: 'RESET' });
          else dispatch({ type: 'RESET', id });
        }}
        onClear={() => {
          if (timer.configuredSeconds > 0 || hasProgress) setPendingAction({ type: 'CLEAR' });
          else dispatch({ type: 'CLEAR', id });
        }}
      />
      <p className="configured-summary">
        Set duration <strong>{formatDuration(timer.configuredSeconds)}</strong>
      </p>
      <ConfirmActionDialog
        open={pendingAction !== null}
        {...dialogCopy}
        onConfirm={confirmPending}
        onCancel={() => setPendingAction(null)}
      />
    </article>
  );
}
