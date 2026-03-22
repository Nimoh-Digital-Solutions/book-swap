import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GenrePicker } from '../components/GenrePicker';

describe('GenrePicker', () => {
  it('renders all 21 genre options', () => {
    render(<GenrePicker value={[]} onChange={vi.fn()} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(21);
  });

  it('marks selected genres as checked', () => {
    render(<GenrePicker value={['Fiction', 'Fantasy']} onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Fiction' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Fantasy' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Romance' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange when toggling a genre on', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<GenrePicker value={['Fiction']} onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Sci-Fi' }));
    expect(onChange).toHaveBeenCalledWith(['Fiction', 'Sci-Fi']);
  });

  it('calls onChange when toggling a genre off', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<GenrePicker value={['Fiction', 'Sci-Fi']} onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Fiction' }));
    expect(onChange).toHaveBeenCalledWith(['Sci-Fi']);
  });

  it('enforces max 5 genres — disables unselected buttons', () => {
    const fiveGenres = ['Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Romance'];
    render(<GenrePicker value={fiveGenres} onChange={vi.fn()} />);

    const unselected = screen.getByRole('checkbox', { name: 'History' });
    expect(unselected).toBeDisabled();
  });

  it('does not call onChange when clicking a disabled genre', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const fiveGenres = ['Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Romance'];
    render(<GenrePicker value={fiveGenres} onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'History' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows counter text', () => {
    render(<GenrePicker value={['Fiction', 'Fantasy']} onChange={vi.fn()} />);
    expect(screen.getByText('(2/5)')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(<GenrePicker value={[]} onChange={vi.fn()} error="Too many genres" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Too many genres');
  });
});
