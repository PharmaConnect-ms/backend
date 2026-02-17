import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';
import { SecurityEventService } from './security-event.service';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly securityEventService: SecurityEventService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttpException = exception instanceof HttpException;
    const httpException = isHttpException ? exception : null;
    const status = httpException ? httpException.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = httpException ? httpException.getResponse() : 'Internal server error';

    const message =
      typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse
        ? (exceptionResponse as { message?: string | string[] }).message
        : exceptionResponse;

    if (status === HttpStatus.FORBIDDEN) {
      this.securityEventService.logAuthorizationFailure(status, request.url as string);
    }

    this.logger.error('Request failed', {
      status,
      path: request.url,
      error: typeof message === 'string' ? message : JSON.stringify(message),
    }, { context: 'http', event: 'http.request.error' });

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.headers['x-request-id'],
    });
  }
}
