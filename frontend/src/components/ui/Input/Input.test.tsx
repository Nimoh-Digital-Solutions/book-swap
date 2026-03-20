import { createRef } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { axe } from '../../../test/a11y.setup';
import { Input } from './Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('renders a labelled input', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders the label text', () => {
      render(<Input label="Username" />);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('renders helper text when provided', () => {
      render(<Input label="Name" helperText="Enter your full name" />);
      expect(screen.getByText('Enter your full name')).toBeInTheDocument();
    });

    it('renders error text when provided', () => {
      render(<Input label="Email" error="Invalid email" />);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('forwards a ref to the input element', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input label="Test" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('spreads extra props onto the input', () => {
      render(<Input label="Test" placeholder="Enter value" />);
      expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('sets aria-invalid when error is provided', () => {
      render(<Input label="Email" error="Required" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid without error', () => {
      render(<Input label="Email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('renders a disabled input', () => {
      render(<Input label="Test" disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('Sizes', () => {
    it('renders with size sm', () => {
      render(<Input label="Test" size="sm" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with size lg', () => {
      render(<Input label="Test" size="lg" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Accessibility (axe)', () => {
    it('has no violations for a labelled input', async () => {
      const { container } = render(<Input label="Email address" />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violations when an error is shown', async () => {
      const { container } = render(
        <Input label="Email address" error="Enter a valid email" />
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violations when disabled', async () => {
      const { container } = render(<Input label="Read-only field" disabled />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
