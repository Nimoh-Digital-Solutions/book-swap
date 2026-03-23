/**
 * Trust & Safety feature public API
 *
 * Import from '@features/trust-safety' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 */

// Components
export { BlockUserButton } from './components/BlockUserButton/BlockUserButton';
export { UnblockButton } from './components/UnblockButton/UnblockButton';
export { BlockedUsersList } from './components/BlockedUsersList/BlockedUsersList';
export { ReportButton } from './components/ReportButton/ReportButton';
export { ReportDialog } from './components/ReportDialog/ReportDialog';
export { EmailVerificationGate } from './components/EmailVerificationGate/EmailVerificationGate';
export { DataExportButton } from './components/DataExportButton/DataExportButton';
export { CookieConsentBanner } from './components/CookieConsentBanner/CookieConsentBanner';

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
export { reportService } from './services/reportService';
export { dataExportService } from './services/dataExportService';

// Hooks
export { blockKeys } from './hooks/blockKeys';
export { useBlocks } from './hooks/useBlocks';
export { useBlockUser } from './hooks/useBlockUser';
export { useUnblockUser } from './hooks/useUnblockUser';
export { useIsBlocked } from './hooks/useIsBlocked';
export { useReportUser } from './hooks/useReportUser';
export { useDataExport } from './hooks/useDataExport';

// Schemas
export { reportSchema } from './schemas/reportSchema';
export type { ReportFormValues } from './schemas/reportSchema';
