import { type ReactElement } from 'react';
import { Link, type LinkProps, useParams } from 'react-router-dom';

/**
 * LocaleLink — drop-in replacement for React Router `<Link>` that
 * automatically prepends the current `/:lng` prefix to absolute paths.
 *
 * - Absolute `to` values (starting with `/`) → `/${lng}${to}`
 * - Relative `to` values, `To` objects, and hash-only strings are passed
 *   through to `<Link>` unchanged.
 *
 * @example
 * <LocaleLink to="/login">Sign in</LocaleLink>
 * // renders <a href="/en/login">Sign in</a> when lang is 'en'
 */
export function LocaleLink({ to, ...rest }: LinkProps): ReactElement {
  const { lng = 'en' } = useParams<{ lng: string }>();

  const localeTo =
    typeof to === 'string' && to.startsWith('/')
      ? `/${lng}${to}`
      : typeof to === 'string' && to.startsWith('#')
        ? `/${lng}/${to}`
        : to;

  return <Link to={localeTo} {...rest} />;
}
