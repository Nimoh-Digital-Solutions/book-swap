import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '../../../test/a11y.setup';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { Footer } from './Footer';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Footer', () => {
  it('renders the copyright year and BookSwap name', () => {
    renderWithProviders(<Footer />);
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
    expect(screen.getByText(/BookSwap/)).toBeInTheDocument();
  });

  it('renders the tagline text', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText(/built for readers/i)).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    renderWithProviders(<Footer className="custom-footer" />);
    const footer = screen.getByRole('contentinfo');
    expect(footer.className).toContain('custom-footer');
  });

  it('renders privacy policy and terms links', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
    expect(screen.getByText(/terms of service/i)).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = renderWithProviders(<Footer />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
