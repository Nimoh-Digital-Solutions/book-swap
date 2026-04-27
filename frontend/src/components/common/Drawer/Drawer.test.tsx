import { useState } from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Drawer } from './Drawer';

function Harness({ initial = false }: { initial?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        side="bottom"
        ariaLabel="Test drawer"
        panelClassName="bg-white p-6"
      >
        <button type="button" onClick={() => setOpen(false)}>
          close
        </button>
        <a href="#x">link</a>
      </Drawer>
    </>
  );
}

describe('Drawer', () => {
  it('does not render the dialog when closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog with the supplied aria-label when open', () => {
    render(<Harness initial />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test drawer');
  });

  it('closes when the user presses Escape', async () => {
    const user = userEvent.setup();
    render(<Harness initial />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    // motion/react keeps the dialog mounted while the exit animation runs;
    // wait for AnimatePresence to remove it.
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('locks body scroll while open and restores on close', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(document.body.style.overflow).toBe('');
    await user.click(screen.getByRole('button', { name: /open/i }));
    expect(document.body.style.overflow).toBe('hidden');
    await user.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('');
    });
  });

  it('calls onOpenChange(false) when the backdrop is clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer
        open
        onOpenChange={onOpenChange}
        side="bottom"
        ariaLabel="Backdrop test"
      >
        <p>content</p>
      </Drawer>,
    );
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(backdrop).toBeTruthy();
    await userEvent.setup().click(backdrop);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
