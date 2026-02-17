import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto, filterUserResponse } from './dto/user-response.dto';
import { SecurityEventService } from '@/common/logging/security-event.service';
import { RequestContextService } from '@/common/logging/request-context.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly securityEvents: SecurityEventService,
    private readonly requestContext: RequestContextService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, password, role, provider } = createUserDto;

    if (!email) {
      throw new Error('Invalid input');
    }

    if (provider === 'google') {
      const existingUser = await this.usersRepository.findOne({ where: { email } });
      if (existingUser) {
        return existingUser; // or maybe throw an exception or update user details
      }
      const user = this.usersRepository.create({ username, email, role, provider });
      const savedUser = await this.usersRepository.save(user);
      const actor = this.requestContext.get();
      if (actor?.userRole === 'admin') {
        this.securityEvents.logAdminAction('user.create', savedUser.id, {
          role: savedUser.role,
        });
      }
      return savedUser;
    } else {
      if (!password) {
        throw new BadRequestException('Password is required for local users');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const existingUser = await this.usersRepository.findOne({
        where: [{ username }, { email }],
      });

      if (existingUser) {
        return existingUser;
      }

      // Create and save only if it's truly new
      const user = this.usersRepository.create({
        username,
        email,
        password: hashedPassword,
        role,
        provider,
      });

      const savedUser = await this.usersRepository.save(user);
      const actor = this.requestContext.get();
      if (actor?.userRole === 'admin') {
        this.securityEvents.logAdminAction('user.create', savedUser.id, {
          role: savedUser.role,
        });
      }
      return savedUser;
    }
  }

  async findByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<UserResponseDto> {
    if (!id) {
      throw new BadRequestException('Invalid user ID');
    }
    const entity = await this.usersRepository.findOne({ where: { id } });
    if (!entity) {
      throw new BadRequestException('User not found');
    }
    return filterUserResponse(entity);
  }

  async findAll() {
    return this.usersRepository.find();
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;

    return user;
  }

  async findPatientByUserId(id: number): Promise<UserResponseDto> {
    const patient = await this.usersRepository.findOne({
      where: { id, role: 'patient' },
    });
    if (!patient) {
      throw new BadRequestException('Patient not found');
    }
    return filterUserResponse(patient);
  }

  //update user summary
  async updateUserSummary(id: number, summary: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.userSummary = summary;
    await this.usersRepository.save(user);
    return filterUserResponse(user);
  }

  // Update user details
  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    

    // Check if email is being updated and if it's unique
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({ 
        where: { email: updateUserDto.email } 
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Check if username is being updated and if it's unique
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.usersRepository.findOne({ 
        where: { username: updateUserDto.username } 
      });
      if (existingUser) {
        throw new BadRequestException('Username already exists');
      }
    }

    const previousRole = user.role;

    // Update user properties
    Object.assign(user, updateUserDto);
    
    const updatedUser = await this.usersRepository.save(user);
    const actor = this.requestContext.get();
    if (actor?.userRole === 'admin' || updateUserDto.role !== undefined) {
      this.securityEvents.logAdminAction('user.update', id, {
        changedFields: Object.keys(updateUserDto),
        roleChanged: previousRole !== updatedUser.role,
      });
    }

    return filterUserResponse(updatedUser);
  }

  async listAllDoctors(): Promise<UserResponseDto[]> {
    const result = await this.usersRepository.find({ where: { role: 'doctor' } });
    return result.map(user => filterUserResponse(user));
  }
}
