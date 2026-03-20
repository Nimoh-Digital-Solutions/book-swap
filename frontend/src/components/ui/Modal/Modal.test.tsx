import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { axe } from '../../../test/a11y.setup';
import { Modal } from './Modal';

beforeEach(() => {
  // JSDOM does not implement HTMLDialogElement methods
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

describe('Modal', () => {
  describe('Rendering', () => {
    it('renders children when open', () => {
      render(
        <Modal open onClose={vi.fn()} title="My Dialog">
          <p>Modal body</p>
        </Modal>,
      );
      expect(screen.getByText('Modal body')).toBeInTheDocument();
    });

    it('renders the title when provided', () => {
      render(
        <Modal open onClose={vi.fn()} title="Confirm Action">
          Content
        </Modal>,
      );
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('renders a close button when title is provided', () => {
      render(
        <Modal open onClose={vi.fn()} title="Dialog">
          Content
        </Modal>,
      );
      expect(screen.getByRole('button', { name: /close dialog/i })).toBeInTheDocument();
    });

    it('does not render a header when no title', () => {
      render(
        <Modal open onClose={vi.fn()}>
          Content
        </Modal>,
      );
      expect(screen.queryByRole('button', { name: /close dialog/i })).not.toBeInTheDocument();
    });
  });

  describe('Behaviour', () => {
    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      render(
        <Modal open onClose={onClose} title="Dialog">
          Content
        </Modal>,
      );
      await userEvent.click(screen.getByRole('button', { name: /close dialog/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls showModal when opened', () => {
      render(
        <Modal open onClose={vi.fn()} title="Dialog">
          Content
        </Modal>,
      );
      expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
  });

  describe('Accessibility (axe)', () => {
    it('has no violations when open with a title', async () => {
      const { container } = render(
        <Modal open onClose={vi.fn()} title="Confirm action">
          <p>Are you sure you want to proceed?</p>
        </Modal>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violations when open without a title', async () => {
      const { container } = render(
        <Modal open onClose={vi.fn()}>
          <p>Content without a title header</p>
        </Modal>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
