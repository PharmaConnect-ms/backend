import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  role: string;

  @Expose()
  provider: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  address: string;

  @Expose()
  password:string;

}
