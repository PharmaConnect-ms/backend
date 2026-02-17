import { Injectable } from '@nestjs/common';
import { RequestContextService } from './request-context.service';
import { redactSensitive } from './redaction.util';

type LogLevel = 'info' | 'warn' | 'error';

interface LogOptions {
  context?: string;
  event?: string;
}

@Injectable()
export class AppLoggerService {
  private readonly noisyWindowMs = 1000;
  private readonly noisyCounts = new Map<string, { ts: number; count: number }>();

  constructor(private readonly context: RequestContextService) {}

  info(message: string, meta?: Record<string, unknown>, options?: LogOptions): void {
    this.write('info', message, meta, options);
  }

  warn(message: string, meta?: Record<string, unknown>, options?: LogOptions): void {
    this.write('warn', message, meta, options);
  }

  error(message: string, meta?: Record<string, unknown>, options?: LogOptions): void {
    this.write('error', message, meta, options);
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>, options?: LogOptions): void {
    const requestContext = this.context.get();
    const event = options?.event ?? message;
    const dedupeKey = `${level}:${event}:${requestContext?.path ?? ''}`;
    const now = Date.now();
    const existing = this.noisyCounts.get(dedupeKey);

    if (existing && now - existing.ts < this.noisyWindowMs) {
      existing.count += 1;
      if (existing.count > 10) {
        return;
      }
    } else {
      this.noisyCounts.set(dedupeKey, { ts: now, count: 1 });
    }

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      event,
      context: options?.context,
      requestId: requestContext?.requestId,
      method: requestContext?.method,
      path: requestContext?.path,
      ip: requestContext?.ip,
      userId: requestContext?.userId,
      role: requestContext?.userRole,
      meta: redactSensitive(meta ?? {}),
    };

    const serialized = JSON.stringify(payload);
    if (level === 'error') {
      console.error(serialized);
      return;
    }

    if (level === 'warn') {
      console.warn(serialized);
      return;
    }

    console.log(serialized);
  }
}
