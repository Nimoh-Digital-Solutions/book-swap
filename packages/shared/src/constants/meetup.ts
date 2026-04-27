import type { MeetupCategory } from '../types/messaging';

export const MEETUP_CATEGORIES = ['library', 'cafe', 'park', 'station'] as const satisfies readonly MeetupCategory[];

export const MEETUP_CATEGORY_LABELS: Record<MeetupCategory, string> = {
  library: 'Library',
  cafe: 'Café',
  park: 'Park',
  station: 'Train Station',
};
