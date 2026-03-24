/**
 * Trust & Safety feature public API
 *
 * Import from '@features/trust-safety' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 */

// Components
export { BlockedUsersList } from './components/BlockedUsersList/BlockedUsersList';
export { BlockUserButton } from './components/BlockUserButton/BlockUserButton';
export { CookieConsentBanner } from './components/CookieConsentBanner/CookieConsentBanner';
export { DataExportButton } from './components/DataExportButton/DataExportButton';
export { EmailVerificationGate } from './components/EmailVerificationGate/EmailVerificationGate';
export { ReportButton } from './components/ReportButton/ReportButton';
export { ReportDialog } from './components/ReportDialog/ReportDialog';
export { UnblockButton } from './components/UnblockButton/UnblockButton';

// Types
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
} from './types/trustSafety.types';

// Services
export { blockService } from './services/blockService';
export { dataExportService } from './services/dataExportService';
export { reportService } from './services/reportService';

// Hooks
export { blockKeys } from './hooks/blockKeys';
export { useBlocks } from './hooks/useBlocks';
export { useBlockUser } from './hooks/useBlockUser';
export { useDataExport } from './hooks/useDataExport';
export { useIsBlocked } from './hooks/useIsBlocked';
export { useReportUser } from './hooks/useReportUser';
export { useUnblockUser } from './hooks/useUnblockUser';

// Schemas
export type { ReportFormValues } from './schemas/reportSchema';
export { reportSchema } from './schemas/reportSchema';
