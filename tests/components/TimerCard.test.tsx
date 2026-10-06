import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

function getCard(id: string): HTMLElement {
  return screen.getByRole('article', { name: id });
}

describe('darkroom timer interactions', () => {
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('renders three configurable timers and starts one', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'DEVELOP' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'STOP' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'FIX' })).toBeInTheDocument();

    await user.click(within(getCard('DEVELOP')).getByRole('button', { name: 'Start' }));
    expect(within(getCard('DEVELOP')).getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('DEVELOP timer started.')).toBeInTheDocument();
  });

  it('rejects invalid durations and does not start a zero duration', async () => {
    const user = userEvent.setup();
    render(<App />);
    const developCard = getCard('DEVELOP');
    const develop = within(developCard);
    const seconds = develop.getByRole('textbox', { name: 'DEVELOP seconds' });
    await user.clear(seconds);
    await user.type(seconds, '60');
    await user.click(develop.getByRole('button', { name: 'Apply duration' }));
    expect(develop.getByRole('alert')).toHaveTextContent('Seconds must be between 0 and 59.');

    await user.clear(seconds);
    await user.type(seconds, '0');
    await user.clear(develop.getByRole('textbox', { name: 'DEVELOP minutes' }));
    await user.type(develop.getByRole('textbox', { name: 'DEVELOP minutes' }), '0');
    await user.click(develop.getByRole('button', { name: 'Apply duration' }));
    expect(developCard.querySelector('.time-display__value')).toHaveTextContent('00:00:00');
    const start = develop.getByRole('button', { name: 'Start' });
    expect(start).toBeDisabled();
  });

  it('pauses one timer when starting another and keeps Stop distinct', async () => {
    const user = userEvent.setup();
    render(<App />);
    const develop = within(getCard('DEVELOP'));
    const stop = within(getCard('STOP'));

    await user.click(develop.getByRole('button', { name: 'Start' }));
    await user.click(stop.getByRole('button', { name: 'Start' }));
    expect(develop.getByText('Paused')).toBeInTheDocument();
    expect(stop.getByText('Running')).toBeInTheDocument();

    await user.click(stop.getByRole('button', { name: 'Pause' }));
    expect(stop.getByText('Paused')).toBeInTheDocument();
    await user.click(stop.getByRole('button', { name: 'Stop' }));
    expect(stop.getByText('Stopped')).toBeInTheDocument();
  });

  it('confirms clear and preserves the timer when cancelled', async () => {
    const user = userEvent.setup();
    render(<App />);
    const fixCard = getCard('FIX');
    const fix = within(fixCard);
    await user.click(fix.getByRole('button', { name: 'Clear' }));
    const dialog = screen.getByRole('dialog', { name: 'Clear FIX duration?' });
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(fixCard.querySelector('.time-display__value')).toHaveTextContent('00:05:00');
  });

  it('requires confirmation before resetting elapsed progress', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1));
    render(<App />);
    const stopCard = getCard('STOP');
    const stop = within(stopCard);

    fireEvent.click(stop.getByRole('button', { name: 'Start' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    fireEvent.click(stop.getByRole('button', { name: 'Stop' }));
    expect(stop.getByText('Stopped')).toBeInTheDocument();
    fireEvent.click(stop.getByRole('button', { name: 'Reset' }));

    const dialog = screen.getByRole('dialog', { name: 'Reset STOP timer?' });
    expect(dialog).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(stop.getByText('Stopped')).toBeInTheDocument();
    fireEvent.click(stop.getByRole('button', { name: 'Reset' }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Reset STOP timer?' })).getByRole('button', {
        name: 'Reset timer',
      }),
    );
    expect(stop.getByText('Ready')).toBeInTheDocument();
    expect(stopCard.querySelector('.time-display__value')).toHaveTextContent('00:00:30');
  });

  it('can complete a one-second timer without announcing every tick', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1));
    render(<App />);
    const develop = within(getCard('DEVELOP'));

    fireEvent.change(develop.getByRole('textbox', { name: 'DEVELOP hours' }), {
      target: { value: '0' },
    });
    fireEvent.change(develop.getByRole('textbox', { name: 'DEVELOP minutes' }), {
      target: { value: '0' },
    });
    fireEvent.change(develop.getByRole('textbox', { name: 'DEVELOP seconds' }), {
      target: { value: '1' },
    });
    fireEvent.click(develop.getByRole('button', { name: 'Apply duration' }));
    fireEvent.click(develop.getByRole('button', { name: 'Start' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    expect(develop.getByText('Completed')).toBeInTheDocument();
    expect(develop.getByLabelText('00:00:00 remaining')).toBeInTheDocument();
    expect(screen.getByText('DEVELOP timer completed.')).toBeInTheDocument();
  });
});
