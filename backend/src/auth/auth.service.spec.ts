import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        YANDEX_CLIENT_ID: 'client-id',
        YANDEX_CLIENT_SECRET: 'client-secret',
        YANDEX_CALLBACK_URL: 'http://localhost:3000/api/auth/yandex/callback',
      };
      return values[key];
    }),
  } as unknown as ConfigService;
  const jwt = {
    signAsync: jest.fn().mockResolvedValue('session-jwt'),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  const service = new AuthService(config, jwt);

  afterEach(() => jest.restoreAllMocks());

  it('creates an authorization URL with callback and CSRF state', () => {
    const url = new URL(service.getLoginUrl('random-state'));
    expect(url.origin).toBe('https://oauth.yandex.ru');
    expect(url.searchParams.get('client_id')).toBe('client-id');
    expect(url.searchParams.get('state')).toBe('random-state');
    expect(url.searchParams.get('redirect_uri')).toContain('/auth/yandex/callback');
  });

  it('exchanges a code, loads the profile, and creates an app session', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'yandex-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'user-1',
            login: 'demo',
            client_id: 'client-id',
            default_email: 'demo@yandex.ru',
            display_name: 'Demo User',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );

    const result = await service.authenticate('authorization-code');

    expect(result).toEqual({
      user: {
        sub: 'user-1',
        login: 'demo',
        email: 'demo@yandex.ru',
        name: 'Demo User',
      },
      sessionToken: 'session-jwt',
    });
    expect(fetchMock.mock.calls[0][0]).toBe('https://oauth.yandex.ru/token');
    expect(fetchMock.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        headers: { Authorization: 'OAuth yandex-token' },
      }),
    );
  });
});
