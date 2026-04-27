import { renderWithProviders } from '@test/renderWithProviders';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import HowItWorksPage from './HowItWorksPage';

function renderPage() {
  return renderWithProviders(<HowItWorksPage />);
}

describe('HowItWorksPage', () => {
  it('renders the hero headline and badge', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: /book swapping/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 steps to your first swap/i)).toBeInTheDocument();
  });

  it('renders the three step cards', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 3, name: /list your books/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /find & request/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /swap locally/i }),
    ).toBeInTheDocument();
  });

  it('renders the safety, getting started, and FAQ sections', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 2, name: /safety tips/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /getting started/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /frequently asked/i }),
    ).toBeInTheDocument();
  });

  it('expands a FAQ item when clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    const trigger = screen.getByRole('button', {
      name: /is bookswap really free\?/i,
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText(/completely free to use/i),
    ).toBeInTheDocument();
  });

  it('renders the CTA with anonymous links by default', () => {
    renderPage();
    expect(
      screen.getByRole('link', { name: /create free account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /browse books first/i }),
    ).toBeInTheDocument();
  });
});
