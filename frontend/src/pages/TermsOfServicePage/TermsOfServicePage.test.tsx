import { renderWithProviders } from '@test/renderWithProviders';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TermsOfServicePage from './TermsOfServicePage';

function renderPage() {
  return renderWithProviders(<TermsOfServicePage />);
}

describe('TermsOfServicePage', () => {
  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('mentions Nimoh Digital Solutions as operator', () => {
    renderPage();
    const operatorLinks = screen.getAllByRole('link', {
      name: /nimoh digital solutions/i,
    });
    expect(operatorLinks.length).toBeGreaterThanOrEqual(1);
    expect(operatorLinks[0]).toHaveAttribute('href', 'https://nimoh-ict.nl');
    expect(operatorLinks[0]).toHaveAttribute('target', '_blank');
  });

  it('exposes the support contact email', () => {
    renderPage();
    expect(
      screen.getAllByText(/admin@nimoh-ict\.nl/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders the eligibility section', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 2, name: /eligibility/i }),
    ).toBeInTheDocument();
  });
});
