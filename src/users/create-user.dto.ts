import { IsString, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {

@ApiProperty({ description: 'username', example: 'Dineth Chamara' })
@IsString()
@Length(1, 100)
@Matches(/^[A-Za-z\s]+$/, { message: 'Name must contain only letters and spaces' }) 
username: string;

@ApiProperty({ description: 'User email', example: 'example@gmail.com' })
@IsString()
@Length(1, 100)
email: string;


@ApiProperty({ description: 'User password', example: 'Str0ngP@ssw0rd!' })
@IsString()
@Length(12, 100)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,100}$/, {
  message: 'Password must be at least 12 characters and include uppercase, lowercase, number, and special character',
})
password: string|null;

@ApiProperty({ description: 'User role', example: 'admin' })
@IsString()
@IsOptional()
@Matches(/^(admin|pharmacist|customer|doctor)$/, { message: 'Role must be either "admin" or "user"' })
role?: string;

@ApiProperty({ description: 'User provider', example: 'google' })
@IsString()
@IsOptional()
@Matches(/^(google|local)$/, { message: 'Provider must be either "google" or "local"' })
provider?: 'google' | 'local';


}
