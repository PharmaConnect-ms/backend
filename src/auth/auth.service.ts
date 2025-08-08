import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

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
    const user = (await this.usersService.findByUsername(usernameOrEmail)) || (await this.usersService.findByEmail(usernameOrEmail));

    if (!user) {
      throw new UnauthorizedException('User not found');
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
    };

    return { ...payload, token };
  }

  generateToken(user: any) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  // Generate JWT for Google-authenticated users
  async validateGoogleUser(googleUser: any) {
    const email = googleUser.email;
    if (!email) throw new UnauthorizedException('Invalid email');
    let user = await this.usersService.findByEmail(email as string);

    // If user does not exist, create a new user in the database
    if (!user) {
      user = await this.usersService.createUser({
        username: googleUser.name,
        email: googleUser.email,
        password: null,
        role: 'patient',
        provider: 'google',
      });
    }

    return this.generateToken(user);
  }
}
