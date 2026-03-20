import type { ReactElement } from 'react';

import { Toast } from '@components/ui/Toast/Toast';
import type { ToastItem } from '@hooks';

import styles from './ToastContainer.module.scss';

interface ToastContainerProps {
  /** Current list of toast notifications. */
  toasts: ToastItem[];
  /** Callback to dismiss a specific toast by id. */
  onDismiss: (id: string) => void;
}

/**
 * ToastContainer
 *
 * Renders a list of `<Toast>` items inside an `aria-live` region so that
 * screen readers announce each new notification as it appears.
 *
 * @see WCAG 2.1 SC 4.1.3 — Status Messages (Level AA)
 */
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps): ReactElement {
  return (
    <div
      className={styles.container}
      aria-live="polite"
      aria-relevant="additions removals"
      role="status"
    >
      {toasts.map((t) => (
        <Toast
          key={t.id}
          id={t.id}
          message={t.message}
          variant={t.variant}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
