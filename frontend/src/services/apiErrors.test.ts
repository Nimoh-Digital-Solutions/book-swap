import { HttpError } from '@nimoh-digital-solutions/tast-utils';
import { describe, expect,it } from 'vitest';

import {
  getErrorMessage,
  getHttpErrorMessage,
  mapProblemToFieldErrors,
  parseProblemDetail,
} from './apiErrors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create an HttpError with a JSON body. */
function httpError(status: number, body: unknown): HttpError {
  return new HttpError(status, body);
}

// ---------------------------------------------------------------------------
// parseProblemDetail
// ---------------------------------------------------------------------------

describe('parseProblemDetail', () => {
  it('extracts a ProblemDetail from an HttpError with valid body', () => {
    const error = httpError(400, {
      type: 'urn:validation-error',
      title: 'Validation Failed',
      status: 400,
      detail: 'One or more fields are invalid',
    });

    const result = parseProblemDetail(error);
    expect(result).toEqual({
      type: 'urn:validation-error',
      title: 'Validation Failed',
      status: 400,
      detail: 'One or more fields are invalid',
    });
  });

  it('returns null for a non-HttpError', () => {
    expect(parseProblemDetail(new Error('boom'))).toBeNull();
  });

  it('returns null when body is not a ProblemDetail shape', () => {
    const error = httpError(500, { message: 'Internal server error' });
    expect(parseProblemDetail(error)).toBeNull();
  });

  it('returns null when body is a string', () => {
    const error = httpError(502, 'Bad Gateway');
    expect(parseProblemDetail(error)).toBeNull();
  });

  it('returns null for null/undefined body', () => {
    expect(parseProblemDetail(httpError(500, null))).toBeNull();
    expect(parseProblemDetail(httpError(500, undefined))).toBeNull();
  });

  it('preserves optional fields like instance and invalid_params', () => {
    const body = {
      type: 'urn:validation-error',
      title: 'Validation Failed',
      status: 400,
      detail: 'Invalid input',
      instance: '/items/42',
      invalid_params: [{ name: 'email', reason: 'Required' }],
    };
    const result = parseProblemDetail(httpError(400, body));
    expect(result?.instance).toBe('/items/42');
    expect(result?.invalid_params).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// mapProblemToFieldErrors
// ---------------------------------------------------------------------------

describe('mapProblemToFieldErrors', () => {
  it('maps invalid_params to field errors', () => {
    const problem = {
      type: 'urn:validation-error',
      title: 'Validation Failed',
      status: 400,
      detail: 'Fields invalid',
      invalid_params: [
        { name: 'email', reason: 'Must be a valid email' },
        { name: 'password', reason: 'Too short' },
      ],
    };

    const errors = mapProblemToFieldErrors(problem);
    expect(errors).toEqual([
      { name: 'email', message: 'Must be a valid email' },
      { name: 'password', message: 'Too short' },
    ]);
  });

  it('maps DRF-style detail record to field errors', () => {
    const problem = {
      type: 'urn:validation-error',
      title: 'Validation Failed',
      status: 400,
      detail: {
        email: ['This field is required.', 'Must be unique.'],
        username: ['Already taken.'],
      },
    };

    const errors = mapProblemToFieldErrors(problem);
    expect(errors).toEqual([
      { name: 'email', message: 'This field is required.' },
      { name: 'username', message: 'Already taken.' },
    ]);
  });

  it('returns empty array when neither format is present', () => {
    const problem = {
      type: 'urn:some-error',
      title: 'Error',
      status: 400,
      detail: 'Something went wrong',
    };

    expect(mapProblemToFieldErrors(problem)).toEqual([]);
  });

  it('collects both invalid_params and detail record', () => {
    const problem = {
      type: 'urn:validation-error',
      title: 'Validation Failed',
      status: 400,
      detail: { email: ['Required'] },
      invalid_params: [{ name: 'name', reason: 'Required' }],
    };

    const errors = mapProblemToFieldErrors(problem);
    expect(errors).toEqual([
      { name: 'name', message: 'Required' },
      { name: 'email', message: 'Required' },
    ]);
  });
});

// ---------------------------------------------------------------------------
// getErrorMessage
// ---------------------------------------------------------------------------

describe('getErrorMessage', () => {
  it('returns detail string when present', () => {
    const problem = {
      type: 'urn:error',
      title: 'Error',
      status: 400,
      detail: 'Detailed explanation',
    };

    expect(getErrorMessage(problem, 'fallback')).toBe('Detailed explanation');
  });

  it('returns title when detail is a record', () => {
    const problem = {
      type: 'urn:error',
      title: 'Validation Failed',
      status: 400,
      detail: { email: ['Required'] },
    };

    expect(getErrorMessage(problem, 'fallback')).toBe('Validation Failed');
  });

  it('returns fallback when neither detail string nor title is meaningful', () => {
    const problem = {
      type: 'urn:error',
      title: '',
      status: 500,
      detail: '',
    };

    expect(getErrorMessage(problem, 'Something broke')).toBe('Something broke');
  });
});

// ---------------------------------------------------------------------------
// getHttpErrorMessage
// ---------------------------------------------------------------------------

describe('getHttpErrorMessage', () => {
  it('returns a message from an HttpError', () => {
    const error = httpError(400, {
      type: 'urn:error',
      title: 'Bad Request',
      status: 400,
      detail: 'Email is required',
    });

    expect(getHttpErrorMessage(error, 'fallback')).toBe('Email is required');
  });

  it('returns Error.message for non-HttpError', () => {
    expect(getHttpErrorMessage(new Error('oops'), 'fallback')).toBe('oops');
  });

  it('returns HTTP Error message when HttpError body is not a ProblemDetail', () => {
    const error = httpError(500, 'internal error');
    expect(getHttpErrorMessage(error, 'fallback')).toBe('HTTP Error 500');
  });
});
