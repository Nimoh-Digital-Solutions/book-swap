import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BookGenrePicker } from '../components/BookGenrePicker/BookGenrePicker';

describe('BookGenrePicker', () => {
  it('renders all genre options as checkboxes', () => {
    render(<BookGenrePicker value={[]} onChange={vi.fn()} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(20);
  });

  it('shows selected genres as checked', () => {
    render(<BookGenrePicker value={['Fiction', 'Science']} onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Fiction' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Science' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Fantasy' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with toggled genre when a genre is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BookGenrePicker value={['Fiction']} onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Science' }));
    expect(onChange).toHaveBeenCalledWith(['Fiction', 'Science']);
  });

  it('calls onChange with genre removed when a selected genre is toggled off', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BookGenrePicker value={['Fiction', 'Science']} onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Fiction' }));
    expect(onChange).toHaveBeenCalledWith(['Science']);
  });

  it('disables unselected genres when 3 are already selected', () => {
    render(
      <BookGenrePicker
        value={['Fiction', 'Science', 'Fantasy']}
        onChange={vi.fn()}
      />,
    );
    const romance = screen.getByRole('checkbox', { name: 'Romance' });
    expect(romance).toBeDisabled();
  });

  it('does not call onChange when clicking a disabled genre', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <BookGenrePicker
        value={['Fiction', 'Science', 'Fantasy']}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Romance' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('displays the genre counter', () => {
    render(<BookGenrePicker value={['Fiction']} onChange={vi.fn()} />);
    expect(screen.getByText('(1/3)')).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(
      <BookGenrePicker value={[]} onChange={vi.fn()} error="Required field" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Required field');
  });
});
