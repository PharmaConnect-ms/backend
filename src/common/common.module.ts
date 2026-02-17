import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { DataIntegrityService } from './data-integrity.service';
import { DataFilteringService } from './data-filtering.service';
import { SecureDataDeletionService } from './secure-deletion.service';
import { LogSanitizationService } from './log-sanitization.service';

/**
 * Common Module
 * Provides security and data protection services
 * - Encryption and decryption
 * - Data integrity verification
 * - Role-based filtering
 * - Secure data deletion
 * - Log sanitization
 */
@Module({
  providers: [
    EncryptionService,
    DataIntegrityService,
    DataFilteringService,
    SecureDataDeletionService,
    LogSanitizationService,
  ],
  exports: [
    EncryptionService,
    DataIntegrityService,
    DataFilteringService,
    SecureDataDeletionService,
    LogSanitizationService,
  ],
})
export class CommonModule {}
