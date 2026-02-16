/**
 * WEBHOOK SIGNATURE VALIDATOR - POLICY: C. Webhook Security (Zoom)
 * Validates webhook signatures and timestamps to prevent replay attacks
 * Meets requirements:
 * - "Webhook requests MUST be verified by signature or HMAC"
 * - "Webhook endpoints MUST check the freshness of timestamps to avoid replay attack"
 */

import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface WebhookValidationConfig {
  /** Maximum age of webhook in milliseconds (default: 5 minutes) */
  maxAgeMs?: number;
  /** Secret key for HMAC validation */
  secret: string;
}

export class WebhookSignatureValidator {
  /**
   * Validate Zoom webhook signature and timestamp
   * Zoom sends: X-Zm-Request-Timestamp and X-Zm-Signature headers
   * @param payload Raw request body as string/buffer
   * @param timestamp From X-Zm-Request-Timestamp header
   * @param signature From X-Zm-Signature header
   * @param secret Zoom Webhook Secret from your app credentials
   * @param maxAgeMs Maximum age in milliseconds (default: 5 minutes)
   * @returns true if valid, throws BadRequestException if invalid
   */
  static validateZoomWebhook(
    payload: string | Buffer,
    timestamp: string,
    signature: string,
    secret: string,
    maxAgeMs: number = 5 * 60 * 1000, // 5 minutes default
  ): boolean {
    // 1. Validate timestamp freshness (prevent replay attacks)
    this.validateTimestampFreshness(timestamp, maxAgeMs);

    // 2. Calculate expected signature
    const payloadStr = typeof payload === 'string' ? payload : payload.toString();
    const expectedSignature = this.calculateZoomSignature(payloadStr, timestamp, secret);

    // 3. Compare signatures using constant-time comparison (prevent timing attacks)
    if (!this.constantTimeCompare(signature, expectedSignature)) {
      throw new BadRequestException('Invalid webhook signature. Request verification failed.');
    }

    return true;
  }

  /**
   * Validate generic HMAC webhook signature
   * @param payload Request body
   * @param signature Signature from webhook header
   * @param secret Shared secret key
   * @param algorithm HMAC algorithm (default: sha256)
   * @returns true if valid, throws BadRequestException if invalid
   */
  static validateHMACWebhook(
    payload: string | Buffer | object,
    signature: string,
    secret: string,
    algorithm: string = 'sha256',
  ): boolean {
    const payloadStr = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payloadStr)
      .digest('hex');

    if (!this.constantTimeCompare(signature, expectedSignature)) {
      throw new BadRequestException(
        `Invalid webhook signature. Signature verification failed for ${algorithm}.`,
      );
    }

    return true;
  }

  /**
   * Validate webhook request timestamp is fresh
   * @param timestamp ISO 8601 or milliseconds timestamp
   * @param maxAgeMs Maximum age in milliseconds
   * @throws BadRequestException if timestamp is too old
   */
  static validateTimestampFreshness(timestamp: string | number, maxAgeMs: number): void {
    let timestampMs: number;

    if (typeof timestamp === 'number') {
      timestampMs = timestamp;
    } else {
      // Try to parse as ISO 8601 or milliseconds
      const parsed = parseInt(timestamp, 10);
      timestampMs = isNaN(parsed) ? new Date(timestamp).getTime() : parsed;
    }

    if (isNaN(timestampMs)) {
      throw new BadRequestException('Invalid webhook timestamp format.');
    }

    const now = Date.now();
    const age = now - timestampMs;

    if (age > maxAgeMs) {
      throw new BadRequestException(
        `Webhook timestamp is too old. Maximum age: ${maxAgeMs}ms, Actual age: ${age}ms. This is a potential replay attack.`,
      );
    }

    if (age < -maxAgeMs) {
      // Timestamp is in the future
      throw new BadRequestException(
        'Webhook timestamp is in the future. Clock skew detected.',
      );
    }
  }

  /**
   * Calculate Zoom webhook signature
   * Zoom formula: base64( sha256( timestamp + token + request_body ) )
   */
  private static calculateZoomSignature(payload: string, timestamp: string, secret: string): string {
    const message = timestamp + payload;
    return crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('base64');
  }

  /**
   * Constant-time comparison to prevent timing attacks
   * Compares two strings/buffers in constant time
   */
  private static constantTimeCompare(a: string | Buffer, b: string | Buffer): boolean {
    const bufA = typeof a === 'string' ? Buffer.from(a, 'utf8') : a;
    const bufB = typeof b === 'string' ? Buffer.from(b, 'utf8') : b;

    if (bufA.length !== bufB.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < bufA.length; i++) {
      result |= bufA[i] ^ bufB[i];
    }

    return result === 0;
  }
}
