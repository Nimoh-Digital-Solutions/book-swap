import { createRef } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { Textarea } from './Textarea';

describe('Textarea', () => {
  describe('Rendering', () => {
    it('renders a labelled textarea', () => {
      render(<Textarea label="Bio" />);
      expect(screen.getByLabelText('Bio')).toBeInTheDocument();
    });

    it('renders the label text', () => {
      render(<Textarea label="Description" />);
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('renders helper text when provided', () => {
      render(<Textarea label="Bio" helperText="Tell us about yourself" />);
      expect(screen.getByText('Tell us about yourself')).toBeInTheDocument();
    });

    it('renders error text when provided', () => {
      render(<Textarea label="Bio" error="Too short" />);
      expect(screen.getByText('Too short')).toBeInTheDocument();
    });

    it('forwards a ref to the textarea element', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<Textarea label="Test" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('applies rows prop', () => {
      render(<Textarea label="Test" rows={6} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '6');
    });
  });

  describe('Accessibility', () => {
    it('sets aria-invalid when error is provided', () => {
      render(<Textarea label="Bio" error="Required" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid without error', () => {
      render(<Textarea label="Bio" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('renders a disabled textarea', () => {
      render(<Textarea label="Test" disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });
});
