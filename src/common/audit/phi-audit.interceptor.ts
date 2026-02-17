import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuditLogService, PhiAction } from '@/common/audit/audit-log.service';

@Injectable()
export class PhiAuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const path = (req.path ?? req.url ?? '') as string;
    const resource = this.mapResource(path);

    if (!resource) {
      return next.handle();
    }

    const action = this.mapAction(req.method as string);
    const patientId = req.params?.patientId ?? req.body?.patientId ?? req.query?.patientId;
    const recordId = req.params?.id ?? req.params?.bookId ?? req.params?.appointmentId ?? req.body?.id;

    return next.handle().pipe(
      tap(() => {
        void this.auditLogService.writePhiAuditEvent({
          action,
          resource,
          patientId,
          recordId,
          status: 'success',
        });
      }),
      catchError((error: unknown) => {
        void this.auditLogService.writePhiAuditEvent({
          action,
          resource,
          patientId,
          recordId,
          status: 'failure',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
        return throwError(() => error);
      }),
    );
  }

  private mapAction(method: string): PhiAction {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'CREATE';
      case 'PATCH':
      case 'PUT':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'VIEW';
    }
  }

  private mapResource(path: string): string | null {
    if (path.startsWith('/prescription')) return 'prescription';
    if (path.startsWith('/condition-books')) return 'condition_book';
    if (path.startsWith('/book-entry')) return 'book_entry';
    if (path.startsWith('/follow-up')) return 'follow_up';
    if (path.startsWith('/users/patient')) return 'patient_profile';
    if (path.startsWith('/appointment')) return 'appointment';
    return null;
  }
}
