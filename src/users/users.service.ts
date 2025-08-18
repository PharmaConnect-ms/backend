import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './create-user.dto';
import { UserResponseDto, filterUserResponse } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
      return this.usersRepository.save(user);
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

      return this.usersRepository.save(user);
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
}
