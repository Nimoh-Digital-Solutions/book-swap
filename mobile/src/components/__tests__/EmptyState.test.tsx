import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '@/components/EmptyState';
import { BookOpen } from 'lucide-react-native';

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    text: { primary: '#000', secondary: '#666' },
    auth: { golden: '#C5A55A', card: '#1a1a1a' },
    surface: { white: '#fff' },
  }),
  useIsDark: () => false,
}));

jest.mock('@/constants/theme', () => ({
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 },
}));

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    const { getByText } = render(
      <EmptyState icon={BookOpen} title="No books" subtitle="Add your first book" />,
    );
    expect(getByText('No books')).toBeTruthy();
    expect(getByText('Add your first book')).toBeTruthy();
  });

  it('renders action button when actionLabel and onAction provided', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState icon={BookOpen} title="No books" actionLabel="Add Book" onAction={onAction} />,
    );
    const btn = getByText('Add Book');
    expect(btn).toBeTruthy();
    fireEvent.press(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button without actionLabel', () => {
    const { queryByText } = render(
      <EmptyState icon={BookOpen} title="Empty" />,
    );
    expect(queryByText('Add Book')).toBeNull();
  });

  it('does not render subtitle when not provided', () => {
    const { queryByText } = render(
      <EmptyState icon={BookOpen} title="Empty" />,
    );
    expect(queryByText('Add your first book')).toBeNull();
  });
});
