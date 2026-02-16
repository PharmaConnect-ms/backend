# DEVELOPER QUICK REFERENCE - Security Implementation

## 🚀 Quick Start Commands

```bash
# Generate encryption key for .env
openssl rand -base64 32

# Run security tests
npm run test src/common/

# Test HTTPS endpoint
curl -I https://localhost:5000

# Start dev server with HTTPS disabled (default)
npm run start:dev
```

---

## 🔐 Add Field Encryption to Entity

### Step 1: Import decorators
```typescript
import { Encrypted, Audited, RetentionPolicy } from '@/common/encryption.decorator';
```

### Step 2: Add decorator to field
```typescript
@Entity()
export class MyEntity {
  @Column()
  @Encrypted()           // Automatically encrypted/decrypted
  @Audited()             // Access logged
  @RetentionPolicy(365)  // Delete after 365 days
  sensitiveField: string;
}
```

### Step 3: Done! ✅
- Automatic encryption on insert/update
- Automatic decryption on select
- Access is audited
- Data expires and deletes after retention period

---

## 📦 Add Role-Based Filtering to API

### Step 1: Create DTO (or use existing)
```typescript
import { Expose, Exclude } from 'class-transformer';

export class MyResourceDto {
  @Expose()
  id: number;
  
  @Expose()
  publicField: string;
  
  @Exclude()  // Hidden from response
  sensitiveField: string;
}
```

### Step 2: Update controller
```typescript
import { plainToInstance } from 'class-transformer';
import { DataFilteringService } from '@/common/data-filtering.service';

@Controller()
export class MyController {
  constructor(
    private readonly dataFilteringService: DataFilteringService,
  ) {}

  @Get(':id')
  async getResource(@Param('id') id: number, @Request() req: any) {
    const resource = await this.service.findOne(id);
    
    // Filter to DTO
    const filtered = plainToInstance(MyResourceDto, resource, {
      excludeExtraneousValues: true,
    });
    
    return this.dataFilteringService.getSafeResponse(
      filtered,
      req.user?.role,
    );
  }
}
```

### Step 3: Done! ✅
- Response automatically filters sensitive fields
- Different roles see different data
- Uses `@Exclude()` decorator for filtering

---

## 🛡️ Inject Security Services

```typescript
// In your service/controller constructor
constructor(
  private readonly encryptionService: EncryptionService,
  private readonly dataFilteringService: DataFilteringService,
  private readonly integrityService: DataIntegrityService,
  private readonly deletionService: SecureDataDeletionService,
  private readonly logService: LogSanitizationService,
) {}
```

---

## 🔑 Common Operations

### Encrypt Data
```typescript
const encrypted = this.encryptionService.encrypt('sensitive data');
const decrypted = this.encryptionService.decrypt(encrypted);
```

### Generate Token
```typescript
const token = this.encryptionService.generateSecureToken(32);
```

### Create Digital Signature
```typescript
const signature = this.integrityService.generateSignature(
  data,
  process.env.JWT_SECRET
);

// Verify later
const isValid = this.integrityService.verifySignature(
  data,
  signature,
  process.env.JWT_SECRET
);
```

### Log Safely
```typescript
// Automatically redacts passwords, tokens, emails, etc.
this.logService.logSafely(
  'User action performed',
  'ControllerName',
  userData  // Auto-redacted
);
```

### Audit Access
```typescript
this.logService.auditDataAccess(
  userId,
  'VIEW_PRESCRIPTION',
  'Prescription',
  recordId,
  true,  // success
  'User viewed prescription'
);
```

### Check Data Expiration
```typescript
if (this.deletionService.isDataExpired(createdDate, 365)) {
  // Data is old enough to delete
  const record = this.deletionService.createDeletionRecord(
    'Prescription',
    recordId,
    adminUserId,
    'Retention policy expired'
  );
}
```

---

## 📋 DTO Patterns

### Role-Based DTO Pattern
```typescript
// For public access - minimal data
@Expose()
export class ResourcePublicDto {
  @Expose() id: number;
  @Expose() name: string;
  @Exclude() email: string;
  @Exclude() phone: string;
}

// For patient access - more data
@Expose()
export class ResourcePatientDto {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() email: string;
  @Exclude() phone: string;
  @Exclude() admin: boolean;
}

// For admin access - all data
@Expose()
export class ResourceAdminDto {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() email: string;
  @Expose() phone: string;
  @Expose() admin: boolean;
}
```

### Helper for Role-Based DTO
```typescript
export const ROLE_DTO_MAP = {
  public: ResourcePublicDto,
  patient: ResourcePatientDto,
  admin: ResourceAdminDto,
};

// Usage in controller
const dtoClass = ROLE_DTO_MAP[req.user?.role] || ResourcePublicDto;
const filtered = plainToInstance(dtoClass, resource, {
  excludeExtraneousValues: true,
});
```

---

## 🚨 Security Decorators

```typescript
// Mark field for encryption
@Encrypted()
fieldName: string;

// Mark access for audit logging
@Audited()
sensitiveField: string;

// Set automatic deletion after days
@RetentionPolicy(365)
expirableField: string;

// Mark as requiring user consent
@RequiresConsent('marketing')
consentField: string;
```

---

## ❌ DON'Ts (Common Mistakes)

### ❌ DON'T: Store unencrypted sensitive data
```typescript
// BAD
@Column()
password: string;

// GOOD
@Column()
@Encrypted()
password: string;
```

### ❌ DON'T: Return all fields in API
```typescript
// BAD
return user;  // Includes password, secrets!

// GOOD
const dto = plainToInstance(UserDto, user, {
  excludeExtraneousValues: true,
});
return this.filteringService.getSafeResponse(dto, role);
```

### ❌ DON'T: Log sensitive data
```typescript
// BAD
console.log('User:', userData);  // Logs password!

// GOOD
this.logService.logSafely('User action', 'context', userData);
// Automatically redacts sensitive fields
```

### ❌ DON'T: Use same encryption key for everything
```typescript
// BAD - Same key everywhere
const key = process.env.SECRET_KEY;

// GOOD - Different keys for different purposes
const encryptionKey = process.env.ENCRYPTION_MASTER_KEY;
const jwtSecret = process.env.JWT_SECRET;
const apiSecret = process.env.API_SECRET;
```

### ❌ DON'T: Store passwords encrypted
```typescript
// BAD - Passwords encrypted with key
@Column()
@Encrypted()
password: string;

// GOOD - Passwords hashed, never encrypted
@Column()
passwordHash: string;  // Use bcryptjs

// In service
this.passwordHash = await bcrypt.hash(password, 10);
```

### ❌ DON'T: Encrypt indexed fields
```typescript
// BAD - Can't search encrypted fields
@Column()
@Index()
@Encrypted()
email: string;

// GOOD - Index non-encrypted fields, decrypt in memory
@Column()
@Index()
email: string;  // Not encrypted - used for lookups

@Column()
@Encrypted()
phone: string;  // Encrypted - not searched
```

---

## 🧪 Testing Example

```typescript
describe('MyController', () => {
  it('should return filtered response for patient role', async () => {
    const resource = { id: 1, name: 'Test', secret: 'hidden' };
    
    const req = { user: { role: 'patient' } };
    const result = await controller.getResource(1, req);
    
    // Should include id and name
    expect(result.data.id).toBe(1);
    expect(result.data.name).toBe('Test');
    
    // Should NOT include secret
    expect(result.data.secret).toBeUndefined();
  });
});
```

---

## 🔒 Environment Variables

```bash
# Required
PORT=5000
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=pharmaconnect

# Security (required for production)
ENCRYPTION_MASTER_KEY=your-secure-key-here
JWT_SECRET=your-jwt-secret-here

# Optional
USE_HTTPS=false
SSL_KEY_PATH=/path/to/key.pem
SSL_CERT_PATH=/path/to/cert.pem
CORS_ORIGINS=http://localhost:3000
ENABLE_SWAGGER=true

# Data retention (days)
PRESCRIPTION_RETENTION_DAYS=365
APPOINTMENT_RETENTION_DAYS=90
AUDIT_LOG_RETENTION_DAYS=2555
```

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `src/common/encryption.service.ts` | AES-256-GCM encryption/decryption |
| `src/common/data-integrity.service.ts` | Digital signatures, audit trails |
| `src/common/data-filtering.service.ts` | Role-based data filtering |
| `src/common/secure-deletion.service.ts` | Secure data deletion, retention |
| `src/common/log-sanitization.service.ts` | Log redaction, access tracking |
| `src/common/encryption.decorator.ts` | Field encryption decorators |
| `src/common/common.module.ts` | Module exports |

---

## 🎯 Implementation Checklist

For each API endpoint:

- [ ] Add role-based DTO
- [ ] Apply `@Exclude()` to sensitive fields
- [ ] Update controller to use DTO filtering
- [ ] Use `dataFilteringService.getSafeResponse()`
- [ ] Inject security services as needed
- [ ] Add encryption decorator to entity fields
- [ ] Add test for role-based filtering
- [ ] Verify sensitive fields are hidden
- [ ] Check audit logging works
- [ ] Test with different user roles

---

## 🔀 API Response Examples

### User List (Doctor Role)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "phone": "555-123-4567"
    }
  ],
  "timestamp": "2026-02-16T10:00:00Z"
}
```

### User List (Public Role)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "profilePicture": "url"
    }
  ],
  "timestamp": "2026-02-16T10:00:00Z"
}
```

---

## 🚀 Deploy Checklist

Before deploying to production:

- [ ] All encryption keys configured in secrets manager
- [ ] SSL/TLS certificates installed
- [ ] HTTPS_ONLY environment variable set to true
- [ ] All API endpoints return filtered DTOs
- [ ] Audit logging is working
- [ ] Error messages don't leak sensitive info
- [ ] Regular encryption/decryption tested
- [ ] Backup encryption configured
- [ ] Log retention policy set
- [ ] Security monitoring enabled

---

## 📞 Common Questions

**Q: Where do I put the encryption key?**
A: In `.env` for dev, in secrets manager (AWS/Vault/Azure) for production.

**Q: How do I search encrypted fields?**
A: You can't directly. Decrypt in memory or create separate non-encrypted lookup fields.

**Q: Should I encrypt passwords?**
A: No, hash them with bcryptjs. Passwords should never be decrypted.

**Q: How often should I rotate keys?**
A: Every 90 days or immediately if compromised.

**Q: What if decryption fails?**
A: Catch the error, log it (sanitized), and return a user-friendly error message.

**Q: Can I use same key for everything?**
A: No, use different keys for different purposes (encryption, JWT, etc.).

---

## 🔗 Full Documentation

- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Overview
- [DATA_PROTECTION_POLICY_IMPLEMENTATION.md](DATA_PROTECTION_POLICY_IMPLEMENTATION.md) - Full policy compliance
- [ENVIRONMENT_CONFIGURATION.md](ENVIRONMENT_CONFIGURATION.md) - Setup guide
- [DATABASE_ENCRYPTION_GUIDE.md](DATABASE_ENCRYPTION_GUIDE.md) - Entity encryption
- [REFACTORING_GUIDE.md](REFACTORING_GUIDE.md) - Implementation examples
- [COMPLIANCE_AUDIT_CHECKLIST.md](COMPLIANCE_AUDIT_CHECKLIST.md) - Audit verification

---

Created: February 16, 2026 | Version: 1.0
