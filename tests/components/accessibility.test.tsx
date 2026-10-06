import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../src/App';

describe('accessible timer presentation', () => {
  it('names all duration inputs and exposes timer states as text', () => {
    render(<App />);
    for (const id of ['DEVELOP', 'STOP', 'FIX']) {
      expect(screen.getByRole('textbox', { name: `${id} hours` })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: `${id} minutes` })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: `${id} seconds` })).toBeInTheDocument();
    }
    expect(screen.getAllByText('Ready')).toHaveLength(3);
    expect(
      screen.getAllByText(
        'Hours can be 0 to 99. Minutes and seconds can be 0 to 59. Whole numbers only.',
      ),
    ).toHaveLength(3);
  });

  it('keeps the ticking display outside live regions', () => {
    render(<App />);
    expect(
      screen
        .getByRole('article', { name: 'DEVELOP' })
        .querySelector('time')
        ?.closest('[aria-live]'),
    ).toBeNull();
    expect(document.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
  });
});
