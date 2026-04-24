import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { SEOHead } from '@components';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { BookOpen, Calendar, Edit2, Globe, MapPin, Star } from 'lucide-react';

import { NewMemberBadge } from '../components/NewMemberBadge';
import { useProfile } from '../hooks/useProfile';

/**
 * ProfilePage
 *
 * Displays the authenticated user's own profile with stats, bio,
 * location, and genre preferences. Follows "The Archival Naturalist"
 * design system with Tailwind utility classes.
 */
export function ProfilePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useLocaleNavigate();
  const { data: profile, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-text-secondary">
          {t('common.loading', 'Loading…')}
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">
          {t('profile.error', 'Unable to load profile.')}
        </p>
      </div>
    );
  }

  const memberSinceYear = new Date(profile.member_since).getFullYear();
  const showRating = profile.rating_count >= 3 && profile.avg_rating != null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <SEOHead
        title={routeMetadata[PATHS.PROFILE].title}
        description={routeMetadata[PATHS.PROFILE].description}
        path={PATHS.PROFILE}
      />
      {/* Header card */}
      <div className="bg-surface-dark rounded-2xl border border-border-dark p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.username}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-border-dark"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-background-dark border border-border-dark flex items-center justify-center text-3xl font-bold text-primary">
                {profile.first_name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {profile.first_name} {profile.last_name}
                </h1>
                <p className="text-text-secondary">@{profile.username}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(PATHS.PROFILE_EDIT)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border-dark rounded-xl text-sm font-medium text-primary hover:bg-border-dark/50 transition-colors"
              >
                <Edit2 className="w-4 h-4" aria-hidden="true" />
                {t('profile.editButton', 'Edit Profile')}
              </button>
            </div>

            {profile.bio && (
              <p className="mt-3 text-text-secondary leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-muted">
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
        <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {profile.swap_count}
          </div>
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
            {t('profile.stats.swaps', 'Swaps')}
          </div>
        </div>
        <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 text-center">
          {showRating ? (
            <>
              <div className="flex items-center justify-center gap-1 text-3xl font-bold text-primary mb-1">
                <Star className="w-6 h-6 fill-current" aria-hidden="true" />
                {profile.avg_rating}
              </div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
                {t('profile.stats.rating', 'Rating')} ({profile.rating_count})
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <NewMemberBadge />
            </div>
          )}
        </div>
        <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {profile.preferred_genres.length}
          </div>
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
            {t('profile.stats.genres', 'Genres')}
          </div>
        </div>
      </div>

      {/* Preferred genres */}
      {profile.preferred_genres.length > 0 && (
        <div className="bg-surface-dark rounded-2xl border border-border-dark p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
            {t('profile.genres.title', 'Preferred Genres')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.preferred_genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1.5 rounded-full bg-background-dark border border-border-dark text-sm text-text-secondary"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
