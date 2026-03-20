import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, useThemeContext } from './ThemeContext';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Renders a minimal consumer component so we can observe context values and
 * call context actions through button clicks.
 */
const ThemeConsumer = () => {
  const { theme, toggleTheme, setTheme, preferredTheme, setPreferredTheme } = useThemeContext();

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="preferred">{preferredTheme ?? 'none'}</span>
      <button onClick={toggleTheme}>Toggle</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setPreferredTheme('dim')}>Prefer Dim</button>
      <button onClick={() => setPreferredTheme(null)}>Clear Preferred</button>
    </div>
  );
};

function renderWithProvider(defaultTheme?: 'light' | 'dark' | 'dim') {
  return render(
    // Only pass defaultTheme when defined — exactOptionalPropertyTypes rejects
    // explicit `undefined` for optional props typed as a concrete type.
    defaultTheme ? (
      <ThemeProvider defaultTheme={defaultTheme}>
        <ThemeConsumer />
      </ThemeProvider>
    ) : (
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Reset data-theme attribute before each test
  document.documentElement.removeAttribute('data-theme');
  // Restore matchMedia to the default stub (matches: false = light preference)
  (window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ThemeProvider', () => {
  describe('initialisation', () => {
    it('uses stored theme from localStorage when valid', () => {
      // setStorageItem stores as JSON, so '"dark"' is the raw localStorage value
      localStorage.setItem('app-theme', JSON.stringify('dark'));

      renderWithProvider();

      expect(screen.getByTestId('theme').textContent).toBe('dark');
    });

    it('falls back to OS dark preference when no stored theme', () => {
      (window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderWithProvider();

      expect(screen.getByTestId('theme').textContent).toBe('dark');
    });

    it('uses defaultTheme when no stored value and OS preference is light', () => {
      renderWithProvider('light');

      expect(screen.getByTestId('theme').textContent).toBe('light');
    });

    it('defaults to "light" when no stored value, no OS preference, and no defaultTheme prop', () => {
      renderWithProvider();

      expect(screen.getByTestId('theme').textContent).toBe('light');
    });

    it('ignores invalid values in localStorage (falls back to OS/defaultTheme)', () => {
      // Store something that is not 'light' or 'dark'
      localStorage.setItem('app-theme', JSON.stringify('purple'));

      renderWithProvider('light');

      expect(screen.getByTestId('theme').textContent).toBe('light');
    });
  });

  describe('data-theme side-effect', () => {
    it('sets data-theme on <html> on mount', () => {
      renderWithProvider('light');

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('updates data-theme when theme changes', async () => {
      const user = userEvent.setup();
      renderWithProvider('light');

      await user.click(screen.getByRole('button', { name: 'Toggle' }));

      expect(document.documentElement.getAttribute('data-theme')).toBe('dim');
    });
  });

  describe('toggleTheme', () => {
    it('switches from light to dim', async () => {
      const user = userEvent.setup();
      renderWithProvider('light');

      await user.click(screen.getByRole('button', { name: 'Toggle' }));

      expect(screen.getByTestId('theme').textContent).toBe('dim');
    });

    it('switches from dim to dark', async () => {
      const user = userEvent.setup();
      renderWithProvider('dim');

      await user.click(screen.getByRole('button', { name: 'Toggle' }));

      expect(screen.getByTestId('theme').textContent).toBe('dark');
    });

    it('switches from dark to light', async () => {
      const user = userEvent.setup();
      localStorage.setItem('app-theme', JSON.stringify('dark'));
      renderWithProvider();

      await user.click(screen.getByRole('button', { name: 'Toggle' }));

      expect(screen.getByTestId('theme').textContent).toBe('light');
    });
  });

  describe('setTheme', () => {
    it('sets theme to dark', async () => {
      const user = userEvent.setup();
      renderWithProvider('light');

      await user.click(screen.getByRole('button', { name: 'Set Dark' }));

      expect(screen.getByTestId('theme').textContent).toBe('dark');
    });

    it('sets theme to light', async () => {
      const user = userEvent.setup();
      localStorage.setItem('app-theme', JSON.stringify('dark'));
      renderWithProvider();

      await user.click(screen.getByRole('button', { name: 'Set Light' }));

      expect(screen.getByTestId('theme').textContent).toBe('light');
    });
  });

  describe('theme persistence', () => {
    it('writes the new theme to localStorage on toggle', async () => {
      const user = userEvent.setup();
      renderWithProvider('light');

      await user.click(screen.getByRole('button', { name: 'Toggle' }));

      // setStorageItem stores as JSON string — first toggle from light goes to dim
      expect(localStorage.getItem('app-theme')).toBe(JSON.stringify('dim'));
    });
  });
});

describe('useThemeContext', () => {
  it('throws when used outside <ThemeProvider>', () => {
    // Suppress React's error boundary noise for this expected throw
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<ThemeConsumer />);
    }).toThrow('[ThemeContext] useThemeContext must be used within a <ThemeProvider>');
  });
});

// ---------------------------------------------------------------------------
// preferredTheme tests
// ---------------------------------------------------------------------------

describe('preferredTheme', () => {
  it('is null by default when no stored preferred theme', () => {
    renderWithProvider();

    expect(screen.getByTestId('preferred').textContent).toBe('none');
  });

  it('reads stored preferred theme from localStorage on init', () => {
    localStorage.setItem('app-theme-preferred', JSON.stringify('dim'));

    renderWithProvider();

    expect(screen.getByTestId('preferred').textContent).toBe('dim');
  });

  it('biases OS dark preference to dim when preferredTheme is dim', () => {
    localStorage.setItem('app-theme-preferred', JSON.stringify('dim'));
    (window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    renderWithProvider();

    // OS dark + preferredTheme=dim → init theme should be 'dim' not 'dark'
    expect(screen.getByTestId('theme').textContent).toBe('dim');
  });

  it('setPreferredTheme persists to localStorage and updates context', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'Prefer Dim' }));

    expect(screen.getByTestId('preferred').textContent).toBe('dim');
    expect(localStorage.getItem('app-theme-preferred')).toBe(JSON.stringify('dim'));
  });

  it('setPreferredTheme(null) clears localStorage and resets preferredTheme', async () => {
    const user = userEvent.setup();
    localStorage.setItem('app-theme-preferred', JSON.stringify('dim'));
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'Clear Preferred' }));

    expect(screen.getByTestId('preferred').textContent).toBe('none');
    expect(localStorage.getItem('app-theme-preferred')).toBeNull();
  });
});
