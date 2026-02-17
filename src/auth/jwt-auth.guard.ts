import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SecurityEventService } from '@/common/logging/security-event.service';
import { RequestContextService } from '@/common/logging/request-context.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly securityEvents: SecurityEventService,
    private readonly requestContext: RequestContextService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user) {
    if (err || !user) {
      const ctx = this.requestContext.get();
      this.securityEvents.logAuthFailure('jwt', 'Token validation failed', ctx?.ip);
      throw new UnauthorizedException();
    }
    return user;
  }
}
