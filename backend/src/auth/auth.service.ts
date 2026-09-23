import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SessionUser, YandexProfile } from './auth.types';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  getLoginUrl(state: string): string {
    const url = new URL('https://oauth.yandex.ru/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.required('YANDEX_CLIENT_ID'));
    url.searchParams.set('redirect_uri', this.required('YANDEX_CALLBACK_URL'));
    url.searchParams.set('state', state);
    return url.toString();
  }

  async authenticate(code: string): Promise<{
    user: SessionUser;
    sessionToken: string;
  }> {
    const accessToken = await this.exchangeCode(code);
    const profile = await this.getProfile(accessToken);
    const storedUser = await this.prisma.user.upsert({
      where: { yandexId: profile.id },
      create: {
        yandexId: profile.id,
        login: profile.login,
        email: profile.default_email ?? null,
        name: profile.display_name ?? profile.real_name ?? null,
      },
      update: {
        login: profile.login,
        email: profile.default_email ?? null,
        name: profile.display_name ?? profile.real_name ?? null,
      },
    });
    const user: SessionUser = {
      id: storedUser.id,
      sub: profile.id,
      login: profile.login,
      ...(profile.default_email ? { email: profile.default_email } : {}),
      ...(profile.display_name || profile.real_name
        ? { name: profile.display_name ?? profile.real_name }
        : {}),
    };
    return {
      user,
      sessionToken: await this.jwt.signAsync(user, { expiresIn: '7d' }),
    };
  }

  verifySession(token: string): Promise<SessionUser> {
    return this.jwt.verifyAsync<SessionUser>(token);
  }

  private async exchangeCode(code: string): Promise<string> {
    const credentials = Buffer.from(
      `${this.required('YANDEX_CLIENT_ID')}:${this.required('YANDEX_CLIENT_SECRET')}`,
    ).toString('base64');
    const response = await this.request('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.required('YANDEX_CALLBACK_URL'),
      }),
    });
    const body = (await response.json()) as {
      access_token?: string;
      error_description?: string;
    };
    if (!response.ok || !body.access_token) {
      throw new UnauthorizedException(
        body.error_description ?? 'Yandex rejected the authorization code.',
      );
    }
    return body.access_token;
  }

  private async getProfile(accessToken: string): Promise<YandexProfile> {
    const response = await this.request(
      'https://login.yandex.ru/info?format=json',
      { headers: { Authorization: `OAuth ${accessToken}` } },
    );
    if (!response.ok) {
      throw new UnauthorizedException('Yandex profile request was rejected.');
    }
    return (await response.json()) as YandexProfile;
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new BadGatewayException('Yandex ID is unavailable.');
    }
  }

  private required(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new ServiceUnavailableException(`${key} is not configured.`);
    }
    return value;
  }
}
