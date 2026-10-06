import { Aperture } from 'lucide-react';
import { GlobalControls } from './GlobalControls';
import { TimerGrid } from './TimerGrid';
import { useTimerContext } from '../app/timerContext';

export function AppShell(): JSX.Element {
  const { state } = useTimerContext();
  return (
    <main className="app-shell">
      <header className="masthead">
        <a className="brand" href="#main-content" aria-label="Darkroom Timer home">
          <span className="brand__mark">
            <Aperture size={19} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <span className="brand__name">
            DARKROOM <b>TOOLS</b>
          </span>
        </a>
        <GlobalControls />
      </header>

      <div className="page-intro" id="main-content">
        <div>
          <p className="eyebrow">ANALOG PROCESS / 001</p>
          <h1>Darkroom timer</h1>
          <p className="page-intro__copy">Three precise stages. One quiet workspace.</p>
        </div>
        <p className="workflow-note">
          <span className="workflow-note__dot" aria-hidden="true" />
          READY FOR PROCESS
        </p>
      </div>

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {state.announcement}
      </p>
      <TimerGrid />

      <footer className="page-footer">
        <span>KEEP THE PROCESS IN FOCUS</span>
        <span>LOCAL · PRIVATE · PRECISE</span>
      </footer>
    </main>
  );
}
