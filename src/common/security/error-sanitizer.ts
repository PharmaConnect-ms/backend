/**
 * ERROR SANITIZER - POLICY: A. Secure Configuration
 * Sanitizes error messages to prevent information leakage
 * Meets requirement: "Error messages MUST be sanitized and MUST NOT reveal system-internal information"
 */

import { InternalServerErrorException } from '@nestjs/common';

export class ErrorSanitizer {
  /**
   * Sanitize error messages to prevent leaking sensitive information
   * Production errors should be generic; development can be verbose
   * @param originalError The original error from third-party service
   * @param context Brief context about the operation
   * @param isDevelopment Whether we're in development mode
   * @returns Sanitized error message
   */
  static sanitize(
    originalError: Error | unknown,
    context: string,
    isDevelopment: boolean = false,
  ): string {
    const errorMessage = originalError instanceof Error ? originalError.message : String(originalError);

    // Log full error in development and server logs
    if (isDevelopment) {
      console.warn(`[${context}] Original error: ${errorMessage}`);
    } else {
      // Only log in backend logs, not returned to client
      console.error(`[Security] Error in ${context}: ${this.maskSensitiveData(errorMessage)}`);
    }

    // Return generic message in production
    return `An error occurred while processing your request in ${context}. Please try again later.`;
  }

  /**
   * Mask sensitive data from error messages (API keys, tokens, etc.)
   */
  private static maskSensitiveData(message: string): string {
    const sensitivePatterns = [
      /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi, // JWT tokens
      /api[_-]?key[=:]\s*[^\s,}]*/gi, // API keys
      /secret[=:]\s*[^\s,}]*/gi, // Secrets
      /password[=:]\s*[^\s,}]*/gi, // Passwords
      /token[=:]\s*[^\s,}]*/gi, // Tokens
    ];

    let masked = message;
    for (const pattern of sensitivePatterns) {
      masked = masked.replace(pattern, '[REDACTED]');
    }
    return masked;
  }

  /**
   * Create a safe error for third-party API failures
   */
  static createSafeThirdPartyError(
    context: string,
    originalError: Error | unknown,
    isDevelopment: boolean = false,
  ): InternalServerErrorException {
    const sanitized = this.sanitize(originalError, context, isDevelopment);
    return new InternalServerErrorException(sanitized);
  }
}
