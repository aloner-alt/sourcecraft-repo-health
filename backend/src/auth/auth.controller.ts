import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const STATE_COOKIE = 'yandex_oauth_state';
const SESSION_COOKIE = 'repo_health_session';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('yandex/login')
  @ApiOperation({ summary: 'Start Yandex ID authorization' })
  login(@Res() response: Response): void {
    const state = randomBytes(32).toString('base64url');
    response.cookie(STATE_COOKIE, state, this.cookieOptions(10 * 60 * 1_000));
    response.redirect(this.auth.getLoginUrl(state));
  }

  @Get('yandex/callback')
  @ApiOperation({ summary: 'Complete Yandex ID authorization' })
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const storedState = request.cookies?.[STATE_COOKIE] as string | undefined;
    response.clearCookie(STATE_COOKIE, this.cookieOptions());
    if (!code || !state || !storedState || !this.matches(state, storedState)) {
      throw new UnauthorizedException('Invalid Yandex OAuth state or code.');
    }
    const { sessionToken } = await this.auth.authenticate(code);
    response.cookie(
      SESSION_COOKIE,
      sessionToken,
      this.cookieOptions(7 * 24 * 60 * 60 * 1_000),
    );
    response.redirect(`${this.config.get('FRONTEND_URL', 'http://localhost:3001')}/auth/callback?success=true`);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the current Yandex ID session' })
  async me(@Req() request: Request) {
    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedException('Authentication required.');
    try {
      return await this.auth.verifySession(token);
    } catch {
      throw new UnauthorizedException('Session is invalid or expired.');
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear the current session' })
  logout(@Res() response: Response): void {
    response.clearCookie(SESSION_COOKIE, this.cookieOptions());
    response.status(204).send();
  }

  private cookieOptions(maxAge?: number) {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/',
      ...(maxAge ? { maxAge } : {}),
    };
  }

  private matches(left: string, right: string): boolean {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
