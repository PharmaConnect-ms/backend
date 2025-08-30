import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { UserDto } from './dto/user.dto';
import { GoogleUserDto } from './dto/google.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // AuthService.ts
  async validateUser(usernameOrEmail: string, password: string) {
    if (!usernameOrEmail || !password) {
      throw new UnauthorizedException('Username/email and password are required');
    }

    // Try finding user by either username or email
    let user: UserDto | null; 
    const isEmailInput = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usernameOrEmail);
    
    if (isEmailInput) {
      user = await this.usersService.findByEmail(usernameOrEmail);
    } else {
      user = await this.usersService.findByUsername(usernameOrEmail);
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.password) {
      throw new UnauthorizedException('Password not set for this user');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      age: user.age,
      phone: user.phone,
    };

    return { ...payload, token };
  }

  generateToken(user: UserDto) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  // Generate JWT for Google-authenticated users
  async validateGoogleUser(googleUser: GoogleUserDto) {
    const email = googleUser.emails[0].value;
    if (!email) throw new UnauthorizedException('Invalid email');
    let user = await this.usersService.findByEmail(email);

    // If user does not exist, create a new user in the database
    if (!user) {
      user = await this.usersService.createUser({
        username: googleUser.name.givenName,
        email: email,
        password: null,
        role: 'patient',
        provider: 'google',
      });
    }

    return this.generateToken(user);
  }
}
