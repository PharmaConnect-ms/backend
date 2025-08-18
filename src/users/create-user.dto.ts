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


@ApiProperty({ description: 'User password', example: 'P@ssw0rd' })
@IsString()
@Length(8, 100)
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
