import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmActionDialog } from '../../src/components/ConfirmActionDialog';

describe('ConfirmActionDialog', () => {
  it('exposes clear confirmation semantics and can cancel with Escape', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmActionDialog
        open
        title="Reset timer?"
        description="Progress will be discarded."
        confirmLabel="Reset"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    const dialog = screen.getByRole('dialog', { name: 'Reset timer?' });
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });
});
