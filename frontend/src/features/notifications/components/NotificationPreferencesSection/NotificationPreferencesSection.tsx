/**
 * NotificationPreferencesSection.tsx
 *
 * Email notification preferences section for the SettingsPage (US-901).
 * Renders togglable switches for all six email notification types.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { NotificationPreferences } from '@features/notifications';
import {
  useNotificationPreferences,
  usePatchNotificationPreferences,
} from '@features/notifications';
import { Bell } from 'lucide-react';

type PrefKey = keyof Omit<NotificationPreferences, never>;

const PREF_KEYS: PrefKey[] = [
  'email_new_request',
  'email_request_accepted',
  'email_request_declined',
  'email_new_message',
  'email_exchange_completed',
  'email_rating_received',
];

export function NotificationPreferencesSection(): ReactElement {
  const { t } = useTranslation('notifications');
  const { data: prefs, isLoading } = useNotificationPreferences();
  const patch = usePatchNotificationPreferences();

  const handleToggle = (key: PrefKey, value: boolean): void => {
    patch.mutate({ [key]: value });
  };

  return (
    <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-[#E4B643]" aria-hidden="true" />
        <h2 className="text-lg font-bold text-white">
          {t('preferences.title')}
        </h2>
      </div>
      <p className="text-sm text-[#8C9C92]">
        {t('preferences.description')}
      </p>

      {isLoading ? (
        <div className="text-sm text-[#8C9C92]">Loading…</div>
      ) : (
        <ul className="space-y-3">
          {PREF_KEYS.map((key) => {
            const checked = prefs?.[key] ?? true;
            return (
              <li key={key} className="flex items-center justify-between">
                <label
                  htmlFor={`pref-${key}`}
                  className="text-sm text-[#C8D8CE] cursor-pointer select-none"
                >
                  {t(`preferences.${key}`)}
                </label>
                <button
                  id={`pref-${key}`}
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  onClick={() => handleToggle(key, !checked)}
                  disabled={patch.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E4B643] disabled:opacity-50 ${
                    checked ? 'bg-[#E4B643]' : 'bg-[#28382D]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                  <span className="sr-only">
                    {checked ? 'Enabled' : 'Disabled'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
