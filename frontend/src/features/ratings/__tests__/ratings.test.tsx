/**
 * ratings.test.tsx — Epic 7 Phase 5
 *
 * Integration / component tests for the ratings feature:
 * StarDisplay, StarRating, RatingCard, RatingPrompt, RatingsList.
 */
import { MOCK_RATING, MOCK_RATING_STATUS } from '@test/mocks/handlers';
import { server } from '@test/mocks/server';
import { renderWithProviders } from '@test/renderWithProviders';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { RatingCard } from '../components/RatingCard/RatingCard';
import { RatingPrompt } from '../components/RatingPrompt/RatingPrompt';
import { RatingsList } from '../components/RatingsList/RatingsList';
import { StarDisplay } from '../components/StarDisplay/StarDisplay';
import { StarRating } from '../components/StarRating/StarRating';
import type { Rating } from '../types/rating.types';

// ══════════════════════════════════════════════════════════════════════════════
// StarDisplay
// ══════════════════════════════════════════════════════════════════════════════

describe('StarDisplay', () => {
  it('renders correct number of filled stars', () => {
    const { container } = renderWithProviders(<StarDisplay score={3} />);
    const filled = container.querySelectorAll('.fill-\\[\\#E4B643\\]');
    expect(filled).toHaveLength(3);
  });

  it('renders 5 stars total by default', () => {
    const { container } = renderWithProviders(<StarDisplay score={2} />);
    const stars = container.querySelectorAll('svg');
    expect(stars).toHaveLength(5);
  });

  it('renders aria label with score', () => {
    renderWithProviders(<StarDisplay score={4} />);
    expect(screen.getByLabelText('4 out of 5 stars')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// StarRating
// ══════════════════════════════════════════════════════════════════════════════

describe('StarRating', () => {
  it('renders 5 radio buttons', () => {
    renderWithProviders(<StarRating value={0} onChange={() => {}} />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('calls onChange with star value when clicked', async () => {
    const user = userEvent.setup();
    let selected = 0;
    const { rerender } = renderWithProviders(
      <StarRating value={selected} onChange={(v) => { selected = v; }} />,
    );

    await user.click(screen.getByLabelText('4 stars'));
    expect(selected).toBe(4);

    // Verify aria-checked updates
    rerender(<StarRating value={4} onChange={() => {}} />);
    expect(screen.getByLabelText('4 stars')).toHaveAttribute('aria-checked', 'true');
  });

  it('disables interaction when disabled', async () => {
    const user = userEvent.setup();
    let selected = 0;
    renderWithProviders(
      <StarRating value={selected} onChange={(v) => { selected = v; }} disabled />,
    );

    await user.click(screen.getByLabelText('3 stars'));
    expect(selected).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// RatingCard
// ══════════════════════════════════════════════════════════════════════════════

describe('RatingCard', () => {
  const rating: Rating = MOCK_RATING as Rating;

  it('displays rater username and score', () => {
    renderWithProviders(<RatingCard rating={rating} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByLabelText('5 out of 5 stars')).toBeInTheDocument();
  });

  it('displays comment text', () => {
    renderWithProviders(<RatingCard rating={rating} />);
    expect(screen.getByText('Great swap partner!')).toBeInTheDocument();
  });

  it('shows no-comment message when comment is empty', () => {
    renderWithProviders(<RatingCard rating={{ ...rating, comment: '' }} />);
    expect(screen.getByText(/no comment/i)).toBeInTheDocument();
  });

  it('shows formatted date', () => {
    renderWithProviders(<RatingCard rating={rating} />);
    const time = screen.getByRole('time');
    expect(time).toHaveAttribute('datetime', rating.created_at);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// RatingPrompt
// ══════════════════════════════════════════════════════════════════════════════

describe('RatingPrompt', () => {
  it('shows rating form when can_rate is true', async () => {
    renderWithProviders(<RatingPrompt exchangeId="exch_001" />);

    await waitFor(() => {
      expect(screen.getByText(/rate this exchange/i)).toBeInTheDocument();
    });

    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByPlaceholderText(/leave an optional comment/i)).toBeInTheDocument();
    expect(screen.getByText(/submit rating/i)).toBeInTheDocument();
  });

  it('submit button is disabled when no star is selected', async () => {
    renderWithProviders(<RatingPrompt exchangeId="exch_001" />);

    await waitFor(() => {
      expect(screen.getByText(/submit rating/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/submit rating/i).closest('button')).toBeDisabled();
  });

  it('submits rating and shows success notification', async () => {
    const user = userEvent.setup();

    // After submission, the status endpoint should return the submitted rating
    let submitted = false;
    server.use(
      http.post('*/api/v1/ratings/exchanges/:exchangeId/', async ({ request, params }) => {
        const body = (await request.json()) as { score: number; comment?: string };
        submitted = true;
        return HttpResponse.json(
          {
            id: 'rat_new_001',
            exchange: params.exchangeId,
            rater: { id: 'usr_test_001', username: 'testuser', avatar: null },
            rated: { id: 'usr_owner_001', username: 'bookworm', avatar: null },
            score: body.score,
            comment: body.comment ?? '',
            created_at: new Date().toISOString(),
          },
          { status: 201 },
        );
      }),
      http.get('*/api/v1/ratings/exchanges/:exchangeId/', () => {
        if (submitted) {
          return HttpResponse.json({
            ...MOCK_RATING_STATUS,
            my_rating: { ...MOCK_RATING, score: 4, comment: 'Nice experience' },
            can_rate: false,
          });
        }
        return HttpResponse.json(MOCK_RATING_STATUS);
      }),
    );

    renderWithProviders(<RatingPrompt exchangeId="exch_001" />);

    await waitFor(() => {
      expect(screen.getByText(/rate this exchange/i)).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('4 stars'));
    await user.type(
      screen.getByPlaceholderText(/leave an optional comment/i),
      'Nice experience',
    );
    await user.click(screen.getByText(/submit rating/i));

    await waitFor(() => {
      expect(screen.getByText(/my rating/i)).toBeInTheDocument();
    });
  });

  it('shows existing rating when already rated', async () => {
    server.use(
      http.get('*/api/v1/ratings/exchanges/:exchangeId/', () => {
        return HttpResponse.json({
          ...MOCK_RATING_STATUS,
          my_rating: MOCK_RATING,
          can_rate: false,
        });
      }),
    );

    renderWithProviders(<RatingPrompt exchangeId="exch_001" />);

    await waitFor(() => {
      expect(screen.getByText(/my rating/i)).toBeInTheDocument();
    });

    expect(screen.getByText('5/5')).toBeInTheDocument();
    expect(screen.getByText('Great swap partner!')).toBeInTheDocument();
  });

  it('renders nothing when can_rate is false and no rating exists', async () => {
    server.use(
      http.get('*/api/v1/ratings/exchanges/:exchangeId/', () => {
        return HttpResponse.json({
          ...MOCK_RATING_STATUS,
          can_rate: false,
        });
      }),
    );

    const { container } = renderWithProviders(
      <RatingPrompt exchangeId="exch_001" />,
    );

    // Wait for query to settle
    await waitFor(() => {
      expect(container.childElementCount).toBe(0);
    });
  });

  it('shows character counter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RatingPrompt exchangeId="exch_001" />);

    await waitFor(() => {
      expect(screen.getByText(/rate this exchange/i)).toBeInTheDocument();
    });

    await user.type(
      screen.getByPlaceholderText(/leave an optional comment/i),
      'Hello',
    );

    expect(screen.getByText('5/300')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// RatingsList
// ══════════════════════════════════════════════════════════════════════════════

describe('RatingsList', () => {
  it('lists ratings for a user', async () => {
    renderWithProviders(<RatingsList userId="usr_owner_001" />);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    expect(screen.getByText('Great swap partner!')).toBeInTheDocument();
    expect(screen.getByText(/ratings/i)).toBeInTheDocument();
  });

  it('shows empty state when no ratings', async () => {
    server.use(
      http.get('*/api/v1/ratings/users/:userId/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        });
      }),
    );

    renderWithProviders(<RatingsList userId="usr_owner_001" />);

    await waitFor(() => {
      expect(screen.getByText(/no ratings yet/i)).toBeInTheDocument();
    });
  });

  it('shows error state on failure', async () => {
    server.use(
      http.get('*/api/v1/ratings/users/:userId/', () => {
        return HttpResponse.json(
          { detail: 'Server error' },
          { status: 500 },
        );
      }),
    );

    renderWithProviders(<RatingsList userId="usr_owner_001" />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load ratings/i)).toBeInTheDocument();
    });
  });
});
