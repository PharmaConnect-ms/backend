import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

/**
 * Data Filtering Service
 * Implements role-based data exposure controls
 * - Filters sensitive fields based on user role
 * - Minimizes data exposure per access control rules
 * - Ensures compliance with data minimization requirements
 */
@Injectable()
export class DataFilteringService {
  /**
   * Filter object based on user role
   * Only exposes fields authorized for the user's role
   */
  filterByRole<T>(
    data: T,
    role: string,
    roleAccessMap: RoleAccessMap,
  ): Partial<T> {
    if (!data) return data;

    const allowedFields = roleAccessMap[role] || [];

    if (allowedFields.includes('*')) {
      // All fields allowed
      return data;
    }

    const filtered: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        filtered[key] = value;
      }
    }

    return filtered as Partial<T>;
  }

  /**
   * Filter array of objects by role
   */
  filterArrayByRole<T>(
    data: T[],
    role: string,
    roleAccessMap: RoleAccessMap,
  ): Partial<T>[] {
    return data.map((item) => this.filterByRole(item, role, roleAccessMap));
  }

  /**
   * Remove sensitive fields from object
   * Default sensitive fields that should be hidden
   */
  removeSensitiveFields<T>(data: T, fieldsToRemove: string[] = []): Partial<T> {
    if (!data) return data;

    const defaultSensitiveFields = [
      'password',
      'passwordHash',
      'passwordSalt',
      'secret',
      'privateKey',
      'apiKey',
      'ssn',
      'socialSecurityNumber',
      'creditCard',
      'bankAccount',
      'medicalRecord',
      'geneticData',
      'mentalHealthData',
      'substanceAbuseData',
      'sexualOrientation',
      'gender',
    ];

    const allFieldsToRemove = [...defaultSensitiveFields, ...fieldsToRemove];
    const filtered: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (!allFieldsToRemove.includes(key)) {
        filtered[key] = value;
      }
    }

    return filtered as Partial<T>;
  }

  /**
   * Apply DTO transformation with field filtering
   * Uses class-transformer to apply filtering rules
   */
  transformToDTO<T>(
    data: any,
    dtoClass: new () => T,
    role?: string,
    roleAccessMap?: RoleAccessMap,
  ): Partial<T> {
    // First transform to DTO (handles class-transformer decorators)
    let transformed: any = plainToInstance(dtoClass, data, {
      excludeExtraneousValues: true,
    });

    // Then apply role-based filtering if provided
    if (role && roleAccessMap) {
      transformed = this.filterByRole(transformed, role, roleAccessMap);
    }

    return transformed as Partial<T>;
  }

  /**
   * Get safe API response with only authorized fields
   */
  getSafeResponse<T>(
    data: T | T[],
    role: string,
    roleAccessMap?: RoleAccessMap,
  ): SafeResponse<T> {
    const filtered = Array.isArray(data)
      ? this.filterArrayByRole(data, role, roleAccessMap || {})
      : this.filterByRole(data, role, roleAccessMap || {});

    return {
      success: true,
      data: filtered,
      timestamp: new Date(),
    };
  }

  /**
   * Check if user can access specific field
   */
  canAccessField(field: string, role: string, roleAccessMap: RoleAccessMap): boolean {
    const allowedFields = roleAccessMap[role] || [];
    return allowedFields.includes('*') || allowedFields.includes(field);
  }
}

export interface RoleAccessMap {
  [role: string]: string[]; // role -> array of allowed fields
}

export interface SafeResponse<T> {
  success: boolean;
  data: T | Partial<T> | Partial<T>[];
  timestamp: Date;
}
