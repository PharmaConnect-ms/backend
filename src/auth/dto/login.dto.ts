//import { IsString, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {

@ApiProperty({ example: 'user@example.com', description: 'Username or email' })
usernameOrEmail: string;

@ApiProperty({ example: 'P@ssw0rd', description: 'User password' })
password: string;


}
