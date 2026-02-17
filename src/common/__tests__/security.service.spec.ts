/**
 * ENCRYPTION SERVICE TEST EXAMPLES
 * Tests for core security services
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EncryptionService } from '../encryption.service';
import { DataIntegrityService } from '../data-integrity.service';
import { SecureDataDeletionService } from '../secure-deletion.service';
import { LogSanitizationService } from '../log-sanitization.service';
import { DataFilteringService } from '../data-filtering.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const plaintext = 'This is sensitive patient data';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(encrypted).not.toEqual(plaintext);
      expect(decrypted).toEqual(plaintext);
    });

    it('should produce different ciphertexts for same plaintext (IV randomness)', () => {
      const plaintext = 'Sensitive data';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      // Different ciphertexts due to random IV
      expect(encrypted1).not.toEqual(encrypted2);

      // Both decrypt to same value
      expect(service.decrypt(encrypted1)).toEqual(plaintext);
      expect(service.decrypt(encrypted2)).toEqual(plaintext);
    });

    it('should handle empty strings', () => {
      expect(service.encrypt('')).toEqual('');
      expect(service.decrypt('')).toEqual('');
    });

    it('should handle special characters', () => {
      const plaintext = 'Patient@123!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = '患者データ 🏥 🔒 Données du patient';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toEqual(plaintext);
    });

    it('should throw error on decryption with invalid data', () => {
      const invalidData = 'not-valid-base64-encrypted-data';

      expect(() => service.decrypt(invalidData)).toThrow();
    });

    it('should throw error on decryption with tampered data', () => {
      const plaintext = 'Sensitive data';
      const encrypted = service.encrypt(plaintext);

      // Tamper with the encrypted data
      const tampered = Buffer.from(encrypted, 'base64')
        .toString('base64')
        .replace(/.$/, 'X'); // Change last character

      expect(() => service.decrypt(tampered)).toThrow();
    });
  });

  describe('hash operations', () => {
    it('should generate consistent hash', () => {
      const data = 'test data';
      const hash1 = service.generateHash(data);
      const hash2 = service.generateHash(data);

      expect(hash1).toEqual(hash2);
    });

    it('should verify valid hash', () => {
      const data = 'sensitive data';
      const hash = service.generateHash(data);

      expect(service.verifyHash(data, hash)).toBe(true);
    });

    it('should reject invalid hash', () => {
      const data = 'sensitive data';
      const wrongData = 'different data';
      const hash = service.generateHash(data);

      expect(service.verifyHash(wrongData, hash)).toBe(false);
    });
  });

  describe('token generation', () => {
    it('should generate secure random tokens', () => {
      const token1 = service.generateSecureToken();
      const token2 = service.generateSecureToken();

      // Different tokens
      expect(token1).not.toEqual(token2);
      // Proper length (32 bytes = 64 hex characters)
      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
    });

    it('should generate custom length tokens', () => {
      const token = service.generateSecureToken(16);
      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
    });
  });
});

describe('DataIntegrityService', () => {
  let service: DataIntegrityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataIntegrityService],
    }).compile();

    service = module.get<DataIntegrityService>(DataIntegrityService);
  });

  describe('digital signatures', () => {
    it('should generate and verify signatures', () => {
      const data = { userId: 1, action: 'create_prescription' };
      const secret = 'secret-key';

      const signature = service.generateSignature(data, secret);
      expect(service.verifySignature(data, signature, secret)).toBe(true);
    });

    it('should reject tampered data', () => {
      const data = { userId: 1, action: 'create_prescription' };
      const tampered = { userId: 2, action: 'create_prescription' };
      const secret = 'secret-key';

      const signature = service.generateSignature(data, secret);
      expect(service.verifySignature(tampered, signature, secret)).toBe(false);
    });
  });

  describe('checksum operations', () => {
    it('should generate consistent checksums', () => {
      const data = 'prescription data';
      const checksum1 = service.generateChecksum(data);
      const checksum2 = service.generateChecksum(data);

      expect(checksum1).toEqual(checksum2);
    });

    it('should verify valid checksums', () => {
      const data = 'patient data';
      const checksum = service.generateChecksum(data);

      expect(service.verifyChecksum(data, checksum)).toBe(true);
    });
  });

  describe('audit entries', () => {
    it('should create audit entry', () => {
      const entry = service.createAuditEntry(
        'CREATE',
        'Prescription',
        '123',
        'user-1',
        { field: 'patientName', value: 'John Doe' },
      );

      expect(entry).toHaveProperty('action', 'CREATE');
      expect(entry).toHaveProperty('entityType', 'Prescription');
      expect(entry).toHaveProperty('userId', 'user-1');
      expect(entry).toHaveProperty('checksum');
    });

    it('should verify audit entry integrity', () => {
      const entry = service.createAuditEntry(
        'UPDATE',
        'User',
        '456',
        'user-2',
      );

      expect(service.verifyAuditEntry(entry)).toBe(true);
    });
  });
});

describe('SecureDataDeletionService', () => {
  let service: SecureDataDeletionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecureDataDeletionService],
    }).compile();

    service = module.get<SecureDataDeletionService>(SecureDataDeletionService);
  });

  describe('deletion records', () => {
    it('should create deletion record', () => {
      const record = service.createDeletionRecord(
        'Prescription',
        '123',
        'admin-1',
        'Retention policy expired',
      );

      expect(record).toHaveProperty('dataType', 'Prescription');
      expect(record).toHaveProperty('recordId', '123');
      expect(record).toHaveProperty('deletionHash');
    });

    it('should verify deletion record', () => {
      const record = service.createDeletionRecord(
        'User',
        '456',
        'admin-2',
        'User requested deletion',
      );

      expect(service.verifyDeletionRecord(record)).toBe(true);
    });
  });

  describe('retention policies', () => {
    it('should identify expired data correctly', () => {
      const toDaysAgo = new Date();
      toDaysAgo.setDate(toDaysAgo.getDate() - 100);

      expect(service.isDataExpired(toDaysAgo, 90)).toBe(true);
      expect(service.isDataExpired(toDaysAgo, 365)).toBe(false);
    });
  });
});

describe('LogSanitizationService', () => {
  let service: LogSanitizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LogSanitizationService],
    }).compile();

    service = module.get<LogSanitizationService>(LogSanitizationService);
  });

  describe('message sanitization', () => {
    it('should redact passwords', () => {
      const message = 'User login with password=dummyPwd999';
      const sanitized = service.sanitizeLogMessage(message);

      expect(sanitized).not.toContain('dummyPwd999');
      expect(sanitized).toContain('[REDACTED]');
    });

    it('should redact API keys', () => {
      const message = 'API call with apikey=sk_test_xyz123';
      const sanitized = service.sanitizeLogMessage(message);

      expect(sanitized).not.toContain('sk_test_xyz123');
      expect(sanitized).toContain('[REDACTED]');
    });

    it('should redact email addresses', () => {
      const message = 'New user registered: john@example.com';
      const sanitized = service.sanitizeLogMessage(message);

      expect(sanitized).not.toContain('john@example.com');
      expect(sanitized).toContain('[EMAIL_REDACTED]');
    });

    it('should redact phone numbers', () => {
      const message = 'Contact patient at 555-123-4567';
      const sanitized = service.sanitizeLogMessage(message);

      expect(sanitized).not.toContain('555-123-4567');
      expect(sanitized).toContain('[PHONE_REDACTED]');
    });

    it('should redact JWT tokens', () => {
      const token = 'Bearer.TestToken.Signature123';
      const message = `Bearer token: ${token}`;
      const sanitized = service.sanitizeLogMessage(message);

      expect(sanitized).not.toContain(token);
      expect(sanitized).toContain('[JWT_REDACTED]');
    });
  });

  describe('object sanitization', () => {
    it('should redact sensitive fields', () => {
      const obj = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'dummyPassword999',
        apiKey: 'sk_test_dummyaaa',
      };

      const sanitized = service.sanitizeObject(obj);

      expect(sanitized.username).toEqual('john_doe');
      expect(sanitized.password).toEqual('[REDACTED]');
      expect(sanitized.apiKey).toEqual('[REDACTED]');
    });

    it('should recursively sanitize nested objects', () => {
      const obj = {
        user: {
          name: 'John',
          password: 'dummySecret888',
        },
        credentials: {
          apiKey: 'sk_test_dummybbb',
        },
      };

      const sanitized = service.sanitizeObject(obj);

      expect(sanitized.user.password).toEqual('[REDACTED]');
      expect(sanitized.credentials.apiKey).toEqual('[REDACTED]');
    });
  });
});

describe('DataFilteringService', () => {
  let service: DataFilteringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataFilteringService],
    }).compile();

    service = module.get<DataFilteringService>(DataFilteringService);
  });

  describe('role-based filtering', () => {
    it('should filter by role access map', () => {
      const user = {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
        phone: '555-123-4567',
        password: 'dummyPass777',
      };

      const roleAccessMap = {
        public: ['id', 'username'],
        patient: ['id', 'username', 'email'],
      };

      const publicView = service.filterByRole(user, 'public', roleAccessMap);
      const patientView = service.filterByRole(user, 'patient', roleAccessMap);

      expect(publicView).not.toHaveProperty('email');
      expect(publicView).not.toHaveProperty('password');
      expect(patientView).toHaveProperty('email');
      expect(patientView).not.toHaveProperty('password');
    });

    it('should handle wildcard role access', () => {
      const data = { id: 1, secret: 'value', public: 'data' };
      const roleAccessMap = {
        admin: ['*'],
      };

      const adminView = service.filterByRole(data, 'admin', roleAccessMap);

      expect(adminView).toHaveProperty('id');
      expect(adminView).toHaveProperty('secret');
      expect(adminView).toHaveProperty('public');
    });
  });

  describe('sensitive field removal', () => {
    it('should remove sensitive fields', () => {
      const user = {
        id: 1,
        username: 'john',
        password: 'dummyPwd666',
        ssn: '123-45-6789',
      };

      const safe = service.removeSensitiveFields(user);

      expect(safe).toHaveProperty('id');
      expect(safe).toHaveProperty('username');
      expect(safe).not.toHaveProperty('password');
      expect(safe).not.toHaveProperty('ssn');
    });
  });
});
