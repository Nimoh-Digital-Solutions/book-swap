import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { axe } from '../../../test/a11y.setup';

// Mock usePwaUpdate before importing the component
const mockApplyUpdate = vi.fn();
const mockDismissUpdate = vi.fn();
let mockShowUpdate = true;

vi.mock('@hooks/usePwaUpdate', () => ({
  usePwaUpdate: () => ({
    showUpdate: mockShowUpdate,
    applyUpdate: mockApplyUpdate,
    dismissUpdate: mockDismissUpdate,
  }),
}));

import { PwaUpdateBanner } from './PwaUpdateBanner';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PwaUpdateBanner', () => {
  it('renders the update banner when showUpdate is true', () => {
    mockShowUpdate = true;
    render(<PwaUpdateBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/a new version is available/i)).toBeInTheDocument();
  });

  it('renders nothing when showUpdate is false', () => {
    mockShowUpdate = false;
    const { container } = render(<PwaUpdateBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('calls applyUpdate when update button is clicked', async () => {
    mockShowUpdate = true;
    const user = userEvent.setup();
    render(<PwaUpdateBanner />);
    await user.click(screen.getByText(/update now/i));
    expect(mockApplyUpdate).toHaveBeenCalledOnce();
  });

  it('calls dismissUpdate when dismiss button is clicked', async () => {
    mockShowUpdate = true;
    const user = userEvent.setup();
    render(<PwaUpdateBanner />);
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissBtn);
    expect(mockDismissUpdate).toHaveBeenCalledOnce();
  });

  it('has role="alert" and aria-live="assertive" for accessibility', () => {
    mockShowUpdate = true;
    render(<PwaUpdateBanner />);
    const banner = screen.getByRole('alert');
    expect(banner).toHaveAttribute('aria-live', 'assertive');
  });

  it('has no a11y violations', async () => {
    mockShowUpdate = true;
    const { container } = render(<PwaUpdateBanner />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
