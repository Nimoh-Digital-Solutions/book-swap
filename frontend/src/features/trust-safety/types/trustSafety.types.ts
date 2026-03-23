/**
 * trustSafety.types.ts
 *
 * Type contracts for the trust & safety feature, aligned with Django backend
 * serializers: BlockSerializer, ReportCreateSerializer, ReportListSerializer.
 */

// ---------------------------------------------------------------------------
// Enums / value types
// ---------------------------------------------------------------------------

export type ReportCategory =
  | 'inappropriate'
  | 'fake_listing'
  | 'no_show'
  | 'misrepresented'
  | 'harassment'
  | 'spam'
  | 'other';

export type ReportStatus = 'open' | 'reviewed' | 'resolved' | 'dismissed';

// ---------------------------------------------------------------------------
// Nested shapes
// ---------------------------------------------------------------------------

/** Compact user info embedded in block/report responses. */
export interface BlockedUser {
  id: string;
  username: string;
  first_name: string;
  avatar: string | null;
}

// ---------------------------------------------------------------------------
// Response shapes (from BE)
// ---------------------------------------------------------------------------

/** A single block record returned by the API. */
export interface Block {
  id: string;
  blocked_user: BlockedUser;
  created_at: string;
}

/** Paginated blocked users list response. */
export interface PaginatedBlocks {
  count: number;
  next: string | null;
  previous: string | null;
  results: Block[];
}

/** A report record (admin view). */
export interface Report {
  id: string;
  reporter: BlockedUser;
  reported_user: BlockedUser;
  category: ReportCategory;
  description: string;
  status: ReportStatus;
  admin_notes: string;
  resolved_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Payload shapes (to BE)
// ---------------------------------------------------------------------------

/** Payload for blocking a user. */
export interface BlockUserPayload {
  blocked_user_id: string;
}

/** Payload for creating a report. */
export interface CreateReportPayload {
  reported_user_id: string;
  reported_book_id?: string | undefined;
  reported_exchange_id?: string | undefined;
  category: ReportCategory;
  description?: string | undefined;
}

/** Data export response structure. */
export interface DataExportResponse {
  profile: Record<string, unknown>;
  books: Record<string, unknown>[];
  exchanges: Record<string, unknown>[];
  messages_sent: Record<string, unknown>[];
  ratings_given: Record<string, unknown>[];
  ratings_received: Record<string, unknown>[];
  blocks: Record<string, unknown>[];
  reports_filed: Record<string, unknown>[];
}
