export interface Rating {
  id: string;
  reviewer: {
    id: string;
    username: string;
    avatar: string | null;
  };
  score: number;
  comment: string;
  created_at: string;
}

export interface PaginatedRatings {
  count: number;
  next: string | null;
  previous: string | null;
  results: Rating[];
}

export interface ExchangeRatingStatus {
  can_rate: boolean;
  has_rated: boolean;
  rating: Rating | null;
}

export interface SubmitRatingPayload {
  score: number;
  comment?: string;
}
