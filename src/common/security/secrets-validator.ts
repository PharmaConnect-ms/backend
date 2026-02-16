/**
 * SECRETS VALIDATOR - POLICY: B. Secrets Management
 * Ensures secrets are properly managed and never exposed
 * Meets requirements:
 * - "Secrets MUST NOT be stored in source code repositories"
 * - "Secrets MUST NOT be exposed through frontend variables (NEXT_PUBLIC_*)"
 * - "Access to secrets MUST follow the principle of least privilege"
 */

import { BadRequestException, Logger } from '@nestjs/common';

export interface SecretsConfig {
  requiredSecrets: string[];
  optionalSecrets?: string[];
}

export class SecretsValidator {
  private static logger = new Logger('SecretsValidator');

  /**
   * Validate that all required secrets are configured
   * Should be called during application startup
   * @param requiredSecrets List of required environment variable names
   * @param optionalSecrets List of optional environment variable names
   * @throws BadRequestException if required secrets are missing
   */
  static validateRequired(requiredSecrets: string[], optionalSecrets: string[] = []): void {
    const missing: string[] = [];
    const missingOptional: string[] = [];

    for (const secret of requiredSecrets) {
      if (!process.env[secret]) {
        missing.push(secret);
      }
    }

    for (const secret of optionalSecrets) {
      if (!process.env[secret]) {
        missingOptional.push(secret);
      }
    }

    if (missing.length > 0) {
      const message = `Missing required environment variables: ${missing.join(', ')}`;
      this.logger.error(message);
      throw new BadRequestException(message);
    }

    if (missingOptional.length > 0) {
      this.logger.warn(
        `Optional environment variables not configured: ${missingOptional.join(', ')}`,
      );
    }

    this.logger.log('All required secrets are configured');
  }

  /**
   * Get a required secret with validation
   * Never expose secrets in error messages
   * @param secretName Name of the environment variable
   * @throws BadRequestException if secret is not configured
   * @returns The secret value
   */
  static getRequired(secretName: string): string {
    const value = process.env[secretName];

    if (!value) {
      const message = `Required secret '${secretName}' is not configured in environment variables.`;
      this.logger.error(message);
      throw new BadRequestException(message);
    }

    return value;
  }

  /**
   * Get an optional secret without throwing
   * @param secretName Name of the environment variable
   * @returns The secret value or undefined
   */
  static getOptional(secretName: string): string | undefined {
    return process.env[secretName];
  }

  /**
   * Validate that a value is not exposed in environment variable names
   * Useful to check that secrets are not in NEXT_PUBLIC_* variables
   */
  static validateNotExposedInFrontend(secretValue: string | undefined): void {
    if (!secretValue) {
      return;
    }

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('NEXT_PUBLIC_') && value === secretValue) {
        this.logger.error(
          `SECURITY VIOLATION: Secret value is exposed in frontend variable: ${key}`,
        );
        throw new BadRequestException(
          'Secret credential detected in frontend-exposed variable. This is a security violation.',
        );
      }
    }
  }

  /**
   * Check if a secret would be exposed through frontend
   * @param envVarName The environment variable name to check
   * @returns true if exposed in frontend, false if safe
   */
  static isExposedInFrontend(envVarName: string): boolean {
    return envVarName.startsWith('NEXT_PUBLIC_');
  }

  /**
   * Validate that no secrets are left hardcoded in source
   * This is a simple check for common patterns
   * In production, use static analysis tools
   */
  static validateNoHardcodedSecrets(sourceCode: string): { found: boolean; patterns: string[] } {
    const suspiciousPatterns = [
      /("api_key"|"apiKey"|"API_KEY")\s*:\s*"[^"]*"/g,
      /("secret"|"SECRET")\s*:\s*"[^"]*"/g,
      /("password"|"PASSWORD")\s*:\s*"[^"]*"/g,
      /("token"|"TOKEN")\s*:\s*"[^"]*"/g,
      /("jwt"|"JWT")\s*:\s*"[^"]*"/g,
    ];

    const found: string[] = [];

    for (const pattern of suspiciousPatterns) {
      const matches = sourceCode.match(pattern);
      if (matches) {
        found.push(...matches);
      }
    }

    return {
      found: found.length > 0,
      patterns: found,
    };
  }
}

/**
 * Define required secrets for each third-party integration
 */
export const INTEGRATION_SECRETS = {
  ZOOM: {
    required: ['ZOOM_ACCOUNT_ID', 'ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET'],
    optional: ['ZOOM_WEBHOOK_SECRET'],
  },
  OPENAI: {
    required: ['OPENAI_API_KEY'],
    optional: ['OPENAI_TIMEOUT_MS'],
  },
  GOOGLE: {
    required: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'],
    optional: [],
  },
  JWT: {
    required: ['JWT_SECRET'],
    optional: ['JWT_EXPIRES_IN'],
  },
  DATABASE: {
    required: ['DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_NAME'],
    optional: [],
  },
};
