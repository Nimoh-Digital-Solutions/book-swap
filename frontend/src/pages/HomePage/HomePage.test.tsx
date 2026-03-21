import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from './HomePage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe('HomePage', () => {
  it('renders the hero headline', () => {
    renderPage();
    expect(screen.getByText(/find your next/i)).toBeInTheDocument();
    expect(screen.getByText(/great adventure/i)).toBeInTheDocument();
  });

  it('renders the search bar with placeholder', () => {
    renderPage();
    expect(
      screen.getByPlaceholderText(/search by title/i),
    ).toBeInTheDocument();
  });

  it('renders popular tags', () => {
    renderPage();
    expect(screen.getAllByText('Sci-Fi').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Dutch Literature')).toBeInTheDocument();
  });

  it('renders book cards', () => {
    renderPage();
    expect(screen.getAllByText('The Midnight Library').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Project Hail Mary').length).toBeGreaterThanOrEqual(1);
  });

  it('renders "How It Works" section with steps', () => {
    renderPage();
    expect(screen.getByText('List Your Books')).toBeInTheDocument();
    expect(screen.getByText('Find & Request')).toBeInTheDocument();
    expect(screen.getByText('Swap Locally')).toBeInTheDocument();
  });

  it('renders CTA section with Create Free Account link', () => {
    renderPage();
    expect(screen.getByText(/create free account/i)).toBeInTheDocument();
  });

  it('renders footer with BookSwap branding', () => {
    renderPage();
    expect(screen.getAllByText(/BookSwap/).length).toBeGreaterThanOrEqual(1);
  });
});
