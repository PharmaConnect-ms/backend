import { Injectable, Logger } from '@nestjs/common';

/**
 * Log Sanitization Service
 * Implements controls for safe logging of sensitive data
 * - Removes PHI from log messages
 * - Sanitizes error messages
 * - Prevents accidental credential exposure
 */
@Injectable()
export class LogSanitizationService {
  private readonly logger = new Logger('LogSanitization');

  // Sensitive patterns to redact
  private readonly SENSITIVE_PATTERNS = [
    { pattern: /password\s*[:=]\s*["']?[^"'\s,}]+["']?/gi, replacement: 'password: [REDACTED]' },
    { pattern: /apikey\s*[:=]\s*["']?[^"'\s,}]+["']?/gi, replacement: 'apikey: [REDACTED]' },
    { pattern: /secret\s*[:=]\s*["']?[^"'\s,}]+["']?/gi, replacement: 'secret: [REDACTED]' },
    { pattern: /token\s*[:=]\s*["']?[^"'\s,}]+["']?/gi, replacement: 'token: [REDACTED]' },
    { pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, replacement: 'Bearer [REDACTED]' },
    // Email addresses (partial redaction)
    { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL_REDACTED]' },
    // Phone numbers
    { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
    // SSN pattern (xxx-xx-xxxx)
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
    // Credit card patterns
    { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CC_REDACTED]' },
    // JWT tokens
    { pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, replacement: '[JWT_REDACTED]' },
  ];

  /**
   * Sanitize a log message
   * Removes sensitive data while preserving readability
   */
  sanitizeLogMessage(message: string): string {
    if (!message) return message;

    let sanitized = message;

    // Apply all sanitization patterns
    this.SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
      sanitized = sanitized.replace(pattern, replacement);
    });

    return sanitized;
  }

  /**
   * Sanitize an error or exception
   * Removes sensitive data from error stack traces
   */
  sanitizeError(error: any): any {
    if (!error) return error;

    const sanitized = { ...error };

    if (error.message) {
      sanitized.message = this.sanitizeLogMessage(error.message);
    }

    if (error.stack) {
      sanitized.stack = this.sanitizeLogMessage(error.stack);
    }

    return sanitized;
  }

  /**
   * Sanitize entire object (typically request/response data)
   * Recursively removes sensitive fields
   */
  sanitizeObject(obj: any, fieldsToRedact: string[] = []): any {
    if (!obj) return obj;

    const defaultSensitiveFields = [
      'password',
      'secret',
      'token',
      'apiKey',
      'api_key',
      'accessToken',
      'refreshToken',
      'creditCard',
      'ssn',
      'socialSecurityNumber',
      'privateKey',
      'private_key',
    ];

    const allSensitiveFields = [...defaultSensitiveFields, ...fieldsToRedact];

    if (typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item, fieldsToRedact));
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (allSensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value, fieldsToRedact);
      } else {
        sanitized[key] = this.sanitizeLogMessage(String(value));
      }
    }

    return sanitized;
  }

  /**
   * Log a message safely
   * Automatically sanitizes before logging
   */
  logSafely(message: string, context?: string, data?: any): void {
    const sanitizedMessage = this.sanitizeLogMessage(message);
    const sanitizedData = data ? this.sanitizeObject(data) : undefined;

    if (sanitizedData) {
      this.logger.log(sanitizedMessage, JSON.stringify(sanitizedData), context);
    } else {
      this.logger.log(sanitizedMessage, context);
    }
  }

  /**
   * Log an error safely
   * Automatically sanitizes error details
   */
  logErrorSafely(
    message: string,
    error: any,
    context?: string,
  ): void {
    const sanitizedMessage = this.sanitizeLogMessage(message);
    const sanitizedError = this.sanitizeError(error);

    this.logger.error(sanitizedMessage, sanitizedError.stack || sanitizedError.message, context);
  }

  /**
   * Create a safe response object for API consumers
   * Removes internal error details that could leak information
   */
  createSafeErrorResponse(error: any, isDevelopment: boolean = false): {
    message: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    details?: string;
  } {
    return {
      message: 'An error occurred processing your request',
      statusCode: error.status || 500,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { details: this.sanitizeLogMessage(error.message) }),
    };
  }

  /**
   * Audit log for data access (PII/PHI)
   * Logs access attempts with sanitization
   */
  auditDataAccess(
    userId: string | number,
    action: string,
    dataType: string,
    recordId: string | number,
    success: boolean,
    reason?: string,
  ): void {
    const logMessage = `DATA_ACCESS: user=${userId} action=${action} type=${dataType} record=${recordId} success=${success}${reason ? ` reason=${reason}` : ''}`;
    this.logger.log(logMessage, 'AUDIT_TRAIL');
  }
}
