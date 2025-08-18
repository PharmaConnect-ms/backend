import { Expose, Type } from 'class-transformer';

export class GoogleNameDto {
  @Expose()
  familyName: string;

  @Expose()
  givenName: string;
}

export class GoogleEmailDto {
  @Expose()
  value: string;

  @Expose()
  verified: boolean;
}

export class GooglePhotoDto {
  @Expose()
  value: string;
}

export class GoogleUserDto {
  @Expose()
  id: string;

  @Expose()
  displayName: string;

  @Expose()
  @Type(() => GoogleNameDto)
  name: GoogleNameDto;

  @Expose()
  @Type(() => GoogleEmailDto)
  emails: GoogleEmailDto[];

  @Expose()
  @Type(() => GooglePhotoDto)
  photos: GooglePhotoDto[];

  @Expose()
  provider: string;
}

export class AccessTokenDto {
  @Expose()
  access_token: string;
}

export class AuthResponseDto {
  @Expose()
  message: string;

  @Expose()
  @Type(() => GoogleUserDto)
  user: GoogleUserDto;

  @Expose()
  @Type(() => AccessTokenDto)
  access_token: AccessTokenDto;
}
