/**
 * trustSafety.types.ts
 *
 * Re-exports from `@shared` — see `packages/shared/src/types/trust-safety.ts`
 * for the canonical contracts (the BookSwap source of truth shared with the
 * mobile app).
 */

export type {
  Block,
  BlockedUser,
  BlockUserPayload,
  CreateReportPayload,
  DataExportResponse,
  PaginatedBlocks,
  Report,
  ReportCategory,
  ReportStatus,
} from '@shared/types/trust-safety';
