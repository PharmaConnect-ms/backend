import { Injectable } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';

@Injectable()
export class SecurityEventService {
  private readonly failedLoginWindowMs = 10 * 60 * 1000;
  private readonly failedLoginThreshold = 5;
  private readonly failedLoginMap = new Map<string, { count: number; firstSeen: number }>();

  constructor(private readonly logger: AppLoggerService) {}

  logAuthSuccess(userId: number | string | undefined, method: string): void {
    this.logger.info('Authentication success', { userId, method }, { context: 'security', event: 'auth.login.success' });
  }

  logAuthFailure(usernameOrEmail: string, reason: string, ip?: string): void {
    const key = `${usernameOrEmail}:${ip ?? 'unknown'}`;
    const now = Date.now();
    const existing = this.failedLoginMap.get(key);

    if (!existing || now - existing.firstSeen > this.failedLoginWindowMs) {
      this.failedLoginMap.set(key, { count: 1, firstSeen: now });
    } else {
      existing.count += 1;
      if (existing.count >= this.failedLoginThreshold) {
        this.logger.warn('Suspicious repeated login failures detected', {
          usernameOrEmail,
          ip,
          failures: existing.count,
          windowMs: this.failedLoginWindowMs,
        }, { context: 'security', event: 'security.suspicious.repeated-failures' });
      }
    }

    this.logger.warn('Authentication failure', { usernameOrEmail, reason, ip }, { context: 'security', event: 'auth.login.failure' });
  }

  logLogout(userId: number | string | undefined): void {
    this.logger.info('Logout success', { userId }, { context: 'security', event: 'auth.logout.success' });
  }

  logAuthorizationFailure(statusCode: number, path: string): void {
    this.logger.warn('Authorization failure', { statusCode, path }, { context: 'security', event: 'authz.failure' });
  }

  logAdminAction(action: string, targetUserId: number | string, changes?: Record<string, unknown>): void {
    this.logger.info('Admin action executed', { action, targetUserId, changes }, { context: 'security', event: 'admin.action' });
  }

  logRateLimitTriggered(path: string, key: string): void {
    this.logger.warn('Rate limit triggered', { path, key }, { context: 'security', event: 'security.rate-limit.triggered' });
  }
}
