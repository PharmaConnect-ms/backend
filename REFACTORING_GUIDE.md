/**
 * REFACTORING GUIDE: Implementation of Data Protection Controls
 * 
 * This guide shows how to refactor controllers and services
 * to implement role-based data filtering and encryption.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { DataFilteringService, RoleAccessMap, SafeResponse } from '@/common/data-filtering.service';
import { LogSanitizationService } from '@/common/log-sanitization.service';
import { EncryptionService } from '@/common/encryption.service';
import {
  PrescriptionDoctorDto,
  PrescriptionPatientDto,
  getPrescriptionDtoForRole,
} from '@/prescription/dto/prescription-role-based.dto';
import {
  UserDoctorDto,
  UserPatientDto,
  getUserDtoForRole,
} from '@/users/dto/user-role-based.dto';

/**
 * EXAMPLE 1: Prescription Controller with Role-Based Filtering
 */
@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prescription')
export class PrescriptionControllerSecure {
  constructor(
    private readonly prescriptionService: any, // Inject actual service
    private readonly dataFilteringService: DataFilteringService,
    private readonly logSanitizationService: LogSanitizationService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Get prescriptions filtered by user role
   * 
   * Access Control:
   * - Patient: Only their own prescriptions
   * - Doctor: Prescriptions they issued + assigned to their patients
   * - Admin: All prescriptions
   */
  @Get()
  @ApiOperation({
    summary: 'Get prescriptions with role-based filtering',
    description: 'Each role sees only authorized prescriptions and fields',
  })
  async getPrescriptions(@Request() req: any): Promise<SafeResponse<any>> {
    try {
      const userRole = req.user?.role || 'public';
      const userId = req.user?.id;

      // Log access attempt (sanitized)
      this.logSanitizationService.auditDataAccess(
        userId,
        'LIST_PRESCRIPTIONS',
        'Prescription',
        'all',
        true,
      );

      // Get prescriptions based on role
      let prescriptions: any[];

      if (userRole === 'patient') {
        // Patients can only see their own prescriptions
        prescriptions = await this.prescriptionService.findByPatient(userId);
      } else if (userRole === 'doctor') {
        // Doctors can see prescriptions they issued
        prescriptions = await this.prescriptionService.findByDoctor(userId);
      } else if (userRole === 'admin' || userRole === 'staff') {
        // Admins can see all prescriptions
        prescriptions = await this.prescriptionService.findAll();
      } else {
        // Public access get empty result
        prescriptions = [];
      }

      // Apply role-based DTO filtering
      const dtoClass = getPrescriptionDtoForRole(userRole);
      const filteredPrescriptions = prescriptions.map((p) =>
        plainToInstance(dtoClass, p, {
          excludeExtraneousValues: true,
        }),
      );

      return this.dataFilteringService.getSafeResponse(filteredPrescriptions, userRole);
    } catch (error) {
      this.logSanitizationService.logErrorSafely('Failed to get prescriptions', error);
      throw error;
    }
  }

  /**
   * Get single prescription with authorization check
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get prescription by ID',
    description: 'Only authorized users can view prescriptions',
  })
  async getPrescription(@Param('id') id: string, @Request() req: any): Promise<SafeResponse<any>> {
    const userRole = req.user?.role || 'public';
    const userId = req.user?.id;

    try {
      const prescription = await this.prescriptionService.findOne(id);

      if (!prescription) {
        throw new BadRequestException('Prescription not found');
      }

      // Authorization check
      if (!this.canAccessPrescription(prescription, userRole, userId)) {
        this.logSanitizationService.auditDataAccess(
          userId,
          'VIEW_PRESCRIPTION',
          'Prescription',
          id,
          false, // Access denied
          'Insufficient permissions',
        );
        throw new BadRequestException('You do not have access to this prescription');
      }

      // Log successful access
      this.logSanitizationService.auditDataAccess(
        userId,
        'VIEW_PRESCRIPTION',
        'Prescription',
        id,
        true,
      );

      // Apply role-based filtering
      const dtoClass = getPrescriptionDtoForRole(userRole);
      const filtered = plainToInstance(dtoClass, prescription, {
        excludeExtraneousValues: true,
      });

      return this.dataFilteringService.getSafeResponse(filtered, userRole);
    } catch (error) {
      this.logSanitizationService.logErrorSafely('Failed to get prescription', error);
      throw error;
    }
  }

  /**
   * Authorization helper
   */
  private canAccessPrescription(
    prescription: any,
    userRole: string,
    userId: number,
  ): boolean {
    switch (userRole) {
      case 'patient':
        // Patient can only see their own prescriptions
        return prescription.patient.id === userId;
      case 'doctor':
        // Doctor can see their own prescriptions
        return prescription.doctor.id === userId;
      case 'admin':
      case 'staff':
        return true;
      default:
        return false;
    }
  }
}

/**
 * EXAMPLE 2: User Controller with Role-Based Filtering
 */
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersControllerSecure {
  // Define which fields each role can access
  private readonly ROLE_ACCESS_MAP: RoleAccessMap = {
    public: ['id', 'username', 'profilePicture'], // Public profile
    patient: ['id', 'username', 'email', 'profilePicture', 'age'], // Own data
    doctor: ['id', 'username', 'email', 'phone', 'profilePicture'], // Contact info
    admin: ['*'], // All fields
    staff: ['*'],
  };

  constructor(
    private readonly usersService: any,
    private readonly dataFilteringService: DataFilteringService,
    private readonly logSanitizationService: LogSanitizationService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Get user with role-based filtering
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns user data filtered by user role',
  })
  async getUser(@Param('id') id: number, @Request() req: any): Promise<SafeResponse<any>> {
    const userRole = req.user?.role || 'public';
    const requestingUserId = req.user?.id;

    try {
      const user = await this.usersService.findById(id);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Audit access to user data
      this.logSanitizationService.auditDataAccess(
        requestingUserId,
        'VIEW_USER_PROFILE',
        'User',
        id,
        true,
      );

      // Apply role-based filtering
      const filtered = this.dataFilteringService.filterByRole(
        user,
        userRole,
        this.ROLE_ACCESS_MAP,
      );

      // Transform to appropriate DTO
      const dtoClass = getUserDtoForRole(userRole);
      const dtoFiltered = plainToInstance(dtoClass, filtered, {
        excludeExtraneousValues: true,
      });

      return this.dataFilteringService.getSafeResponse(dtoFiltered, userRole);
    } catch (error) {
      this.logSanitizationService.logErrorSafely('Failed to get user', error);
      throw error;
    }
  }

  /**
   * List doctors (filtered by role)
   */
  @Get('list/doctors')
  @ApiOperation({
    summary: 'List all doctors',
    description: 'Returns list of doctors visible to requesting user',
  })
  async listDoctors(@Request() req: any): Promise<SafeResponse<any>> {
    const userRole = req.user?.role || 'public';

    try {
      const doctors = await this.usersService.listAllDoctors();

      // Apply role-based filtering to each doctor
      const filtered = this.dataFilteringService.filterArrayByRole(
        doctors,
        userRole,
        this.ROLE_ACCESS_MAP,
      );

      const dtoClass = getUserDtoForRole(userRole);
      const dtoFiltered = filtered.map((d) =>
        plainToInstance(dtoClass, d, {
          excludeExtraneousValues: true,
        }),
      );

      return this.dataFilteringService.getSafeResponse(dtoFiltered, userRole);
    } catch (error) {
      this.logSanitizationService.logErrorSafely('Failed to list doctors', error);
      throw error;
    }
  }
}

/**
 * EXAMPLE 3: Service with Encryption and Integrity Checks
 */
@Injectable()
export class PrescriptionServiceSecure {
  constructor(
    private readonly prescriptionRepository: any,
    private readonly encryptionService: EncryptionService,
    private readonly dataIntegrityService: any,
    private readonly logSanitizationService: LogSanitizationService,
  ) {}

  /**
   * Create prescription with field-level encryption
   * 
   * Fields encrypted:
   * - patientName
   * - prescriptionDetails
   * 
   * Integrity verified with digital signature
   */
  async createWithEncryption(
    createPrescriptionDto: any,
    userId: number,
  ): Promise<any> {
    try {
      const { patientName, prescriptionImage, doctorId, patientId } = createPrescriptionDto;

      // Encrypt sensitive fields
      const encryptedPatientName = this.encryptionService.encrypt(patientName);

      // Generate integrity signature
      const prescriptionData = {
        patientName: encryptedPatientName,
        prescriptionImage,
        doctorId,
        patientId,
      };
      const dataSignature = this.dataIntegrityService.generateSignature(
        prescriptionData,
        process.env.JWT_SECRET,
      );

      // Create prescription with encrypted fields
      const prescription = this.prescriptionRepository.create({
        ...prescriptionData,
        dataSignature, // Store for integrity verification
        createdBy: userId, // Track who created it
      });

      const saved = await this.prescriptionRepository.save(prescription);

      // Log creation
      this.logSanitizationService.auditDataAccess(
        userId,
        'CREATE_PRESCRIPTION',
        'Prescription',
        saved.id,
        true,
        `Created prescription for patient`,
      );

      return saved;
    } catch (error) {
      this.logSanitizationService.logErrorSafely('Failed to create prescription', error);
      throw error;
    }
  }

  /**
   * Get prescription with decryption and integrity verification
   */
  async getWithVerification(prescriptionId: string, userId: number): Promise<any> {
    try {
      const prescription = await this.prescriptionRepository.findOne(prescriptionId);

      if (!prescription) {
        throw new BadRequestException('Prescription not found');
      }

      // Verify integrity
      const isValid = this.dataIntegrityService.verifySignature(
        {
          patientName: prescription.patientName,
          prescriptionImage: prescription.prescriptionImage,
          doctorId: prescription.doctorId,
          patientId: prescription.patientId,
        },
        prescription.dataSignature,
        process.env.JWT_SECRET,
      );

      if (!isValid) {
        this.logSanitizationService.logErrorSafely(
          'Prescription integrity check failed',
          new Error('Invalid signature'),
        );
        throw new BadRequestException('Prescription data integrity check failed');
      }

      // Decrypt sensitive fields
      const decryptedPatientName = this.encryptionService.decrypt(prescription.patientName);

      // Log access
      this.logSanitizationService.auditDataAccess(
        userId,
        'RETRIEVE_PRESCRIPTION',
        'Prescription',
        prescriptionId,
        true,
      );

      return {
        ...prescription,
        patientName: decryptedPatientName,
      };
    } catch (error) {
      this.logSanitizationService.logErrorSafely('Failed to get prescription', error);
      throw error;
    }
  }
}

/**
 * EXAMPLE 4: Usage in Module
 */
// Import in your module:
// import { DataFilteringService } from '@/common/data-filtering.service';
// import { LogSanitizationService } from '@/common/log-sanitization.service';
// import { EncryptionService } from '@/common/encryption.service';

// Then provide in controllers and services:
// @Module({
//   controllers: [PrescriptionControllerSecure, UsersControllerSecure],
//   providers: [
//     PrescriptionServiceSecure,
//     DataFilteringService,
//     LogSanitizationService,
//     EncryptionService,
//   ],
// })
// export class PrescriptionModule {}

export default {
  PrescriptionControllerSecure,
  UsersControllerSecure,
  PrescriptionServiceSecure,
};
