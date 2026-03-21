import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '../../test/a11y.setup';
import CataloguePage from './CataloguePage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <CataloguePage />
    </MemoryRouter>,
  );

describe('CataloguePage', () => {
  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/browse books/i);
  });

  it('renders the description text', () => {
    renderPage();
    expect(screen.getByText(/discover books available/i)).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });
});
