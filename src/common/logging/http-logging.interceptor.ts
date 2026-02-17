import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from './app-logger.service';
import { RequestContextService } from './request-context.service';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly requestContext: RequestContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const startedAt = Date.now();
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (req.user) {
      this.requestContext.set({ userId: req.user.id ?? req.user.sub, userRole: req.user.role });
    }

    this.logger.info('Incoming request', {
      params: req.params,
      query: req.query,
    }, { context: 'http', event: 'http.request.in' });

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startedAt;
        const statusCode = res?.statusCode ?? 200;

        this.logger.info('Outgoing response', {
          statusCode,
          durationMs,
        }, { context: 'http', event: 'http.response.out' });
      }),
    );
  }
}
