import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBody, ApiResponse, ApiProperty } from '@nestjs/swagger';

class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Username or email' })
  usernameOrEmail: string;

  @ApiProperty({ example: 'P@ssw0rd', description: 'User password' })
  password: string;
}

@ApiTags('auth') 
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiBody({ type: LoginDto }) 
  @ApiResponse({ status: 200, description: 'Successful login' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: LoginDto) {
    const { usernameOrEmail, password } = body;
    return this.authService.validateUser(usernameOrEmail, password);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiResponse({ status: 302, description: 'Redirecting to Google login' })
  async googleAuth() {
    return { message: 'Redirecting to Google login' };
  }

  // @Get('google/callback')
  // @UseGuards(AuthGuard('google'))
  // @ApiResponse({ status: 200, description: 'User details after Google authentication' })
  // googleAuthRedirect(@Req() req) {
  //   return req.user;
  // }

  @Get('google/callback')
@UseGuards(AuthGuard('google'))
@ApiResponse({ status: 200, description: 'User details after Google authentication' })
async googleAuthRedirect(@Req() req) {
  const user = req.user;
  //console.log(user._json);
  // Generate JWT Token
  const token = await this.authService.validateGoogleUser(req.user._json);
  return {
    message: 'Authentication successful',
    user,
    access_token: token,
  };
}




}
