import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppLoggerService } from './logging/app-logger.service';
import { RequestContextService } from './logging/request-context.service';
import { SecurityEventService } from './logging/security-event.service';
import { HttpLoggingInterceptor } from './logging/http-logging.interceptor';
import { GlobalHttpExceptionFilter } from './logging/http-exception.filter';
import { AuditLogService } from './audit/audit-log.service';
import { PhiAuditInterceptor } from './audit/phi-audit.interceptor';
import { LoginRateLimitGuard } from './security/login-rate-limit.guard';

@Global()
@Module({
  providers: [
    RequestContextService,
    AppLoggerService,
    SecurityEventService,
    AuditLogService,
    LoginRateLimitGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PhiAuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
  ],
  exports: [
    RequestContextService,
    AppLoggerService,
    SecurityEventService,
    AuditLogService,
    LoginRateLimitGuard,
  ],
})
export class CommonModule {}
