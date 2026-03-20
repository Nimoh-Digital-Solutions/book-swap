import { forwardRef, type ReactElement,useId } from 'react';

import clsx from 'clsx';

import type { FieldProps } from './Field.interface';

import styles from './Field.module.scss';

/**
 * Field
 *
 * A labelled, accessible form field.
 * Forwards the ref to the underlying `<input>` so it is compatible with
 * `react-hook-form`'s `register()` callback.
 *
 * @example
 * // Standalone
 * <Field label="Email" type="email" />
 *
 * // With react-hook-form register
 * <Field label="Email" error={errors.email?.message} {...register('email')} />
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, helperText, className, id: externalId, ...inputProps }, ref): ReactElement => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const hasError = Boolean(error);

    return (
      <div className={clsx(styles.wrapper, hasError && styles.hasError, className)}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>

        <input
          {...inputProps}
          ref={ref}
          id={id}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? hintId : undefined
          }
          className={styles.input}
        />

        {hasError && (
          <span id={errorId} role="alert" className={styles.error}>
            {error}
          </span>
        )}

        {!hasError && helperText && (
          <span id={hintId} className={styles.hint}>
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Field.displayName = 'Field';
