/**
 * Discovery feature public API
 *
 * Import from '@features/discovery' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 *
 * @example
 * import { useBrowseBooks, BrowsePage } from '@features/discovery';
 */

// Components
export { BrowseBookCard } from './components/BrowseBookCard';
export { BrowseEmptyState } from './components/BrowseEmptyState';
export { FilterChips } from './components/FilterChips';
export { RadiusSelector } from './components/RadiusSelector';
export { SearchBar } from './components/SearchBar';
export { SetLocationPrompt } from './components/SetLocationPrompt';

// Hooks
export { discoveryKeys } from './hooks/discoveryKeys';
export { useBrowseBooks } from './hooks/useBrowseBooks';
export { useBrowseFilters } from './hooks/useBrowseFilters';
export { useNearbyCount } from './hooks/useNearbyCount';
export { useRadiusCounts } from './hooks/useRadiusCounts';

// Services
export { discoveryService } from './services/discovery.service';

// Pages
export { BrowsePage } from './pages/BrowsePage';

// Types
export type {
  BrowseBook,
  BrowseFilters,
  BrowseOrdering,
  NearbyCount,
  PaginatedBrowseBooks,
  RadiusCounts,
} from './types/discovery.types';
