# Environment Configuration Guide - Data Protection & Encryption Compliance

This document explains the environment variables required for PharmaConnect to comply with the Data Protection and Encryption Policy.

## Critical Security Variables

### ENCRYPTION_MASTER_KEY
- **Description**: Primary encryption key for field-level encryption (AES-256-GCM)
- **Required**: YES
- **Type**: String (base64 encoded)
- **Generation**: `openssl rand -base64 32`
- **Storage**: 
  - ❌ NEVER commit to version control
  - ✅ Use environment variables (development)
  - ✅ Use Secrets Manager like AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault (production)
- **Rotation**: Rotate every 90 days or immediately if compromised
- **Access**: Only authorized backend services and system administrators

### JWT_SECRET
- **Description**: Secret key for JWT token signing
- **Required**: YES
- **Type**: String
- **Generation**: `openssl rand -base64 32`
- **Storage**: Same as ENCRYPTION_MASTER_KEY
- **Rotation**: Rotate every 90 days

## HTTPS/TLS Configuration

### USE_HTTPS
- **Description**: Enable HTTPS/TLS encryption for all traffic
- **Required**: YES (production: true, development: false)
- **Default**: false (development)
- **Production Value**: true
- **Impact**: All API communication must use HTTPS with TLS 1.2+

### SSL_KEY_PATH
- **Description**: Path to SSL/TLS private key file
- **Required**: YES (when USE_HTTPS=true)
- **Format**: PEM format
- **Permissions**: 600 (only readable by application user)
- **Generation**: `openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365`

### SSL_CERT_PATH
- **Description**: Path to SSL/TLS certificate file
- **Required**: YES (when USE_HTTPS=true)
- **Format**: PEM format
- **CA Bundle**: Must include the complete certificate chain

### CORS_ORIGINS
- **Description**: Comma-separated list of allowed origins for CORS
- **Required**: YES
- **Development**: `http://localhost:3000,https://localhost:3000`
- **Production**: Only trusted domains
- **Impact**: Prevents unauthorized cross-origin requests

## Database Configuration

### DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME
- **Sensitive**: YES
- **Encryption**: Database connection should use SSL/TLS
- **Storage**: Use environment variables or secrets manager
- **Password**: Use strong, randomly generated passwords
- **Rotation**: Change passwords every 90 days

## Data Retention Policies

### PRESCRIPTION_RETENTION_DAYS
- **Default**: 365 days (1 year)
- **Impact**: Prescriptions older than this are eligible for secure deletion
- **Guideline**: HIPAA requires minimum 6 years for medical records

### APPOINTMENT_RETENTION_DAYS
- **Default**: 90 days
- **Impact**: Appointments older than this are eligible for secure deletion

### AUDIT_LOG_RETENTION_DAYS
- **Default**: 2555 days (7 years)
- **Impact**: Audit trails must be retained per compliance requirements
- **Compliance**: HIPAA minimum requirement

## API Documentation

### ENABLE_SWAGGER
- **Description**: Enable/disable Swagger API documentation
- **Production Value**: false (don't expose API documentation in production)
- **Development Value**: true
- **Security**: API documentation can leak sensitive information

## Third-Party Integrations

### Google OAuth Credentials
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL

**Security Notes**:
- Store secrets in environment variables
- Use separate credentials for development/production
- Regenerate credentials if compromised
- Limit OAuth scopes to minimum required

### Zoom Integration
- ZOOM_API_KEY
- ZOOM_API_SECRET
- ZOOM_CLIENT_SECRET

**Security Notes**:
- Rotate API secrets every 90 days
- Use environment-specific credentials
- Encrypt API secret in transit
- Log access to these credentials

### Jitsi/JAAS Integration
- JAAS_PRIVATE_KEY (Store safely - this is a cryptographic key)
- JAAS_KEY_ID
- JAAS_APP_ID

**Security Notes**:
- JAAS_PRIVATE_KEY is sensitive - ensure maximum protection
- Consider migrating to more modern services
- Implement key rotation policy

## Production Configuration Checklist

- [ ] Use secure secrets management system (not plain .env files)
- [ ] Set ENCRYPTION_MASTER_KEY to secure random value
- [ ] Set JWT_SECRET to secure random value
- [ ] Enable USE_HTTPS=true
- [ ] Configure valid SSL_KEY_PATH and SSL_CERT_PATH
- [ ] Restrict CORS_ORIGINS to known origins only
- [ ] Disable ENABLE_SWAGGER=false
- [ ] Set NODE_ENV=production
- [ ] Use strong database passwords
- [ ] Implement key rotation schedule
- [ ] Enable audit logging
- [ ] Test HTTPS/TLS configuration
- [ ] Verify encryption works with actual keys
- [ ] Document secrets location for disaster recovery

## Security Commands

### Generate Encryption Key
```bash
openssl rand -base64 32
```

### Generate JWT Secret
```bash
openssl rand -base64 32
```

### Generate Self-Signed Certificate (Development Only)
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### Generate Production Certificate
```bash
# Using Let's Encrypt (recommended)
certbot certonly --standalone -d yourdomain.com
```

## Compliance References

- **HIPAA**: Health Insurance Portability and Accountability Act
- **OWASP**: Open Web Application Security Project guidelines
- **NIST**: National Institute of Standards and Technology cryptographic standards
- **TLS**: Transport Layer Security - minimum version 1.2
- **AES-256-GCM**: Advanced Encryption Standard with Galois/Counter Mode

## Support

For security concerns or questions about encryption configuration:
1. Check the DATA_PROTECTION_POLICY.md
2. Contact the Security & Operations Team
3. Never share credentials or keys via email/chat
