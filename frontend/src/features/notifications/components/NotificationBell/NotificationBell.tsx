/**
 * NotificationBell.tsx
 *
 * Bell icon button for the Header that:
 *  - Displays an unread-count badge (red dot + number)
 *  - Opens/closes the NotificationPanel on click
 *  - Maintains the real-time WebSocket connection for live updates
 *  - Closes when clicking outside or pressing Escape
 */
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useNotifications,useNotificationWebSocket } from '@features/notifications';
import { Bell } from 'lucide-react';

import { NotificationPanel } from '../NotificationPanel/NotificationPanel';

export interface NotificationBellProps {
  /** Whether the user is authenticated (gates the WS connection). */
  enabled?: boolean;
}

export function NotificationBell({ enabled = true }: NotificationBellProps): ReactElement {
  const { t } = useTranslation('notifications');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useNotifications();
  const unreadCount = data?.unread_count ?? 0;

  // Maintain the real-time WebSocket connection
  useNotificationWebSocket({ enabled });

  // Close on outside click
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleOutsideClick, handleKeyDown]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={
          unreadCount > 0
            ? t('bell.unreadCount', { count: unreadCount })
            : t('bell.label')
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative p-2 rounded-full text-white hover:text-[#E4B643] hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white leading-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  );
}
