import { APP_CONFIG } from '@configs';
import { useDocumentTitle as _useDocumentTitle } from '@nimoh-digital-solutions/tast-hooks';

/**
 * useDocumentTitle — app-level wrapper around the tast-hooks primitive.
 *
 * Automatically appends APP_CONFIG.appName so every page title is branded
 * consistently without each call site having to pass the app name.
 *
 * @example
 * useDocumentTitle('Home');
 * // document.title => "Home | React Starter Kit"
 *
 * To use without the app name prefix, import directly from the package:
 * import { useDocumentTitle } from '@nimoh-digital-solutions/tast-hooks';
 */
export function useDocumentTitle(title: string): void {
  _useDocumentTitle(title, APP_CONFIG.appName);
}
