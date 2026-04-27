import { env } from '@/configs/env';

describe('env', () => {
  it('has expected shape', () => {
    expect(env).toHaveProperty('apiUrl');
    expect(env).toHaveProperty('wsUrl');
    expect(env).toHaveProperty('environment');
    expect(typeof env.apiUrl).toBe('string');
  });

  it('wsUrl derives from apiUrl', () => {
    expect(env.wsUrl).toMatch(/^ws/);
  });
});
