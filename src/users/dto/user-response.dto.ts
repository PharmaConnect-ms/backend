import { ApiProperty } from "@nestjs/swagger/dist/decorators/api-property.decorator";
import { UserRole, AuthProvider } from "src/common/types/types";
import { User } from "../user.entity";

export class UserResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() username: string;
  @ApiProperty({ nullable: true }) email: string | null;
  @ApiProperty() role: UserRole;
  @ApiProperty() provider: AuthProvider;
  @ApiProperty({ nullable: true }) address: string | null;
  @ApiProperty({ nullable: true }) phone: string | null;
}

export const filterUserResponse = (user: User): UserResponseDto => {
  const { id, username, email, role, provider, address, phone } = user;
  return {
    id,
    username,
    email: email || null,
    role: role as UserRole,
    provider: provider as AuthProvider,
    address: address || null,
    phone: phone || null,
  };
}