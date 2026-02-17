import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Encryption Service for Field-Level Encryption
 * Implements AES-256-GCM for HIPAA/PHI compliance
 * - Confidentiality through AES-256 encryption
 * - Integrity through GCM authentication tags
 * - Proper key derivation using PBKDF2
 */
@Injectable()
export class EncryptionService {
  private encryptionKey: Buffer;
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly SALT_LENGTH = 16;
  private readonly TAG_LENGTH = 16;
  private readonly IV_LENGTH = 12; // GCM standard
  private readonly ITERATIONS = 100000; // PBKDF2 iterations

  constructor(private configService: ConfigService) {
    this.initializeKey();
  }

  /**
   * Initialize encryption key from environment
   * Key should be stored in secure secrets management
   */
  private initializeKey(): void {
    const masterKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    
    if (!masterKey) {
      throw new Error(
        'ENCRYPTION_MASTER_KEY not configured. Please set this in environment variables or secrets manager.',
      );
    }

    // Derive a 32-byte key using PBKDF2
    this.encryptionKey = crypto.pbkdf2Sync(
      masterKey,
      '', // Empty salt - master key is the source
      this.ITERATIONS,
      32,
      'sha256',
    );
  }

  /**
   * Encrypt sensitive data with AES-256-GCM
   * Returns: IV + AuthTag + CiphertextEncoded in base64
   * Format: iv.authTag.ciphertext (base64 encoded)
   */
  encrypt(plaintext: string): string {
    try {
      if (!plaintext) {
        return plaintext;
      }

      // Generate random IV for each encryption
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, this.encryptionKey, iv);

      // Encrypt the data
      let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
      ciphertext += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine IV + authTag + ciphertext and encode in base64
      const payload = Buffer.concat([iv, authTag, Buffer.from(ciphertext, 'hex')]);
      return payload.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data encrypted with encrypt()
   * Verifies authentication tag for integrity
   */
  decrypt(encryptedData: string): string {
    try {
      if (!encryptedData) {
        return encryptedData;
      }

      // Decode from base64
      const payload = Buffer.from(encryptedData, 'base64');

      // Extract components
      const iv = payload.slice(0, this.IV_LENGTH);
      const authTag = payload.slice(this.IV_LENGTH, this.IV_LENGTH + this.TAG_LENGTH);
      const ciphertext = payload.slice(this.IV_LENGTH + this.TAG_LENGTH);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.encryptionKey, iv);

      // Set authentication tag for verification
      decipher.setAuthTag(authTag);

      // Decrypt
      const decryptedBuf = decipher.update(ciphertext);
      const finalBuf = decipher.final();

      return Buffer.concat([decryptedBuf, finalBuf]).toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate hash for data integrity verification
   * Uses SHA-256 with HMAC for authentication
   */
  generateHash(data: string): string {
    return crypto
      .createHmac('sha256', this.encryptionKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify data integrity with hash
   */
  verifyHash(data: string, hash: string): boolean {
    const computedHash = this.generateHash(data);
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(hash),
    );
  }

  /**
   * Generate cryptographically secure random token
   * Useful for session tokens, reset tokens, etc.
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash password with bcrypt-like behavior using PBKDF2
   * Note: For actual password hashing, use bcryptjs (already in dependencies)
   */
  hashData(data: string, salt?: string): { hash: string; salt: string } {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(this.SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(
      data,
      saltBuffer,
      this.ITERATIONS,
      64,
      'sha256',
    ).toString('hex');

    return {
      hash,
      salt: saltBuffer.toString('hex'),
    };
  }

  /**
   * Verify hashed data
   */
  verifyHashedData(data: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hashData(data, salt);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(hash),
    );
  }
}
