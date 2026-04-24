/**
 * NotificationPanel.tsx
 *
 * Dropdown panel showing the last 50 in-app notifications for the current user.
 * Opened by clicking the NotificationBell in the Header.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { BrandedLoader } from '@components';
import type { Notification } from '@features/notifications';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@features/notifications';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Sub-component: single notification row
// ---------------------------------------------------------------------------

interface NotificationRowProps {
  notification: Notification;
  onRead: (id: string) => void;
}

function NotificationRow({ notification, onRead }: NotificationRowProps): ReactElement {
  const navigate = useLocaleNavigate();

  const handleClick = (): void => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    if (notification.link) {
      void navigate(notification.link);
    }
  };

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className={`w-full text-left px-4 py-3 hover:bg-[#1E2E22] transition-colors flex items-start gap-3 ${
          notification.is_read ? 'opacity-60' : ''
        }`}
        aria-label={notification.title}
      >
        {!notification.is_read && (
          <span
            className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-[#E4B643]"
            aria-hidden="true"
          />
        )}
        {notification.is_read && (
          <span className="mt-1.5 shrink-0 w-2 h-2" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">
            {notification.title}
          </p>
          <p className="text-xs text-[#8C9C92] mt-0.5 line-clamp-2">
            {notification.body}
          </p>
          <p className="text-xs text-[#8C9C92]/60 mt-1">
            {relativeTime(notification.created_at)}
          </p>
        </div>
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose: _onClose }: NotificationPanelProps): ReactElement {
  const { t } = useTranslation('notifications');
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.results ?? [];

  const handleMarkAll = (): void => {
    markAllRead.mutate();
  };

  const handleMarkRead = (id: string): void => {
    markRead.mutate(id);
  };

  return (
    <div
      role="dialog"
      aria-label={t('bell.label')}
      className="absolute right-0 top-full mt-2 w-80 max-h-[480px] overflow-y-auto rounded-2xl bg-[#152018] border border-[#28382D] shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#28382D] shrink-0">
        <h2 className="text-sm font-semibold text-white">
          {t('bell.label')}
        </h2>
        {notifications.some((n) => !n.is_read) && (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markAllRead.isPending}
            className="text-xs text-[#E4B643] hover:text-[#D4A633] transition-colors disabled:opacity-50"
          >
            {t('bell.markAllRead')}
          </button>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="px-4 py-8">
          <BrandedLoader size="sm" label={t('bell.loading', 'Loading…')} fillParent={false} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-[#8C9C92]">
          {t('bell.empty')}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-[#28382D]">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onRead={handleMarkRead}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
