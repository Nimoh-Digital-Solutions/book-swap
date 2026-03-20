import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect,it } from 'vitest';

import { Field } from './Field';

describe('Field', () => {
  // -------------------------- Rendering -----------------------------------

  it('renders an input and a visible label', () => {
    render(<Field label="Username" />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('forwards extra input props (type, placeholder, disabled)', () => {
    render(<Field label="Email" type="email" placeholder="you@example.com" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@example.com');
  });

  it('forwards a ref to the underlying input', () => {
    let ref: HTMLInputElement | null = null;
    render(
      <Field
        label="Test"
        ref={el => {
          ref = el;
        }}
      />,
    );
    expect(ref).toBeInstanceOf(HTMLInputElement);
  });

  // -------------------------- Error state ---------------------------------

  it('renders the error message and sets aria-invalid', () => {
    render(<Field label="Email" error="Enter a valid email" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('hides the error message when error is not provided', () => {
    render(<Field label="Email" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'false');
  });

  it('hides helperText when an error is present', () => {
    render(<Field label="Email" helperText="We never share" error="Required" />);
    expect(screen.queryByText('We never share')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  // -------------------------- Helper text ---------------------------------

  it('renders helperText when there is no error', () => {
    render(<Field label="Password" helperText="Min 8 characters" />);
    expect(screen.getByText('Min 8 characters')).toBeInTheDocument();
  });

  // -------------------------- Interaction ---------------------------------

  it('accepts user input', async () => {
    render(<Field label="Name" />);
    const input = screen.getByLabelText('Name');
    await userEvent.type(input, 'Alice');
    expect(input).toHaveValue('Alice');
  });

  it('does not accept input when disabled', async () => {
    render(<Field label="Name" disabled />);
    const input = screen.getByLabelText('Name');
    expect(input).toBeDisabled();
    await userEvent.type(input, 'Alice');
    expect(input).toHaveValue('');
  });
});
