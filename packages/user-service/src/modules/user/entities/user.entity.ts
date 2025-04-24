import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({ description: 'Unique user ID from Keycloak' })
  id: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiProperty({ description: 'User is enabled' })
  enabled: boolean;

  @ApiProperty({ description: 'Email is verified' })
  emailVerified: boolean;

  @ApiProperty({ description: 'Roles assigned to the user' })
  roles?: string[];

  @ApiProperty({ description: 'User created timestamp' })
  createdTimestamp?: number;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
} 