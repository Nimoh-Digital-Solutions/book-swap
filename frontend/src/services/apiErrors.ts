import type { ProblemDetail } from '@nimoh-digital-solutions/tast-utils';
import { HttpError } from '@nimoh-digital-solutions/tast-utils';

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

/**
 * Checks whether an unknown value conforms to the RFC 7807 ProblemDetail
 * shape returned by nimoh_base Django/DRF backends (RFC 7807).
 */
function isProblemDetail(value: unknown): value is ProblemDetail {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['type'] === 'string' &&
    typeof obj['title'] === 'string' &&
    typeof obj['status'] === 'number'
  );
}

/**
 * Checks whether the value is a standard DRF field-level error body:
 * `{ "field_name": ["Error msg"], "non_field_errors": ["msg"] }`
 *
 * DRF returns this for 400 validation errors — fields at root level, each
 * mapping to an array of error strings.
 */
function isDrfFieldErrors(
  value: unknown,
): value is Record<string, string[]> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  // Heuristic: at least one key whose value is an array of strings.
  // Exclude DRF "detail"-only responses which are handled separately.
  return Object.values(obj).some(
    (v) =>
      Array.isArray(v) && v.length > 0 && v.every((i) => typeof i === 'string'),
  );
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse an `HttpError` body into a typed `ProblemDetail`.
 *
 * Returns `null` when the body doesn't match the RFC 7807 shape — callers
 * should fall back to a generic error message in that case.
 *
 * @example
 * try { await http.post('/items', data); }
 * catch (err) {
 *   const problem = parseProblemDetail(err);
 *   if (problem) { handleProblem(problem); }
 * }
 */
export function parseProblemDetail(error: unknown): ProblemDetail | null {
  if (error instanceof HttpError && isProblemDetail(error.body)) {
    return error.body;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Form-error mapping
// ---------------------------------------------------------------------------

/**
 * Shape compatible with React Hook Form's `setError` call:
 * ```ts
 * for (const { name, message } of errors) {
 *   setError(name, { type: 'server', message });
 * }
 * ```
 */
export interface FieldError {
  name: string;
  message: string;
}

/**
 * Maps `invalid_params` from a ProblemDetail into an array of
 * `{ name, message }` objects that can be fed directly to RHF `setError`.
 *
 * Also handles the `detail` field when it's a record of field → messages[]
 * (some DRF serializers return errors in that shape instead of `invalid_params`).
 *
 * @returns Array of field errors, or empty array if none found.
 *
 * @example
 * const problem = parseProblemDetail(err);
 * if (problem) {
 *   const fieldErrors = mapProblemToFieldErrors(problem);
 *   fieldErrors.forEach(({ name, message }) => setError(name, { type: 'server', message }));
 * }
 */
export function mapProblemToFieldErrors(problem: ProblemDetail): FieldError[] {
  const errors: FieldError[] = [];

  // 1. `invalid_params` — RFC 7807 extension used by nimoh_base
  if (problem.invalid_params) {
    for (const param of problem.invalid_params) {
      errors.push({ name: param.name, message: param.reason });
    }
  }

  // 2. `detail` as Record<field, string[]> — DRF serializer validation errors
  if (typeof problem.detail === 'object' && problem.detail !== null) {
    for (const [field, messages] of Object.entries(problem.detail)) {
      if (Array.isArray(messages)) {
        // Use the first message for each field (RHF shows one error at a time)
        const first = messages[0];
        if (typeof first === 'string') {
          errors.push({ name: field, message: first });
        }
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// DRF-native error parsing (non-RFC 7807)
// ---------------------------------------------------------------------------

/**
 * Parse standard DRF field-level validation errors from an HttpError body.
 *
 * DRF returns `{ "field": ["error1", "error2"], "non_field_errors": ["msg"] }`
 * at the root level for 400 responses. This format does NOT conform to
 * RFC 7807 — it has no `type`, `title`, or `status` fields.
 *
 * Returns an array of `{ name, message }` suitable for RHF `setError()`.
 * `non_field_errors` are mapped to the `root` field name.
 */
export function parseDrfFieldErrors(error: unknown): FieldError[] {
  if (!(error instanceof HttpError)) return [];
  if (!isDrfFieldErrors(error.body)) return [];

  const errors: FieldError[] = [];
  for (const [field, messages] of Object.entries(error.body)) {
    const first = messages[0];
    if (typeof first === 'string') {
      // Map DRF's `non_field_errors` to RHF's `root` error key
      const name = field === 'non_field_errors' ? 'root' : field;
      errors.push({ name, message: first });
    }
  }
  return errors;
}

/**
 * Extract the `detail` string from a standard DRF error response.
 *
 * DRF returns `{ "detail": "Human-readable message" }` for 401, 402, 403,
 * 404, 429, etc. Returns `null` when the body doesn't have a `detail` string.
 */
export function getDrfDetailMessage(error: unknown): string | null {
  if (!(error instanceof HttpError)) return null;
  if (
    typeof error.body === 'object' &&
    error.body !== null &&
    'detail' in error.body
  ) {
    const detail = (error.body as Record<string, unknown>)['detail'];
    if (typeof detail === 'string' && detail.length > 0) return detail;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Human-readable message extraction
// ---------------------------------------------------------------------------

/**
 * Extract a single human-readable error message from a ProblemDetail.
 * Prefers `detail` (when it's a string) → `title` → fallback.
 */
export function getErrorMessage(
  problem: ProblemDetail,
  fallback = 'An unexpected error occurred',
): string {
  if (typeof problem.detail === 'string' && problem.detail.length > 0) {
    return problem.detail;
  }
  if (problem.title.length > 0) {
    return problem.title;
  }
  return fallback;
}

/**
 * Convenience: extract a human-readable message from any caught error.
 * Handles HttpError → ProblemDetail, plain Error, and unknown values.
 */
export function getHttpErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred',
): string {
  const problem = parseProblemDetail(error);
  if (problem) return getErrorMessage(problem, fallback);

  if (error instanceof HttpError) {
    return `HTTP Error ${error.status}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
