// src/app/user/dto/create-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address (must be unique)', example: 'new.user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User password (min 8 characters)', example: 'Str0ngP@sswOrd' })
  @IsString()
  @MinLength(8) // Пример валидации длины пароля
  password!: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({
    description: 'Optional array of roles assigned to the user',
    example: ['user', 'beta-tester'],
    type: [String],
    default: ['user'], // Укажем роль по умолчанию, если необходимо
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roles?: string[];
}
