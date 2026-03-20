import { render, screen } from '@testing-library/react';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { axe } from '../../../test/a11y.setup';
import { ErrorBoundary } from './ErrorBoundary';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** A component that unconditionally throws during render. */
const BrokenComponent = ({ message = 'Test render error' }: { message?: string }) => {
  throw new Error(message);
};

// Suppress React's own console.error output for expected boundary catches
// so test output stays clean. The actual behaviour is still verified.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders the default fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders a custom fallback when provided and a child throws', () => {
    render(
      <ErrorBoundary fallback={<p>Custom error UI</p>}>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('calls console.error with the caught error via componentDidCatch', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent message="Specific render failure" />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      '[ErrorBoundary] Uncaught error:',
      expect.objectContaining({ message: 'Specific render failure' }),
      expect.anything() // componentStack
    );
  });

  it('does not render children after an error has been caught', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
        <p data-testid="sibling">Sibling should not render</p>
      </ErrorBoundary>
    );

    expect(screen.queryByTestId('sibling')).not.toBeInTheDocument();
  });

  describe('Accessibility (axe)', () => {
    it('has no violations rendering healthy children', async () => {
      const { container } = render(
        <ErrorBoundary>
          <p>All good</p>
        </ErrorBoundary>
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violations in the error fallback UI', async () => {
      const { container } = render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
