import { Volume2, VolumeX } from 'lucide-react';
import { useTimerContext } from '../app/timerContext';

export function SoundPreference(): JSX.Element {
  const { state, dispatch } = useTimerContext();
  return (
    <button
      className="sound-toggle"
      type="button"
      aria-pressed={!state.soundMuted}
      onClick={() => dispatch({ type: 'TOGGLE_SOUND' })}
    >
      {state.soundMuted ? (
        <VolumeX size={17} aria-hidden="true" />
      ) : (
        <Volume2 size={17} aria-hidden="true" />
      )}
      <span>Sound {state.soundMuted ? 'off' : 'on'}</span>
    </button>
  );
}
