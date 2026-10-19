import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet';

function renderSheet(onClose = vi.fn()) {
  render(
    <BottomSheet open onClose={onClose} title="Log activity">
      <button type="button">Inside</button>
    </BottomSheet>,
  );
  return { onClose, dialog: screen.getByRole('dialog', { name: 'Log activity' }) };
}

describe('BottomSheet', () => {
  it('opens as a modal with its title and content', () => {
    const { dialog } = renderSheet();
    expect(dialog).toHaveAttribute('open');
    expect(screen.getByRole('heading', { name: 'Log activity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inside' })).toBeInTheDocument();
  });

  it('reports the browser closing the dialog (Esc, form close)', () => {
    const { dialog, onClose } = renderSheet();
    fireEvent(dialog, new Event('close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on a backdrop click but not on a click inside', () => {
    const { dialog, onClose } = renderSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Inside' }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(dialog); // the backdrop is part of the dialog element itself
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has a drag handle for phones only', () => {
    renderSheet();
    expect(screen.getByRole('button', { name: /drag to resize or close/i })).toHaveClass(
      'lg:hidden',
    );
  });

  /**
   * jsdom does no layout, so these only guard the CSS that went wrong once; the real behaviour
   * was measured in a browser. A native modal <dialog> is `position: fixed; inset: 0` with
   * `margin: auto`, so:
   *  - phones must clear the browser's `top: 0`, or the sheet sticks to the TOP of the screen;
   *  - desktop must restore `inset: 0` (not `auto`), or `margin: auto` can't centre it and it
   *    lands in the top-left corner;
   *  - desktop height must be `fit-content`, because `auto` on a fixed element with inset 0
   *    stretches it to the maximum height.
   */
  it('keeps the positioning classes that anchor it correctly', () => {
    const { dialog } = renderSheet();
    expect(dialog).toHaveClass('top-auto', 'bottom-0', 'lg:inset-0', 'lg:m-auto', 'lg:h-fit');
    expect(dialog).not.toHaveClass('lg:inset-auto');
    expect(dialog).not.toHaveClass('lg:h-auto');
  });
});
