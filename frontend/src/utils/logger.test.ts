import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Stub Sentry before importing logger
vi.mock('@configs/sentry', () => ({
  addBreadcrumb: vi.fn(),
}));

import { addBreadcrumb } from '@configs/sentry';

import { logger } from './logger';

describe('logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    vi.mocked(addBreadcrumb).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logger.debug writes to console.debug in dev mode', () => {
    logger.debug('test message');
    expect(consoleSpy.debug).toHaveBeenCalled();
  });

  it('logger.info writes to console.info in dev mode', () => {
    logger.info('info message');
    expect(consoleSpy.info).toHaveBeenCalled();
  });

  it('logger.warn writes to console.warn', () => {
    logger.warn('warning message');
    expect(consoleSpy.warn).toHaveBeenCalled();
  });

  it('logger.error writes to console.error', () => {
    logger.error('error message');
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('logger.warn includes context in the output', () => {
    logger.warn('warn with context', { key: 'value' });
    expect(consoleSpy.warn).toHaveBeenCalled();
    // In dev mode, context is passed as a separate argument
    const args = consoleSpy.warn.mock.calls[0];
    expect(args).toBeDefined();
    // At least the message pattern + style + message text should be present
    expect(args!.length).toBeGreaterThanOrEqual(3);
  });

  it('exposes debug, info, warn, error methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('passes only fmt + style args when no context is provided (devFormat no-context branch)', () => {
    logger.debug('no context message');
    const args = consoleSpy.debug.mock.calls[0]!;
    // With no context, devFormat returns [prefix, style, message] — 3 args
    expect(args).toHaveLength(3);
  });

  it('passes context as a 4th arg when context is provided (devFormat context branch)', () => {
    logger.info('with context', { userId: '42' });
    const args = consoleSpy.info.mock.calls[0]!;
    // With context, devFormat returns [prefix, style, message, context] — 4 args
    expect(args).toHaveLength(4);
    expect(args[3]).toEqual({ userId: '42' });
  });
});

// ---------------------------------------------------------------------------
// Production-mode paths (jsonFormat + Sentry breadcrumbs)
// ---------------------------------------------------------------------------

describe('logger (production mode)', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };
  const originalDev = import.meta.env.DEV;

  beforeEach(() => {
    // Switch to production path for the duration of each test
    import.meta.env.DEV = false;
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    vi.mocked(addBreadcrumb).mockClear();
  });

  afterEach(() => {
    import.meta.env.DEV = originalDev;
    vi.restoreAllMocks();
  });

  it('writes a JSON string to console in production mode (jsonFormat)', () => {
    logger.debug('prod message');
    const [arg] = consoleSpy.debug.mock.calls[0]!;
    expect(typeof arg).toBe('string');
    const parsed = JSON.parse(arg as string) as Record<string, unknown>;
    expect(parsed.level).toBe('debug');
    expect(parsed.message).toBe('prod message');
  });

  it('sends a Sentry breadcrumb for warn in production mode', () => {
    logger.warn('prod warning');
    expect(vi.mocked(addBreadcrumb)).toHaveBeenCalledWith(
      'prod warning',
      'logger',
      expect.objectContaining({ level: 'warning' }),
    );
  });

  it('sends a Sentry breadcrumb for error in production mode', () => {
    logger.error('prod error', { code: 'E001' });
    expect(vi.mocked(addBreadcrumb)).toHaveBeenCalledWith(
      'prod error',
      'logger',
      expect.objectContaining({ level: 'error', code: 'E001' }),
    );
  });

  it('does NOT send a Sentry breadcrumb for debug in production mode', () => {
    logger.debug('just noise');
    expect(vi.mocked(addBreadcrumb)).not.toHaveBeenCalled();
  });
});
