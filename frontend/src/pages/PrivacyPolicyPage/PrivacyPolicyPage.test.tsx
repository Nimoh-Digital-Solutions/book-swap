import { renderWithProviders } from '@test/renderWithProviders';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PrivacyPolicyPage from './PrivacyPolicyPage';

// Helmet writes to document.head asynchronously; we don't assert against it
// here. The intent of these tests (AUD-W-602) is to give the static legal
// pages a smoke check so a typo or missing translation key fails the suite.

function renderPage() {
  return renderWithProviders(<PrivacyPolicyPage />);
}

describe('PrivacyPolicyPage', () => {
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
    expect(operatorLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('exposes the privacy contact email', () => {
    renderPage();
    expect(
      screen.getAllByText(/admin@nimoh-ict\.nl/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders the GDPR rights section', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 2, name: /your rights.*gdpr/i }),
    ).toBeInTheDocument();
  });
});
