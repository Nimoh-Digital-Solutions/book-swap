import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// Mock the route chunk map
vi.mock('@routes/config/routeChunkMap', () => ({
  routeChunkMap: {
    '/components': vi.fn(() => Promise.resolve({ default: () => null })),
    '/login': vi.fn(() => Promise.resolve({ default: () => null })),
  },
}));

import { routeChunkMap } from '@routes/config/routeChunkMap';

import { PrefetchLink } from './PrefetchLink';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('PrefetchLink', () => {
  it('renders a link with the correct text and href', () => {
    renderWithRouter(<PrefetchLink to="/components">Components</PrefetchLink>);
    const link = screen.getByRole('link', { name: 'Components' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/components');
  });

  it('prefetches the chunk on focus (keyboard navigation)', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PrefetchLink to="/components">Components</PrefetchLink>,
    );

    const link = screen.getByRole('link', { name: 'Components' });
    await user.tab(); // Focus the link
    expect(link).toHaveFocus();

    // The chunk factory should have been called
    expect(routeChunkMap['/components']).toHaveBeenCalledTimes(1);
  });

  it('does not prefetch for unknown routes', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PrefetchLink to="/unknown">Unknown</PrefetchLink>,
    );

    const link = screen.getByRole('link', { name: 'Unknown' });
    await user.tab();
    expect(link).toHaveFocus();

    // No factory was called since /unknown is not in the map
    expect(routeChunkMap['/components']).not.toHaveBeenCalled();
    expect(routeChunkMap['/login']).not.toHaveBeenCalled();
  });

  it('only prefetches once per link', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <>
        <button>Other</button>
        <PrefetchLink to="/login">Login</PrefetchLink>
      </>,
    );

    const link = screen.getByRole('link', { name: 'Login' });

    // Focus, blur, refocus
    await user.tab(); // focus Other
    await user.tab(); // focus Login link
    expect(link).toHaveFocus();
    expect(routeChunkMap['/login']).toHaveBeenCalledTimes(1);

    // Blur and refocus
    await user.tab(); // blur
    link.focus();
    // Should not call again
    expect(routeChunkMap['/login']).toHaveBeenCalledTimes(1);
  });
});
