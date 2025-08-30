import { IsString, IsOptional, Length, Matches, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: 'Username', example: 'Dineth Chamara', required: false })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  @Matches(/^[A-Za-z\s]+$/, { message: 'Name must contain only letters and spaces' })
  username?: string;

  @ApiProperty({ description: 'User email', example: 'example@gmail.com', required: false })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  @Length(1, 100)
  email?: string;

  @ApiProperty({ description: 'Phone number', example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  @Length(1, 20)
  phone?: string;

  @ApiProperty({ description: 'Address', example: '123 Main St, City, Country', required: false })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  address?: string;

  @ApiProperty({ description: 'User summary/bio', example: 'Experienced doctor specializing in cardiology', required: false })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  userSummary?: string;

  @ApiProperty({ description: 'Profile picture URL', example: 'https://example.com/profile.jpg', required: false })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  profilePicture?: string;

  @ApiProperty({ description: 'Age', example: '30', required: false })
  @IsString()
  @IsOptional()
  @Length(1, 3)
  age?: string;

  @ApiProperty({ description: 'User role', example: 'doctor', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^(admin|pharmacist|customer|doctor|patient)$/, { message: 'Role must be one of: admin, pharmacist, customer, doctor, patient' })
  role?: string;
}
