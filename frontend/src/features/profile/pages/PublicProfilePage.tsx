import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { SEOHead } from '@components';
import { BookCard, useBooks } from '@features/books';
import { RatingsList } from '@features/ratings';
import { BlockUserButton, ReportButton, useIsBlocked } from '@features/trust-safety';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { BookOpen, Calendar, Globe, MapPin, Star, UserX } from 'lucide-react';

import { NewMemberBadge } from '../components/NewMemberBadge';
import { usePublicProfile } from '../hooks/usePublicProfile';

export function PublicProfilePage(): ReactElement {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading, isError } = usePublicProfile(id);
  const isBlocked = useIsBlocked(id ?? '');
  const { data: userBooks, isLoading: booksLoading } = useBooks(
    { owner: id!, page_size: 12 },
    !!id && !isLoading && !!profile,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-[#8C9C92]">
          {t('common.loading', 'Loading…')}
        </div>
      </div>
    );
  }

  // 404 = deactivated or non-existent user
  if (isError || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <UserX className="w-12 h-12 text-[#5A6A60] mx-auto" aria-hidden="true" />
        <h1 className="text-xl font-bold text-white">
          {t('profile.public.notFound', 'User not found')}
        </h1>
        <p className="text-[#8C9C92]">
          {t('profile.public.deactivated', 'This user is no longer active.')}
        </p>
      </div>
    );
  }

  const memberSinceYear = new Date(profile.member_since).getFullYear();
  const showRating = profile.rating_count >= 3 && profile.avg_rating != null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <SEOHead
        title={`${profile.first_name} — ${routeMetadata[PATHS.PROFILE].title}`}
        description={routeMetadata[PATHS.PUBLIC_PROFILE].description}
        path={`/profile/${id}`}
        {...(profile.avatar ? { image: profile.avatar } : {})}
      />
      {isBlocked && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-sm text-red-400 font-medium">
            {t('profile.public.blocked', 'You have blocked this user.')}
          </p>
        </div>
      )}

      {/* Header card */}
      <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.username}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-[#28382D]"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-[#152018] border border-[#28382D] flex items-center justify-center text-3xl font-bold text-[#E4B643]">
                {profile.first_name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {profile.first_name}
                </h1>
                <p className="text-[#8C9C92]">@{profile.username}</p>
              </div>
            </div>

            {/* Actions: Block + Report */}
            {id && (
              <div className="flex gap-3 mt-2">
                <BlockUserButton userId={id} displayName={profile.first_name} />
                <ReportButton reportedUserId={id} />
              </div>
            )}

            {profile.bio && (
              <p className="mt-3 text-[#8C9C92] leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#5A6A60]">
              {profile.neighborhood && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  {profile.neighborhood}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                {t('profile.memberSince', 'Member since {{year}}', {
                  year: memberSinceYear,
                })}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" aria-hidden="true" />
                {profile.preferred_language === 'both'
                  ? 'EN / NL'
                  : profile.preferred_language.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 text-center">
          <div className="text-3xl font-bold text-[#E4B643] mb-1">
            {profile.swap_count}
          </div>
          <div className="text-xs font-bold text-[#5A6A60] uppercase tracking-wider">
            {t('profile.stats.swaps', 'Swaps')}
          </div>
        </div>
        <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 text-center">
          {showRating ? (
            <>
              <div className="flex items-center justify-center gap-1 text-3xl font-bold text-[#E4B643] mb-1">
                <Star className="w-6 h-6 fill-current" aria-hidden="true" />
                {profile.avg_rating}
              </div>
              <div className="text-xs font-bold text-[#5A6A60] uppercase tracking-wider">
                {t('profile.stats.rating', 'Rating')} ({profile.rating_count})
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <NewMemberBadge />
            </div>
          )}
        </div>
        <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 text-center">
          <div className="text-3xl font-bold text-[#E4B643] mb-1">
            {profile.preferred_genres.length}
          </div>
          <div className="text-xs font-bold text-[#5A6A60] uppercase tracking-wider">
            {t('profile.stats.genres', 'Genres')}
          </div>
        </div>
      </div>

      {/* Preferred genres */}
      {profile.preferred_genres.length > 0 && (
        <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#E4B643]" aria-hidden="true" />
            {t('profile.genres.title', 'Preferred Genres')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.preferred_genres.map(genre => (
              <span
                key={genre}
                className="px-3 py-1.5 rounded-full bg-[#152018] border border-[#28382D] text-sm text-[#8C9C92]"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Listed books */}
      <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#E4B643]" aria-hidden="true" />
          {t('profile.public.listedBooks', 'Listed Books')}
        </h2>
        {booksLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#152018] rounded-2xl border border-[#28382D] overflow-hidden animate-pulse"
              >
                <div className="aspect-[3/4] bg-[#1A251D]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#28382D] rounded w-3/4" />
                  <div className="h-2 bg-[#28382D] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (userBooks?.results?.length ?? 0) > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {userBooks!.results.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#5A6A60]">
            {t('profile.public.noBooksYet', 'No books listed yet.')}
          </p>
        )}
      </div>

      {/* Ratings */}
      {id && (
        <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6">
          <RatingsList userId={id} />
        </div>
      )}
    </div>
  );
}
