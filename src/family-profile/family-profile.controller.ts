import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { FamilyProfileService } from './family-profile.service';
import {
  CreateFamilyMemberDto,
  UpdateFamilyMemberDto,
  CreateCareProfileDto,
} from './dto';

@ApiTags('Family Profile')
@Controller('family-profile')
export class FamilyProfileController {
  constructor(
    private readonly familyProfileService: FamilyProfileService,
  ) {}

  @Post('members')
  @ApiOperation({ 
    summary: 'Create a new family member',
    description: 'Add a new family member to the user\'s family profile. Supports dependents like children, elderly parents, or other family members requiring care.'
  })
  @ApiBody({ 
    type: CreateFamilyMemberDto,
    description: 'Family member information including userId, name, age, relationship, and medical details'
  })
  @ApiCreatedResponse({ 
    description: 'Family member created successfully',
    schema: {
      example: {
        id: 'uuid-string',
        name: 'John Doe Jr.',
        age: 8,
        relationship: 'child',
        careLevel: 'assisted',
        allergies: ['peanuts'],
        medications: ['vitamins'],
        createdAt: '2025-09-16T00:00:00.000Z'
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async createFamilyMember(
    @Body() createFamilyMemberDto: CreateFamilyMemberDto,
  ) {
    return await this.familyProfileService.createFamilyMember(
      createFamilyMemberDto,
      createFamilyMemberDto.userId,
    );
  }

  @Get('members/list/:userId')
  @ApiOperation({ 
    summary: 'Get all family members',
    description: 'Retrieve all active family members for the specified user'
  })
  @ApiParam({ 
    name: 'userId', 
    type: 'string', 
    description: 'ID of the user'
  })
  @ApiOkResponse({ 
    description: 'List of family members retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        example: {
          id: 'uuid-string',
          name: 'John Doe Jr.',
          age: 8,
          relationship: 'child',
          careLevel: 'assisted',
          careProfiles: []
        }
      }
    }
  })
  async getFamilyMembers(@Param('userId') userId: string) {
    return await this.familyProfileService.getFamilyMembers(userId);
  }

  @Get('members/:id/details')
  @ApiOperation({ 
    summary: 'Get family member by ID',
    description: 'Retrieve detailed information about a specific family member including care profiles and appointments'
  })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of the family member'
  })
  @ApiOkResponse({ 
    description: 'Family member details retrieved successfully',
    schema: {
      example: {
        id: 'uuid-string',
        name: 'John Doe Jr.',
        age: 8,
        relationship: 'child',
        careLevel: 'assisted',
        careProfiles: [],
        appointments: []
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Family member not found' })
  async getFamilyMember(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.familyProfileService.getFamilyMemberByIdSimple(id);
  }

  @Patch('members/:id')
  @ApiOperation({ 
    summary: 'Update family member',
    description: 'Update information for an existing family member'
  })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of the family member to update'
  })
  @ApiBody({ 
    type: UpdateFamilyMemberDto,
    description: 'Updated family member information'
  })
  @ApiOkResponse({ 
    description: 'Family member updated successfully',
    schema: {
      example: {
        id: 'uuid-string',
        name: 'John Doe Jr.',
        age: 9,
        updatedAt: '2025-09-16T00:00:00.000Z'
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Family member not found' })
  @ApiBadRequestResponse({ description: 'Invalid update data' })
  async updateFamilyMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFamilyMemberDto: UpdateFamilyMemberDto,
  ) {
    return await this.familyProfileService.updateFamilyMemberSimple(
      id,
      updateFamilyMemberDto,
    );
  }

  @Delete('members/:id')
  @ApiOperation({ 
    summary: 'Delete family member',
    description: 'Soft delete a family member (sets isActive to false)'
  })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of the family member to delete'
  })
  @ApiOkResponse({ 
    description: 'Family member deleted successfully',
    schema: {
      example: {
        message: 'Family member deleted successfully'
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Family member not found' })
  async deleteFamilyMember(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.familyProfileService.deleteFamilyMemberSimple(id);
    return { message: 'Family member deleted successfully' };
  }

  @Post('care-profiles')
  @ApiOperation({ 
    summary: 'Create care profile',
    description: 'Create a care task/schedule for a family member'
  })
  @ApiBody({ 
    type: CreateCareProfileDto,
    description: 'Care profile information including userId, task type, frequency, and scheduling'
  })
  @ApiCreatedResponse({ 
    description: 'Care profile created successfully',
    schema: {
      example: {
        id: 'uuid-string',
        title: 'Morning Medication',
        taskType: 'medication',
        frequency: 'daily',
        scheduledTime: '08:00',
        familyMemberId: 'uuid-string',
        createdAt: '2025-09-16T00:00:00.000Z'
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Invalid care profile data' })
  @ApiNotFoundResponse({ description: 'Family member not found' })
  async createCareProfile(
    @Body() createCareProfileDto: CreateCareProfileDto,
  ) {
    return await this.familyProfileService.createCareProfile(
      createCareProfileDto,
      createCareProfileDto.userId,
    );
  }

  @Get('members/:id/care-profiles')
  @ApiOperation({ 
    summary: 'Get care profiles for family member',
    description: 'Retrieve all active care profiles/tasks for a specific family member'
  })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of the family member'
  })
  @ApiOkResponse({ 
    description: 'Care profiles retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        example: {
          id: 'uuid-string',
          title: 'Morning Medication',
          taskType: 'medication',
          frequency: 'daily',
          scheduledTime: '08:00',
          instructions: 'Check blood sugar first'
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Family member not found' })
  async getCareProfiles(
    @Param('id', ParseUUIDPipe) familyMemberId: string,
  ) {
    return await this.familyProfileService.getCareProfilesByMemberSimple(familyMemberId);
  }

  @Patch('care-profiles/:id')
  @ApiOperation({ 
    summary: 'Update care profile',
    description: 'Update an existing care profile/task'
  })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of the care profile to update'
  })
  @ApiBody({ 
    description: 'Partial care profile data to update',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        scheduledTime: { type: 'string', format: 'time' },
        instructions: { type: 'string' }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'Care profile updated successfully',
    schema: {
      example: {
        id: 'uuid-string',
        title: 'Evening Medication',
        updatedAt: '2025-09-16T00:00:00.000Z'
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Care profile not found' })
  async updateCareProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<CreateCareProfileDto>,
  ) {
    return await this.familyProfileService.updateCareProfileSimple(
      id,
      updateData,
    );
  }

  @Delete('care-profiles/:id')
  @ApiOperation({ 
    summary: 'Delete care profile',
    description: 'Soft delete a care profile (sets isActive to false)'
  })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    format: 'uuid',
    description: 'UUID of the care profile to delete'
  })
  @ApiOkResponse({ 
    description: 'Care profile deleted successfully',
    schema: {
      example: {
        message: 'Care profile deleted successfully'
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Care profile not found' })
  async deleteCareProfile(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.familyProfileService.deleteCareProfileSimple(id);
    return { message: 'Care profile deleted successfully' };
  }
}
