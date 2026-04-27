import { useCallback } from 'react';
import { type NavigateOptions,useNavigate, useParams } from 'react-router-dom';

/**
 * useLocaleNavigate — locale-aware wrapper around `useNavigate`.
 *
 * For **absolute** paths (starting with `/`) the current `:lng` param is
 * prepended automatically: `navigate('/login')` → `/en/login`.
 *
 * **Relative** paths and numeric history offsets are passed through unchanged.
 *
 * @example
 * const navigate = useLocaleNavigate();
 * navigate('/login');        // → /en/login
 * navigate(-1);              // → browser back
 * navigate('edit');           // → relative (appended to current route)
 */
export function useLocaleNavigate() {
  const navigate = useNavigate();
  const { lng = 'en' } = useParams<{ lng: string }>();

  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        void navigate(to);
        return;
      }

      const target = to.startsWith('/') ? `/${lng}${to}` : to;
      void navigate(target, options);
    },
    [navigate, lng],
  );
}
