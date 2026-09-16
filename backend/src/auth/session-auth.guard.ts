import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SessionUser } from './auth.types';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: SessionUser }
    >();
    const token = request.cookies?.repo_health_session as string | undefined;
    if (!token) throw new UnauthorizedException('Authentication required.');
    try {
      request.user = await this.auth.verifySession(token);
      return true;
    } catch {
      throw new UnauthorizedException('Session is invalid or expired.');
    }
  }
}
