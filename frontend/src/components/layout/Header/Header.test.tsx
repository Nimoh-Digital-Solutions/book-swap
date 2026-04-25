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

  it('renders the Browse link pointing to browse page', () => {
    renderHeader();
    const browseLink = screen.getByText('Browse');
    expect(browseLink.closest('a')).toHaveAttribute('href', '/en/browse');
  });

  it('has no a11y violations', async () => {
    const { container } = renderHeader();
    expect(await axe(container)).toHaveNoViolations();
  });

  // -------------------------------------------------------------------------
  // RESP-033 (Sprint C): nav-visibility unit tests.
  //
  // jsdom doesn't compile Tailwind, so we can't query "is it visible at
  // 320 px?" directly. Instead we assert the responsive classes that
  // *control* visibility live on the expected elements. The contract
  // is: at `<md` (< 768 px) the desktop NavLinks + LanguageToggle hide
  // and the hamburger appears; at `≥md` the inverse. Breaking the
  // class wiring should fail these tests.
  // -------------------------------------------------------------------------

  it('renders the hamburger trigger only below `md:` and the desktop nav only at `md:`+', () => {
    renderHeader();

    const trigger = screen.getByRole('button', { name: /open menu/i });
    expect(trigger.className).toContain('md:hidden');

    // The desktop NavLink cluster lives inside a <div className="hidden md:flex …">
    const browseLink = screen.getByText('Browse');
    const desktopWrapper = browseLink.closest('div');
    expect(desktopWrapper?.className).toContain('hidden');
    expect(desktopWrapper?.className).toContain('md:flex');
  });

  it('hides the LanguageToggle below `md:` (it is duplicated inside the mobile drawer)', () => {
    renderHeader();
    // Two LanguageToggle buttons render: one in the header (wrapped in
    // `hidden md:block`) and one inside the closed Drawer. We only
    // care about the header copy here.
    const languageButtons = screen.getAllByRole('button', { name: /language: en/i });
    expect(languageButtons.length).toBeGreaterThanOrEqual(1);
    const headerToggleWrapper = languageButtons[0]!.parentElement;
    expect(headerToggleWrapper?.className).toContain('hidden');
    expect(headerToggleWrapper?.className).toContain('md:block');
  });

  it('hamburger trigger advertises the right aria-controls and aria-expanded contract', () => {
    renderHeader();
    const trigger = screen.getByRole('button', { name: /open menu/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls');
  });
});
