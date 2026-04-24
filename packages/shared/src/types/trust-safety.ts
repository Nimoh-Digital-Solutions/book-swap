export type ReportCategory =
  | 'inappropriate'
  | 'fake_listing'
  | 'no_show'
  | 'misrepresented'
  | 'harassment'
  | 'spam'
  | 'other';

export type ReportStatus = 'open' | 'reviewed' | 'resolved' | 'dismissed';

export interface BlockedUser {
  id: string;
  username: string;
  first_name: string;
  avatar: string | null;
}

export interface Block {
  id: string;
  blocked_user: BlockedUser;
  created_at: string;
}

export interface PaginatedBlocks {
  count: number;
  next: string | null;
  previous: string | null;
  results: Block[];
}

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

export interface BlockUserPayload {
  blocked_user_id: string;
}

export interface CreateReportPayload {
  reported_user_id: string;
  reported_book_id?: string | undefined;
  reported_exchange_id?: string | undefined;
  category: ReportCategory;
  description?: string | undefined;
}

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
