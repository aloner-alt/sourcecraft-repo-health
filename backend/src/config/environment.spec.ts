import { validateEnvironment } from './environment';

const validEnvironment = {
  DATABASE_URL: 'postgresql://repo_health:repo_health@localhost:5432/repo_health',
  AUTH_JWT_SECRET: '0123456789abcdef0123456789abcdef',
};

describe('validateEnvironment', () => {
  it('adds safe development defaults and converts ports to numbers', () => {
    expect(
      validateEnvironment({
        ...validEnvironment,
        PORT: '3100',
        REDIS_PORT: '6380',
      }),
    ).toEqual(
      expect.objectContaining({
        NODE_ENV: 'development',
        PORT: 3100,
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6380,
        FRONTEND_URL: 'http://localhost:3001',
        SOURCECRAFT_API_BASE_URL: 'https://api.sourcecraft.tech',
      }),
    );
  });

  it('rejects a missing database URL', () => {
    expect(() =>
      validateEnvironment({ AUTH_JWT_SECRET: validEnvironment.AUTH_JWT_SECRET }),
    ).toThrow('DATABASE_URL is required');
  });

  it('rejects the example JWT secret', () => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: validEnvironment.DATABASE_URL,
        AUTH_JWT_SECRET: 'replace-with-at-least-32-random-characters',
      }),
    ).toThrow('AUTH_JWT_SECRET must be a random secret');
  });

  it('requires Yandex client ID and secret together', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        YANDEX_CLIENT_ID: 'client-id',
      }),
    ).toThrow(
      'YANDEX_CLIENT_ID and YANDEX_CLIENT_SECRET must be configured together',
    );
  });

  it('requires the callback URL when Yandex OAuth is enabled', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        YANDEX_CLIENT_ID: 'client-id',
        YANDEX_CLIENT_SECRET: 'client-secret',
      }),
    ).toThrow('YANDEX_CALLBACK_URL is required');
  });

  it('accepts a complete Yandex OAuth configuration', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        YANDEX_CLIENT_ID: 'client-id',
        YANDEX_CLIENT_SECRET: 'client-secret',
        YANDEX_CALLBACK_URL: 'http://localhost:3000/api/auth/yandex/callback',
      }),
    ).not.toThrow();
  });
});
