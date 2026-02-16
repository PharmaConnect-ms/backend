import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Data Integrity Service
 * Implements controls for data integrity verification
 * - Digital signatures for non-repudiation
 * - Checksum verification
 * - Audit logging support
 */
@Injectable()
export class DataIntegrityService {
  /**
   * Generate digital signature for data
   * Uses HMAC-SHA256 for authentication and non-repudiation
   */
  generateSignature(data: string | object, secret: string): string {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto
      .createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Verify digital signature
   * Ensures data authentication and integrity
   */
  verifySignature(data: string | object, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Generate checksum for data integrity
   * Simple checksum for quick integrity verification
   */
  generateChecksum(data: string | object): string {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Verify checksum
   */
  verifyChecksum(data: string | object, checksum: string): boolean {
    const computedChecksum = this.generateChecksum(data);
    return crypto.timingSafeEqual(
      Buffer.from(computedChecksum),
      Buffer.from(checksum),
    );
  }

  /**
   * Create audit trail entry
   * Records data access and modifications
   */
  createAuditEntry(
    action: string,
    entityType: string,
    entityId: string | number,
    userId: string | number,
    changes?: Record<string, any>,
  ): AuditEntry {
    return {
      action,
      entityType,
      entityId: String(entityId),
      userId: String(userId),
      timestamp: new Date(),
      changes,
      checksum: this.generateChecksum({ entityType, entityId, action }),
    };
  }

  /**
   * Verify audit entry integrity
   */
  verifyAuditEntry(entry: AuditEntry): boolean {
    const expectedChecksum = this.generateChecksum({
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
    });
    return entry.checksum === expectedChecksum;
  }
}

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: Date;
  changes?: Record<string, any>;
  checksum: string;
}
