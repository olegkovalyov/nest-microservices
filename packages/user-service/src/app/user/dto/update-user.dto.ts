// src/app/user/dto/update-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
} from 'class-validator';

export class UpdateUserDto {
  // ID не включаем сюда, он будет передаваться как параметр пути или отдельным полем в gRPC,
  // но не как часть данных для *обновления*.
  // Если же ID передается в теле запроса, то раскомментируй:
  // @ApiProperty({ description: 'User ID (UUID)', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  // @IsUUID()
  // readonly id: string; // readonly, т.к. ID обычно не меняется

  @ApiPropertyOptional({ description: 'New user email address', example: 'updated.user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Пароль обычно обновляется отдельным процессом/эндпоинтом для безопасности,
  // поэтому не включаем его сюда по умолчанию.

  @ApiPropertyOptional({ description: 'New user first name', example: 'Johnny' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'New user last name', example: 'Doer' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'New array of roles assigned to the user',
    example: ['admin', 'user'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roles?: string[];

}
