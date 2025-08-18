import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/google.dto';
import { LoginDto } from './dto/login.dto';
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
  googleAuth() {
    return { message: 'Redirecting to Google login' };
  }


@Get('google/callback')
@UseGuards(AuthGuard('google'))
@ApiResponse({ status: 200, description: 'User details after Google authentication' })
async googleAuthRedirect(@Req() req: AuthResponseDto) {
  const user = req.user;
  const token = await this.authService.validateGoogleUser(req.user);
  return {
    message: 'Authentication successful',
    user,
    access_token: token,
  };
}




}
