import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { ArrowLeft, LockKeyhole } from 'lucide-react';

import { ForgotPasswordForm } from '../components/ForgotPasswordForm/ForgotPasswordForm';
import { authService } from '../services/auth.service';

import styles from './ForgotPasswordPage.module.scss';

/**
 * ForgotPasswordPage
 *
 * Route: /forgot-password
 *
 * Static split-panel layout (no animated panel swap — single-purpose page).
 * Left: form panel with ForgotPasswordForm.
 * Right: brand panel with BackgroundPaths (desktop only).
 */
export function ForgotPasswordPage() {
  useDocumentTitle(routeMetadata[PATHS.FORGOT_PASSWORD].title);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (email: string) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await authService.requestPasswordReset(email);
      setSubmittedEmail(email);
      setIsSuccess(true);
    } catch {
      setServerError(t('auth.forgotPassword.error', 'Something went wrong. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.root}>
      {/* ── Form panel ──────────────────────────────────────────────────── */}
      <div className={styles.formPanel}>
        <div className={styles.formContent}>
          {/* Logo */}
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>
              <LockKeyhole aria-hidden="true" />
            </div>
            <span className={styles.logoName}>App</span>
          </div>

          {/* Back to login */}
          <Link to={PATHS.LOGIN} className={styles.backLink}>
            <ArrowLeft aria-hidden="true" />
            {t('auth.forgotPassword.backToLogin', 'Back to Login')}
          </Link>

          <ForgotPasswordForm
            onSubmit={handleSubmit}
            onBack={() => void navigate(PATHS.LOGIN)}
            isLoading={isLoading}
            serverError={serverError}
            isSuccess={isSuccess}
            submittedEmail={submittedEmail}
          />
        </div>

        {/* Footer */}
        <p className={styles.copyright}>
          © {new Date().getFullYear()} App. All rights reserved.
        </p>
      </div>

      {/* ── Brand panel (desktop only) ─────────────────────────────────── */}
      <div className={styles.brandPanel} aria-hidden="true">
        <div className={styles.brandOverlay} />
        <div className={styles.brandBody}>
          <div className={styles.brandIconCircle}>
            <LockKeyhole />
          </div>
          <h2 className={styles.brandHeadline}>
            {t('auth.forgotPassword.brandHeadline', 'Recover Your Account')}
          </h2>
          <p className={styles.brandTagline}>
            {t(
              'auth.forgotPassword.brandTagline',
              "We'll help you regain access to your account in just a few steps.",
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
