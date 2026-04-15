import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '../../../test/a11y.setup';
import { Header } from './Header';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function renderHeader(initialRoute = '/en') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/:lng/*" element={<Header />} />
      </Routes>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Header', () => {
  it('renders the BookSwap brand name', () => {
    renderHeader();
    expect(screen.getByText('BookSwap')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderHeader();
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('Browse')).toBeInTheDocument();
    expect(within(nav).getByText('How it Works')).toBeInTheDocument();
    expect(within(nav).getByText('Community')).toBeInTheDocument();
  });

  it('shows Sign In link when not authenticated', () => {
    renderHeader();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('renders the Browse link pointing to catalogue', () => {
    renderHeader();
    const browseLink = screen.getByText('Browse');
    expect(browseLink.closest('a')).toHaveAttribute('href', '/en/catalogue');
  });

  it('has no a11y violations', async () => {
    const { container } = renderHeader();
    expect(await axe(container)).toHaveNoViolations();
  });
});
