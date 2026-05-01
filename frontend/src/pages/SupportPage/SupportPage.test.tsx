import { renderWithProviders } from '@test/renderWithProviders';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SupportPage from './SupportPage';

function renderPage() {
  return renderWithProviders(<SupportPage />);
}

describe('SupportPage', () => {
  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('exposes the support email in mailto links', () => {
    renderPage();
    const mailtoLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('mailto:admin@nimoh-ict.nl'));
    expect(mailtoLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('links to the privacy, terms, account-deletion, and how-it-works pages', () => {
    renderPage();
    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href') ?? '');
    expect(hrefs.some((h) => h.includes('/privacy-policy'))).toBe(true);
    expect(hrefs.some((h) => h.includes('/terms-of-service'))).toBe(true);
    expect(hrefs.some((h) => h.includes('/account-deletion'))).toBe(true);
    expect(hrefs.some((h) => h.includes('/how-it-works'))).toBe(true);
  });

  it('attributes the operator to Nimoh Digital Solutions', () => {
    renderPage();
    const operatorLinks = screen.getAllByRole('link', {
      name: /nimoh digital solutions/i,
    });
    expect(operatorLinks.length).toBeGreaterThanOrEqual(1);
    expect(operatorLinks[0]).toHaveAttribute('href', 'https://nimoh-ict.nl');
    expect(operatorLinks[0]).toHaveAttribute('target', '_blank');
    expect(operatorLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
