import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationVariant = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  message: string;
  variant: NotificationVariant;
  /** Auto-dismiss after this many milliseconds. 0 = never. Default 5000 */
  duration: number;
}

interface AppStore {
  // ---- Notifications -------------------------------------------------------
  notifications: Notification[];
  /** Push a new notification. Returns the generated id. */
  addNotification: (
    message: string,
    options?: Partial<Omit<Notification, 'id' | 'message'>>,
  ) => string;
  /** Remove a notification by id. */
  dismissNotification: (id: string) => void;
  /** Remove all notifications. */
  clearNotifications: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * useAppStore — global application state via Zustand.
 *
 * Conventions:
 *  - Only truly global, cross-feature state belongs here.
 *  - Feature-local state lives in the feature's own hooks (e.g. useAuth).
 *  - Server cache / async data belongs in React Query (or SWR), not here.
 *
 * See STATE_MANAGEMENT.md for a longer explanation and worked examples.
 */
export const useAppStore = create<AppStore>()(devtools((set, _get) => ({
  // ---- Notifications -------------------------------------------------------
  notifications: [],

  addNotification: (message, options = {}) => {
    const id = crypto.randomUUID();
    const notification: Notification = {
      id,
      message,
      variant: options.variant ?? 'info',
      duration: options.duration ?? 5000,
    };
    set(state => ({ notifications: [...state.notifications, notification] }));
    return id;
  },

  dismissNotification: id =>
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}), { name: 'AppStore', enabled: import.meta.env.DEV }));
