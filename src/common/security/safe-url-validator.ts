/**
 * URL/REDIRECT VALIDATOR - POLICY: D. Safe Links / Redirects
 * Validates external URLs and redirects against a whitelist
 * Meets requirements:
 * - "External links and redirects MUST be limited to a list of trusted domains"
 * - "Open redirects MUST NOT be allowed"
 * - "URLs MUST NOT contain any authentication tokens or secrets"
 */

import { BadRequestException } from '@nestjs/common';

export interface TrustedDomainConfig {
  /** List of allowed domain patterns (can use wildcards: *.zoom.us) */
  domains: string[];
  /** If true, only exact domain matches are allowed; if false, subdomains are allowed */
  exactMatch?: boolean;
}

export class SafeURLValidator {
  /**
   * Validate that a URL is from a trusted domain
   * @param url URL to validate
   * @param trustedDomains List of allowed domains
   * @param exactMatch If true, only exact matches allowed (default: false, allows subdomains)
   * @throws BadRequestException if URL is not from a trusted domain
   * @returns true if valid
   */
  static validateTrustedDomain(
    url: string,
    trustedDomains: string[],
    exactMatch: boolean = false,
  ): boolean {
    try {
      // Validate URL format
      const parsed = new URL(url);

      // Ensure HTTPS only
      if (parsed.protocol !== 'https:') {
        throw new BadRequestException(
          'Only HTTPS URLs are allowed for third-party integrations.',
        );
      }

      const domain = parsed.hostname || '';

      // Check if domain is in trusted list
      const isTrusted = trustedDomains.some((trustedDomain) => {
        const pattern = this.domainToRegex(trustedDomain, exactMatch);
        return pattern.test(domain);
      });

      if (!isTrusted) {
        throw new BadRequestException(
          `Domain '${domain}' is not in the list of trusted domains.`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Invalid URL format: ${url}`);
    }
  }

  /**
   * Validate that a URL does not contain sensitive information (tokens, secrets)
   * @param url URL to check
   * @throws BadRequestException if sensitive data is detected
   * @returns true if safe
   */
  static validateNoSensitiveData(url: string): boolean {
    const sensitivePatterns = [
      /api[_-]?key/i,
      /secret/i,
      /token/i,
      /password/i,
      /auth/i,
      /session/i,
      /credential/i,
      /Bearer\s+/i,
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(url)) {
        throw new BadRequestException(
          'URL contains potential sensitive information. Authentication tokens or secrets must not be included in URLs.',
        );
      }
    }

    return true;
  }

  /**
   * Safely validate and sanitize external links
   * @param url URL to validate
   * @param trustedDomains List of allowed base domains
   * @returns Validated URL
   * @throws BadRequestException if validation fails
   */
  static validateExternalLink(url: string, trustedDomains: string[]): string {
    this.validateTrustedDomain(url, trustedDomains);
    this.validateNoSensitiveData(url);
    return url;
  }

  /**
   * Convert domain pattern (with wildcards) to regex
   * Examples:
   * - "zoom.us" → matches zoom.us and *.zoom.us
   * - "*.zoom.us" → matches *.zoom.us but not zoom.us
   * - "exact-domain.com" with exactMatch=true → only matches exact-domain.com
   */
  private static domainToRegex(domainPattern: string, exactMatch: boolean): RegExp {
    let pattern = domainPattern
      .toLowerCase()
      .replace(/\./g, '\\.') // Escape dots
      .replace(/\*/g, '[a-z0-9-]*'); // Convert wildcards to regex

    if (!exactMatch && !domainPattern.startsWith('*.')) {
      // Allow subdomains by default
      pattern = `(?:.*\\.)?${pattern}`;
    }

    return new RegExp(`^${pattern}$`);
  }

  /**
   * Create a whitelist configuration from environment variable
   * Format: "domain1.com,*.domain2.com,https://domain3.com"
   */
  static fromEnvString(envValue: string | undefined): string[] {
    if (!envValue) {
      return [];
    }

    return envValue
      .split(',')
      .map((domain) => domain.trim())
      .map((domain) => {
        // Remove protocol if present
        try {
          const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
          return url.hostname || domain;
        } catch {
          return domain;
        }
      })
      .filter((domain) => domain.length > 0);
  }
}

/**
 * Standard trusted domains for PharmaConnect third-party services
 */
export const PHARMACONNECT_TRUSTED_DOMAINS = {
  ZOOM: ['zoom.us', '*.zoom.us', 'zoom.com', '*.zoom.com'],
  JITSI: ['jitsi.org', '*.jitsi.org', 'meet.jit.si'],
  GOOGLE: ['google.com', '*.google.com', 'accounts.google.com'],
  OPENAI: ['openai.com', '*.openai.com', 'api.openai.com'],
};
