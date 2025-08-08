import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateUserDto } from './create-user.dto';
import { User } from './user.entity';
import { AuthGuard } from '@nestjs/passport';


@ApiTags('Users')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User created' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<User> {
    if(!createUserDto.email || !createUserDto.password) {
      throw new Error('Invalid input');
    }
    return this.usersService.createUser(createUserDto);
  }

  
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiOkResponse({ description: 'User found' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUser(@Param('id') id: number) {
    return this.usersService.findById(id);
  }
 
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ description: 'Users found' })
  @UseGuards(JwtAuthGuard)
  async getUsers() {
    return this.usersService.findall();
  }

  //find by email 
  @Get('email/:email')
  @ApiOperation({ summary: 'Get user by email' })
  @ApiOkResponse({ description: 'User found' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

// @Post('login')
// @ApiOperation({ summary: 'Login' })
// @ApiCreatedResponse({ description: 'User logged in' })
// @ApiBadRequestResponse({ description: 'Invalid input' })
// async login(
//   @Body() createUserDto: CreateUserDto,
// ): Promise<User> {
//   if(!createUserDto.email || !createUserDto.password) {
//     throw new Error('Invalid input');
//   }
//   const user = await this.usersService.validateUser(String(createUserDto.email), String(createUserDto.password));
//   if (!user) {
//     throw new Error('Invalid credentials');
//   }
//   return user;

// }



}
