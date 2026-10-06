import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../../src/App';
import { STORAGE_KEY } from '../../src/storage/localStorageAdapter';

describe('application persistence', () => {
  it('stores configured state and sound preference locally', async () => {
    const user = userEvent.setup();
    render(<App />);
    const sound = screen.getByRole('button', { name: 'Sound on' });
    await user.click(sound);
    const saved = localStorage.getItem(STORAGE_KEY);
    expect(saved).toContain('"soundMuted":true');
    expect(saved).toContain('"schemaVersion":2');
  });

  it('falls back to usable defaults with corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, '{corrupt');
    render(<App />);
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'FIX' })).toBeInTheDocument();
  });
});
