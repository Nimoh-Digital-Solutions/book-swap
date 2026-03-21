import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { OnboardingPage } from './OnboardingPage';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <OnboardingPage />
    </MemoryRouter>,
  );

describe('OnboardingPage', () => {
  it('renders "Step 2 of 2" header', () => {
    renderPage();
    expect(screen.getByText(/step 2 of 2/i)).toBeInTheDocument();
  });

  it('renders location input with label', () => {
    renderPage();
    expect(
      screen.getByLabelText(/city, neighborhood, or zip code/i),
    ).toBeInTheDocument();
  });

  it('renders privacy notice', () => {
    renderPage();
    expect(
      screen.getByText(/your exact address is never shared/i),
    ).toBeInTheDocument();
  });

  it('renders Back and Complete Setup buttons', () => {
    renderPage();
    expect(screen.getByText(/back/i)).toBeInTheDocument();
    expect(screen.getByText(/complete setup/i)).toBeInTheDocument();
  });

  it('renders "Skip for now" link', () => {
    renderPage();
    expect(screen.getByText(/skip for now/i)).toBeInTheDocument();
  });

  it('allows typing into the location field', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = screen.getByLabelText(/city, neighborhood, or zip code/i);
    await user.type(input, 'Amsterdam West');
    expect(input).toHaveValue('Amsterdam West');
  });

  it('renders BookSwap branding', () => {
    renderPage();
    expect(screen.getAllByText('BookSwap').length).toBeGreaterThan(0);
  });
});
