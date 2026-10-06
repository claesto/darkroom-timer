import { SoundPreference } from './SoundPreference';

export function GlobalControls(): JSX.Element {
  return (
    <div className="global-controls" aria-label="Application preferences">
      <SoundPreference />
    </div>
  );
}
