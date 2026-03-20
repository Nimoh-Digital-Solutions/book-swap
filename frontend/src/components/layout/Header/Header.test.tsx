import { MemoryRouter } from 'react-router-dom';

import { ThemeProvider } from '@contexts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { axe } from '../../../test/a11y.setup';
import { Header } from './Header';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function renderHeader(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Header', () => {
  it('renders the app brand link', () => {
    renderHeader();
    expect(screen.getByText('React Starter Kit')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderHeader();
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('Home')).toBeInTheDocument();
    expect(within(nav).getByText('Components')).toBeInTheDocument();
  });

  it('applies active class to matching route', () => {
    renderHeader('/');
    // The Home link should be active when at "/"
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink?.className).toContain('active');
  });

  it('renders the theme toggle button', () => {
    renderHeader();
    const themeBtn = screen.getByRole('button', { name: /switch to/i });
    expect(themeBtn).toBeInTheDocument();
  });

  it('cycles theme from light → dim on toggle click', async () => {
    const user = userEvent.setup();
    renderHeader();
    const themeBtn = screen.getByRole('button', { name: /switch to dim/i });
    await user.click(themeBtn);
    // After toggling, label should change (dim → "Switch to dark")
    expect(screen.getByRole('button', { name: /switch to dark/i })).toBeInTheDocument();
  });

  it('renders the preferred-theme pin button', () => {
    renderHeader();
    const pinBtn = screen.getByRole('button', { name: /set as default|unpin default/i });
    expect(pinBtn).toBeInTheDocument();
  });

  it('toggles the preferred star on click', async () => {
    const user = userEvent.setup();
    renderHeader();
    const pinBtn = screen.getByRole('button', { name: /set as default/i });
    expect(pinBtn.textContent).toContain('☆');
    await user.click(pinBtn);
    // After pinning, button should show filled star
    expect(screen.getByRole('button', { name: /unpin default/i }).textContent).toContain('★');
  });

  it('applies custom className when provided', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header className="custom" />
        </ThemeProvider>
      </MemoryRouter>,
    );
    const header = screen.getByRole('banner');
    expect(header.className).toContain('custom');
  });

  it('has no a11y violations', async () => {
    const { container } = renderHeader();
    expect(await axe(container)).toHaveNoViolations();
  });
});
