import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/google.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SecurityEventService } from '@/common/logging/security-event.service';
import { LoginRateLimitGuard } from '@/common/security/login-rate-limit.guard';
@ApiTags('auth') 
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly securityEvents: SecurityEventService,
  ) {}

  @Post('login')
  @UseGuards(LoginRateLimitGuard)
  @ApiBody({ type: LoginDto }) 
  @ApiResponse({ status: 200, description: 'Successful login' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: LoginDto) {
    const { usernameOrEmail, password } = body;
    return this.authService.validateUser(usernameOrEmail, password);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Successful logout' })
  logout(@Req() req: { user: { id?: number; sub?: number } }) {
    this.securityEvents.logLogout(req.user?.id ?? req.user?.sub);
    return { message: 'Logged out successfully' };
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
