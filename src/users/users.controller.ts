import { Controller, Post, Body, Get, Param, UseGuards, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';


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
    return this.usersService.findAll();
  }

  //find by email 
  @Get('email/:email')
  @ApiOperation({ summary: 'Get user by email' })
  @ApiOkResponse({ description: 'User found' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }


  //find patient by id
  @Get('patient/:id')
  @ApiOperation({ summary: 'Get patient by user ID' })
  @ApiOkResponse({ description: 'Patient found' })
  @ApiNotFoundResponse({ description: 'Patient not found' })
  async getPatientByUserId(@Param('id') id: number) {
    return this.usersService.findPatientByUserId(id);
  }

  // Update user details
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user details' })
  @ApiOkResponse({ description: 'User updated successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Invalid input or email/username already exists' })
  async updateUser(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

}
