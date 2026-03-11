import {
  CanActivate,
  ExecutionContext,
  Injectable,
  TooManyRequestsException,
} from '@nestjs/common';
import { SecurityEventService } from '@/common/logging/security-event.service';

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly windowMs = 60_000;
  private readonly maxAttempts = 10;
  private readonly attempts = new Map<string, { count: number; startedAt: number }>();

  constructor(private readonly securityEvents: SecurityEventService) {}

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest();

    const key = `${req.ip ?? 'unknown'}:${req.path ?? req.url ?? '/auth/login'}`;
    const now = Date.now();
    const existing = this.attempts.get(key);

    if (!existing || now - existing.startedAt > this.windowMs) {
      this.attempts.set(key, { count: 1, startedAt: now });
      return true;
    }

    existing.count += 1;
    if (existing.count > this.maxAttempts) {
      this.securityEvents.logRateLimitTriggered(req.path ?? req.url ?? '/auth/login', key);
      throw new TooManyRequestsException('Too many login attempts. Try again later.');
    }

    return true;
  }
}
