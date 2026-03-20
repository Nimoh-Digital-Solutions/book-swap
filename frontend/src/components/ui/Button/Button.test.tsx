import { createRef } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { axe } from '../../../test/a11y.setup';
import { Button } from './Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with text content', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('defaults to type="button"', () => {
      render(<Button>Default Type</Button>);
      expect(screen.getByRole('button', { name: /default type/i })).toHaveAttribute(
        'type',
        'button'
      );
    });

    it('supports custom type', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button', { name: /submit/i })).toHaveAttribute('type', 'submit');
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      expect(screen.getByRole('button', { name: /custom/i })).toHaveClass('custom-class');
    });

    it('forwards additional props', () => {
      render(
        <Button data-testid="custom-button" name="my-button">
          Props
        </Button>
      );
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('name', 'my-button');
    });

    it('applies fullWidth styling class', () => {
      render(<Button fullWidth>Full</Button>);
      expect(screen.getByRole('button', { name: /full/i }).className).toMatch(/fullWidth/);
    });

    it('applies variant and size styling classes', () => {
      render(
        <Button variant="secondary" size="lg">
          Styled
        </Button>
      );
      const btn = screen.getByRole('button', { name: /styled/i });
      expect(btn.className).toMatch(/root--secondary/);
      expect(btn.className).toMatch(/root--lg/);
    });
  });

  describe('Disabled and loading behavior', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled();
    });

    it('is disabled when loading is true', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
    });

    it('sets aria-busy when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button', { name: /loading/i })).toHaveAttribute('aria-busy', 'true');
    });

    it('does not set aria-busy when not loading', () => {
      render(<Button>Not loading</Button>);
      expect(screen.getByRole('button', { name: /not loading/i })).not.toHaveAttribute('aria-busy');
    });

    it('uses loadingLabel as accessible name while loading (FA-M11)', () => {
      render(
        <Button loading loadingLabel="Saving changes…">
          Save
        </Button>
      );
      expect(screen.getByRole('button', { name: 'Saving changes…' })).toBeInTheDocument();
    });

    it('does not set aria-label when not loading, even if loadingLabel is provided', () => {
      render(
        <Button loadingLabel="Saving…">
          Save
        </Button>
      );
      expect(screen.getByRole('button', { name: /save/i })).not.toHaveAttribute('aria-label');
    });
  });

  describe('Icons', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;

    it('renders icon before content when iconPosition="left"', () => {
      render(
        <Button icon={<TestIcon />} iconPosition="left">
          With Icon
        </Button>
      );

      const iconWrapper = screen.getByTestId('button-icon');
      const content     = screen.getByTestId('button-content');

      // DOCUMENT_POSITION_FOLLOWING (4) on content means it comes after iconWrapper
      expect(
        iconWrapper.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it('renders icon after content when iconPosition="right"', () => {
      render(
        <Button icon={<TestIcon />} iconPosition="right">
          With Icon
        </Button>
      );

      const iconWrapper = screen.getByTestId('button-icon');
      const content     = screen.getByTestId('button-content');

      // DOCUMENT_POSITION_PRECEDING (2) on content means it comes before iconWrapper
      expect(
        iconWrapper.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_PRECEDING
      ).toBeTruthy();
    });

    it('does not render the provided icon when loading', () => {
      render(
        <Button icon={<TestIcon />} loading>
          Loading
        </Button>
      );

      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('renders the loading spinner when loading is true (FA-M19)', () => {
      render(<Button loading>Saving</Button>);

      expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Button onClick={onClick}>Click</Button>);
      await user.click(screen.getByRole('button', { name: /click/i }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const onClick = vi.fn();

      render(
        <Button onClick={onClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();

      // sanity: disabled buttons do not fire click events
      button.click();
      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading (disabled)', () => {
      const onClick = vi.fn();

      render(
        <Button onClick={onClick} loading>
          Loading
        </Button>
      );

      const button = screen.getByRole('button', { name: /loading/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');

      button.click();
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref to the underlying button element', () => {
      const ref = createRef<HTMLButtonElement>();

      render(<Button ref={ref}>Ref</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.tagName.toLowerCase()).toBe('button');
    });
  });

  describe('Accessibility (axe)', () => {
    it('has no violations for a default button', async () => {
      const { container } = render(<Button>Submit</Button>);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violations for a disabled button', async () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violations while loading', async () => {
      const { container } = render(
        <Button loading loadingLabel="Saving changes…">Save</Button>
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
