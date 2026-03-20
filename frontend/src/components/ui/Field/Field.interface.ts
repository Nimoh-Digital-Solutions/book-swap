import { InputHTMLAttributes } from 'react';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible label rendered above the input. */
  label: string;
  /**
   * Validation error message.
   * When present the input is styled with the error state and the message
   * is rendered below the field with `role="alert"`.
   */
  error?: string | undefined;
  /**
   * Optional hint shown below the input when there is no error.
   * Hidden by an error message when both are present.
   */
  helperText?: string | undefined;
}
