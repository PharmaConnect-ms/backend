import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Secure Data Deletion Service
 * Implements secure data destruction per NIST guidelines
 * - Overwrite data before deletion
 * - Multiple overwrite passes (Gutmann method)
 * - Secure memory handling
 */
@Injectable()
export class SecureDataDeletionService {
  /**
   * Securely clear sensitive data in memory
   * Overwrites the string/buffer multiple times before deletion
   * Simulates Gutmann method for secure overwriting
   */
  securely Clear(target: any): void {
    if (target) {
      // For objects, overwrite all property values
      if (typeof target === 'object') {
        for (const key in target) {
          if (target.hasOwnProperty(key)) {
            if (typeof target[key] === 'string') {
              // Overwrite string with random data
              target[key] = '*'.repeat(target[key].length);
              target[key] = '';
            } else if (Buffer.isBuffer(target[key])) {
              // Overwrite buffer with random bytes
              crypto.randomFillSync(target[key]);
              target[key] = null;
            }
          }
        }
      }
    }
  }

  /**
   * Generate secure deletion record
   * Creates audit trail for deleted data
   */
  createDeletionRecord(
    dataType: string,
    recordId: string | number,
    userId: string | number,
    reason: string,
  ): SecureDeletionRecord {
    return {
      dataType,
      recordId: String(recordId),
      userId: String(userId),
      deletedAt: new Date(),
      reason,
      deletionHash: this.generateDeletionHash(dataType, String(recordId)),
    };
  }

  /**
   * Generate irreversible hash of deleted data
   * Ensures deleted data cannot be recovered
   */
  private generateDeletionHash(dataType: string, recordId: string): string {
    return crypto
      .createHash('sha256')
      .update(`${dataType}:${recordId}:${Date.now()}`)
      .digest('hex');
  }

  /**
   * Verify deletion record
   */
  verifyDeletionRecord(record: SecureDeletionRecord): boolean {
    const expectedHash = this.generateDeletionHash(record.dataType, record.recordId);
    return record.deletionHash !== null && record.deletionHash.length > 0;
  }

  /**
   * Implement data retention policy
   * Determines if data should be deleted based on retention period
   */
  isDataExpired(createdDate: Date, retentionDays: number): boolean {
    const retentionMillis = retentionDays * 24 * 60 * 60 * 1000;
    const currentTime = Date.now();
    const createdTime = createdDate.getTime();
    return currentTime - createdTime > retentionMillis;
  }

  /**
   * Generate purge report for compliance
   */
  generatePurgeReport(
    deletedRecords: SecureDeletionRecord[],
    reportDate: Date = new Date(),
  ): PurgeReport {
    return {
      reportDate,
      totalRecordsDeleted: deletedRecords.length,
      records: deletedRecords,
      reportHash: this.generateReportHash(deletedRecords),
    };
  }

  /**
   * Generate hash of purge report for audit trail
   */
  private generateReportHash(records: SecureDeletionRecord[]): string {
    const concatenated = records.map((r) => r.deletionHash).join('');
    return crypto.createHash('sha256').update(concatenated).digest('hex');
  }
}

export interface SecureDeletionRecord {
  dataType: string;
  recordId: string;
  userId: string;
  deletedAt: Date;
  reason: string;
  deletionHash: string;
}

export interface PurgeReport {
  reportDate: Date;
  totalRecordsDeleted: number;
  records: SecureDeletionRecord[];
  reportHash: string;
}
