import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './session-auth.guard';

describe('SessionAuthGuard', () => {
  const auth = { verifySession: jest.fn() } as unknown as AuthService;
  const guard = new SessionAuthGuard(auth);

  function context(cookies: Record<string, string>): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ cookies }) }),
    } as unknown as ExecutionContext;
  }

  it('accepts a valid session cookie', async () => {
    (auth.verifySession as jest.Mock).mockResolvedValue({ sub: 'user-1' });
    await expect(
      guard.canActivate(context({ repo_health_session: 'jwt' })),
    ).resolves.toBe(true);
  });

  it('rejects a missing session cookie', async () => {
    await expect(guard.canActivate(context({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
