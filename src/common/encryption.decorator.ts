import { Exclude } from 'class-transformer';

/**
 * Decorators for Field-Level Encryption
 * Usage: @Encrypted() on entity fields to auto-encrypt/decrypt
 */

// Metadata key for encrypted fields
export const ENCRYPTED_FIELDS_KEY = 'encrypted-fields';

/**
 * Decorator to mark fields for field-level encryption
 * Applied to entity properties that contain sensitive data
 * 
 * @example
 * @Entity()
 * class User {
 *   @Column()
 *   @Encrypted()
 *   ssn: string;
 * 
 *   @Column()
 *   @Encrypted()
 *   phoneNumber: string;
 * }
 */
export function Encrypted() {
  return function (target: any, propertyKey: string) {
    const existingMetadata = Reflect.getOwnMetadata(ENCRYPTED_FIELDS_KEY, target) || [];
    existingMetadata.push(propertyKey);
    Reflect.defineMetadata(ENCRYPTED_FIELDS_KEY, existingMetadata, target);
  };
}

/**
 * Get list of encrypted fields for an entity
 */
export function getEncryptedFields(target: any): string[] {
  return Reflect.getOwnMetadata(ENCRYPTED_FIELDS_KEY, target) || [];
}

/**
 * Decorator to exclude field from API responses by default
 * Can be overridden based on user role
 */
export function SensitiveField(
  roles: string[] = [], // Which roles can see this field
) {
  return function (target: any, propertyKey: string) {
    const existingMetadata = Reflect.getOwnMetadata('sensitive-fields', target) || {};
    existingMetadata[propertyKey] = roles;
    Reflect.defineMetadata('sensitive-fields', existingMetadata, target);
  };
}

/**
 * Get sensitive field authorization map
 */
export function getSensitiveFieldRoles(target: any): Record<string, string[]> {
  return Reflect.getOwnMetadata('sensitive-fields', target) || {};
}

/**
 * Decorator to mark field for audit logging
 * Every access to this field will be logged
 */
export function Audited() {
  return function (target: any, propertyKey: string) {
    const existingMetadata = Reflect.getOwnMetadata('audited-fields', target) || [];
    existingMetadata.push(propertyKey);
    Reflect.defineMetadata('audited-fields', existingMetadata, target);
  };
}

/**
 * Get audited fields for an entity
 */
export function getAuditedFields(target: any): string[] {
  return Reflect.getOwnMetadata('audited-fields', target) || [];
}

/**
 * Decorator to set data retention policy
 * Specifies how long data should be retained before automatic deletion
 * 
 * @param days Number of days to retain
 */
export function RetentionPolicy(days: number) {
  return function (target: any, propertyKey: string) {
    const existingMetadata = Reflect.getOwnMetadata('retention-policy', target) || {};
    existingMetadata[propertyKey] = days;
    Reflect.defineMetadata('retention-policy', existingMetadata, target);
  };
}

/**
 * Get retention policy for fields
 */
export function getRetentionPolicy(target: any): Record<string, number> {
  return Reflect.getOwnMetadata('retention-policy', target) || {};
}

/**
 * Decorator to mark fields that require user consent
 * User must explicitly consent to data collection/processing
 */
export function RequiresConsent(
  consentCategory: string, // Privacy category for consent
) {
  return function (target: any, propertyKey: string) {
    const existingMetadata = Reflect.getOwnMetadata('requires-consent', target) || {};
    existingMetadata[propertyKey] = consentCategory;
    Reflect.defineMetadata('requires-consent', existingMetadata, target);
  };
}

/**
 * Get consent requirements for fields
 */
export function getConsentRequirements(target: any): Record<string, string> {
  return Reflect.getOwnMetadata('requires-consent', target) || {};
}
