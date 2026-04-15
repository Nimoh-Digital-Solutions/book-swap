import type { User } from '@/types';

/** Fills BookSwap `User` when the API returns a subset (e.g. login). */
export function mergePartialUser(
  partial: Partial<User> & Pick<User, 'id' | 'email' | 'username'>,
): User {
  return {
    id: partial.id,
    email: partial.email,
    username: partial.username,
    first_name: partial.first_name ?? '',
    last_name: partial.last_name ?? '',
    date_of_birth: partial.date_of_birth ?? null,
    bio: partial.bio ?? '',
    avatar: partial.avatar ?? null,
    location: partial.location ?? null,
    neighborhood: partial.neighborhood ?? '',
    preferred_genres: partial.preferred_genres ?? [],
    preferred_language: partial.preferred_language ?? 'en',
    preferred_radius: partial.preferred_radius ?? 10,
    avg_rating: partial.avg_rating ?? 0,
    swap_count: partial.swap_count ?? 0,
    rating_count: partial.rating_count ?? 0,
    profile_public: partial.profile_public ?? true,
    onboarding_completed: partial.onboarding_completed ?? false,
    email_verified: partial.email_verified ?? false,
    created_at: partial.created_at ?? new Date().toISOString(),
  };
}
