import { AppShell } from './components/AppShell';
import { TimerProvider } from './app/timerContext';

export default function App(): JSX.Element {
  return (
    <TimerProvider>
      <AppShell />
    </TimerProvider>
  );
}
