import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEmail, IsString, IsArray, IsDateString, ArrayNotEmpty } from 'class-validator';

export class UserDto {
  @ApiProperty({
    description: 'Unique identifier of the user (UUID)',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'User email address (unique)',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "User's first name",
    example: 'John',
  })
  @IsString()
  firstName!: string;

  @ApiProperty({
    description: "User's last name",
    example: 'Doe',
  })
  @IsString()
  lastName!: string;

  @ApiProperty({
    description: 'Array of roles assigned to the user',
    example: ['user', 'editor'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roles!: string[];

  @ApiProperty({
    description: 'Timestamp when the user was created',
    example: '2023-10-27T10:00:00.000Z',
  })
  @IsDateString()
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp when the user was last updated',
    example: '2023-10-27T12:30:00.000Z',
  })
  @IsDateString()
  updatedAt!: Date;
}
