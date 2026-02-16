# DATABASE SCHEMA AND ENTITY ENCRYPTION GUIDE

## Overview

This guide explains how to implement field-level encryption on database entities and add encryption decorators for sensitive PHI/PII fields.

## Field-Level Encryption Architecture

```
Entity Fields (Plaintext in Memory)
           ↓
    @Encrypted() Decorator
           ↓
    EncryptionService.encrypt()
           ↓
    Encrypted Value (AES-256-GCM)
           ↓
    Database Storage
```

## Example 1: Prescription Entity with Encryption

### Current Entity (Before)
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/users/user.entity';

@Entity()
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientName: string; // ❌ Not encrypted

  @Column()
  prescriptionImage: string;

  @ManyToOne(() => User, user => user.prescriptionsIssued)
  doctor: User;

  @ManyToOne(() => User, user => user.prescriptionsReceived)
  patient: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Updated Entity (With Encryption)
```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { User } from '@/users/user.entity';
import { Encrypted, Audited, RetentionPolicy } from '@/common/encryption.decorator';

@Entity()
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  /**
   * Patient Name - Encrypted Field
   * Stored encrypted in database
   * Automatically decrypted on load
   * Audited for access
   * 1-year retention policy
   */
  @Column({ type: 'longtext' })
  @Encrypted() // Will be encrypted/decrypted
  @Audited() // Access is logged
  @RetentionPolicy(365) // Delete after 365 days
  @Expose()
  patientName: string;

  /**
   * Prescription Image URL
   * Not encrypted (public URL)
   * Reference to cloud storage
   */
  @Column()
  @Expose()
  prescriptionImage: string;

  /**
   * Doctor Reference
   * Links to prescribing doctor
   * Access audited via permission checks
   */
  @ManyToOne(() => User, user => user.prescriptionsIssued, {
    onDelete: 'CASCADE',
  })
  @Expose()
  doctor: User;

  /**
   * Patient Reference
   * Links to patient user
   * Access audited via permission checks
   */
  @ManyToOne(() => User, user => user.prescriptionsReceived, {
    onDelete: 'CASCADE',
  })
  @Expose()
  patient: User;

  /**
   * Created Timestamp
   * Not encrypted
   * Audited for deletion retention
   */
  @CreateDateColumn()
  @Expose()
  createdAt: Date;

  /**
   * Updated Timestamp
   */
  @UpdateDateColumn()
  @Expose()
  updatedAt: Date;

  /**
   * Data Integrity Signature
   * HMAC signature for verification
   */
  @Column({ type: 'text', nullable: true })
  @Exclude()
  dataSignature?: string;

  /**
   * Created By (Audit Trail)
   * Who created this record
   */
  @Column({ nullable: true })
  @Exclude()
  createdBy?: number;

  /**
   * Lifecycle Hooks for Encryption
   */

  @BeforeInsert()
  encryptBeforeInsert(): void {
    // Encryption handled by service subscribers or middleware
  }

  @BeforeUpdate()
  encryptBeforeUpdate(): void {
    // Encryption handled by service subscribers or middleware
  }

  @AfterLoad()
  decryptAfterLoad(): void {
    // Decryption handled by service subscribers or middleware
  }
}
```

## Example 2: User Entity with Multiple Encrypted Fields

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Encrypted, Audited, RequiresConsent, RetentionPolicy } from '@/common/encryption.decorator';
import { Prescription } from '@/prescription/entities/prescription.entity';

@Entity()
@Unique(['username', 'email'])
export class User {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  // Public fields - not encrypted
  @Column({ unique: true })
  @Expose()
  username: string;

  @Column({ default: 'user' })
  @Expose()
  role: string;

  @Column({ default: 'local' })
  @Expose()
  provider: string;

  // Sensitive fields - encrypted
  /**
   * Email - Encrypted
   * Sensitive contact information
   * Used for verification and notifications
   * Requires privacy consent
   */
  @Column({ unique: true })
  @Encrypted()
  @Audited()
  @RequiresConsent('marketing_communications')
  @Exclude({ toPlainOnly: true })
  email: string;

  /**
   * Password Hash - Not encrypted (secure hash)
   * Passwords should be hashed, not encrypted
   * Using bcryptjs
   */
  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  password?: string;

  /**
   * Phone Number - Encrypted
   * Sensitive PII
   * HIPAA protected
   */
  @Column({ nullable: true })
  @Encrypted()
  @Audited()
  @RequiresConsent('contact_information')
  @RetentionPolicy(365) // Delete after 1 year of inactivity
  @Expose()
  phone?: string;

  /**
   * Address - Encrypted
   * Sensitive PII
   * HIPAA protected
   */
  @Column({ nullable: true })
  @Encrypted()
  @Audited()
  @RequiresConsent('address_information')
  @RetentionPolicy(365)
  @Expose()
  address?: string;

  /**
   * Age - Optionally encrypted
   * Can infer health information
   * Sensitive PHI component
   */
  @Column({ nullable: true })
  @Encrypted()
  @Audited()
  @RetentionPolicy(365)
  @Expose()
  age?: string;

  // Non-sensitive fields
  @Column({ nullable: true })
  @Expose()
  userSummary?: string;

  @Column({ nullable: true })
  @Expose()
  profilePicture?: string;

  // Relationships
  @OneToMany(() => Prescription, prescription => prescription.doctor)
  @Exclude()
  prescriptionsIssued: Prescription[];

  @OneToMany(() => Prescription, prescription => prescription.patient)
  @Exclude()
  prescriptionsReceived: Prescription[];
}
```

## Example 3: Appointment Entity with Encryption

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Encrypted, Audited } from '@/common/encryption.decorator';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Appointment Date - Not encrypted
   * Used for scheduling queries
   * Indexed for performance
   */
  @Column({ type: 'datetime' })
  appointmentDate: Date;

  /**
   * Patient Notes - Encrypted
   * Contains PHI/medical information
   * Sensitive clinical data
   */
  @Column({ type: 'longtext', nullable: true })
  @Encrypted()
  @Audited()
  patientNotes?: string;

  /**
   * Doctor Notes - Encrypted
   * Sensitive clinical observations
   */
  @Column({ type: 'longtext', nullable: true })
  @Encrypted()
  @Audited()
  doctorNotes?: string;

  /**
   * Diagnosis Code - Encrypted
   * ICD-10 or similar
   * Sensitive health information
   */
  @Column({ nullable: true })
  @Encrypted()
  @Audited()
  diagnosisCode?: string;

  @ManyToOne(() => User)
  patient: User;

  @ManyToOne(() => User)
  doctor: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Encryption Subscriber Implementation

To automatically encrypt/decrypt fields, use a TypeORM subscriber:

```typescript
// src/subscribers/encryption.subscriber.ts

import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  LoadEvent,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { EncryptionService } from '@/common/encryption.service';
import { getEncryptedFields } from '@/common/encryption.decorator';

@Injectable()
@EventSubscriber()
export class EncryptionSubscriber implements EntitySubscriberInterface {
  constructor(private encryptionService: EncryptionService) {}

  /**
   * Before inserting entity, encrypt marked fields
   */
  beforeInsert(event: InsertEvent<any>): void {
    const encryptedFields = getEncryptedFields(event.entity.constructor.prototype);

    encryptedFields.forEach((field) => {
      const value = event.entity[field];
      if (value) {
        event.entity[field] = this.encryptionService.encrypt(value);
      }
    });
  }

  /**
   * Before updating entity, encrypt marked fields
   */
  beforeUpdate(event: UpdateEvent<any>): void {
    if (!event.entity) return;

    const encryptedFields = getEncryptedFields(event.entity.constructor.prototype);

    encryptedFields.forEach((field) => {
      const value = event.entity[field];
      if (value && !this.isAlreadyEncrypted(value)) {
        event.entity[field] = this.encryptionService.encrypt(value);
      }
    });
  }

  /**
   * After loading from database, decrypt marked fields
   */
  afterLoad(event: LoadEvent<any>): void {
    const encryptedFields = getEncryptedFields(event.entity.constructor.prototype);

    encryptedFields.forEach((field) => {
      const value = event.entity[field];
      if (value && this.isEncrypted(value)) {
        try {
          event.entity[field] = this.encryptionService.decrypt(value);
        } catch (error) {
          console.error(`Decryption failed for field ${field}`);
          // Log error but don't fail the query
        }
      }
    });
  }

  /**
   * Check if value is already encrypted (base64 format)
   */
  private isAlreadyEncrypted(value: string): boolean {
    return /^[A-Za-z0-9+/=]+$/.test(value) && value.length > 100;
  }

  /**
   * Check if value looks encrypted
   */
  private isEncrypted(value: string): boolean {
    return /^[A-Za-z0-9+/=]+$/.test(value) && value.length > 50;
  }
}
```

## Database Schema Migration

### Add Encrypted Column Example

```typescript
// src/migrations/1708105200000-AddEncryptedFields.ts

import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddEncryptedFields1708105200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure columns can hold encrypted data (larger than plaintext)
    // AES-256-GCM output = plaintext + IV (12 bytes) + auth tag (16 bytes) + overhead
    // Allocate ~2x plaintext size for safety

    await queryRunner.addColumn(
      'prescription',
      new TableColumn({
        name: 'patientNameEncrypted',
        type: 'longtext',
        isNullable: true,
        comment: 'Patient name encrypted with AES-256-GCM',
      }),
    );

    // Create index on encrypted fields if needed for lookups
    // Note: Encrypted fields cannot be directly searched
    // Must decrypt first or use deterministic encryption (advanced)
    await queryRunner.createIndex(
      'prescription',
      new TableIndex({
        name: 'IDX_prescription_encrypted_patient',
        columnNames: ['id', 'doctor_id'], // Index on non-encrypted fields for access control
      }),
    );

    // Migrate existing data
    await queryRunner.query(`
      UPDATE prescription 
      SET patientNameEncrypted = patientName
      WHERE patientNameEncrypted IS NULL
    `);

    // Optional: Drop old unencrypted column (after verification)
    // await queryRunner.dropColumn('prescription', 'patientName');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('prescription', 'IDX_prescription_encrypted_patient');
    await queryRunner.dropColumn('prescription', 'patientNameEncrypted');
  }
}
```

## Column Size Requirements

For encrypted fields, allocate appropriate database column sizes:

| Plaintext Size | Encrypted Size | Database Type | Example |
|---|---|---|---|
| 0-100 bytes | 0-250 bytes | VARCHAR(500) | Email, phone |
| 100-500 bytes | 250-1000 bytes | VARCHAR(2000) | Address, notes |
| 500+ bytes | 1000+ bytes | LONGTEXT | Medical records, descriptions |

## Best Practices

### DO ✅
- [x] Use `@Encrypted()` decorator for sensitive fields
- [x] Use `@Audited()` to log access to sensitive fields
- [x] Set appropriate data retention policies with `@RetentionPolicy()`
- [x] Mark fields requiring consent with `@RequiresConsent()`
- [x] Use environment variable for master encryption key
- [x] Implement subscriber for automatic encryption/decryption
- [x] Exclude encrypted fields from API responses using `@Exclude()`
- [x] Test encryption/decryption in unit tests
- [x] Monitor encryption performance
- [x] Log encryption operations to audit trail

### DON'T ❌
- [ ] Store encryption keys in source code
- [ ] Log unencrypted sensitive data
- [ ] Search encrypted columns directly (unless using deterministic encryption)
- [ ] Return encrypted values in API responses
- [ ] Skip decryption when loading from database
- [ ] Use same IV for multiple encryptions
- [ ] Store passwords as encrypted (use bcrypt hash instead)
- [ ] Index encrypted columns for performance queries
- [ ] Commit unencrypted secrets to version control

## Testing Encrypted Fields

```typescript
describe('Prescription Encryption', () => {
  it('should encrypt patient name on insert', async () => {
    const prescription = await prescriptionRepository.save({
      patientName: 'John Doe',
      doctor: doctorUser,
      patient: patientUser,
    });

    // In database, encrypted
    const raw = await queryRunner.query(
      'SELECT patientName FROM prescription WHERE id = ?',
      [prescription.id]
    );
    expect(raw[0].patientName).not.toEqual('John Doe');

    // When loaded via ORM, decrypted
    const loaded = await prescriptionRepository.findOne(prescription.id);
    expect(loaded.patientName).toEqual('John Doe');
  });

  it('should decrypt patient name on load', async () => {
    const saved = await prescriptionRepository.save({
      patientName: 'Jane Smith',
      doctor: doctorUser,
      patient: patientUser,
    });

    const loaded = await prescriptionRepository.findOne(saved.id);
    expect(loaded.patientName).toEqual('Jane Smith');
  });
});
```

## Performance Considerations

### Indexes on Encrypted Fields
- Cannot create direct indexes on encrypted fields
- Create indexes on non-encrypted fields used for filtering
- Use role-based access control to filter at application layer

### Query Optimization
```typescript
// ❌ BAD: Cannot filter encrypted fields directly
await prescriptionRepository.find({
  where: { patientName: 'John Doe' }
});

// ✅ GOOD: Filter by non-encrypted fields
await prescriptionRepository.find({
  where: { patient: { id: patientId }, doctor: { id: doctorId } }
});

// ✅ GOOD: Decrypt after retrieval
const prescriptions = await prescriptionRepository.find({ patient: { id: patientId } });
const filtered = prescriptions.filter(p => p.patientName.includes('John'));
```

## Migration Checklist

- [ ] Backup database before encryption migration
- [ ] Test migration on staging environment
- [ ] Increase column sizes for encrypted data
- [ ] Implement encryption subscriber
- [ ] Deploy encryption service
- [ ] Create and run migration
- [ ] Verify encrypted data in database
- [ ] Test decryption works correctly
- [ ] Update API responses to use filtering
- [ ] Monitor application performance
- [ ] Archive unencrypted backups securely
