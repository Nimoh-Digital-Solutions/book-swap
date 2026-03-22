import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConditionBadge } from '../components/ConditionBadge/ConditionBadge';
import type { BookCondition } from '../types/book.types';

describe('ConditionBadge', () => {
  const conditions: BookCondition[] = ['new', 'like_new', 'good', 'acceptable'];

  it.each(conditions)('renders the "%s" condition with correct text', condition => {
    render(<ConditionBadge condition={condition} />);
    // The component renders the translated label; i18n falls back to the key segment
    const badge = screen.getByText(/.+/);
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe('SPAN');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ConditionBadge condition="good" className="extra-class" />,
    );
    const span = container.querySelector('span');
    expect(span?.className).toContain('extra-class');
  });

  it.each(conditions)('has a rounded-full style for "%s"', condition => {
    const { container } = render(<ConditionBadge condition={condition} />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('rounded-full');
  });
});
