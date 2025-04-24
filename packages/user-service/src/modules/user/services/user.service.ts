import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor() {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating new user: ${createUserDto.username}`);
    // TODO: Integrate with Auth0 for user creation
    // Return a stub user for now
    return new User({
      id: 'stub-id',
      username: createUserDto.username,
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      enabled: true,
      emailVerified: false,
      createdTimestamp: Date.now(),
    });
  }

  async findAll(): Promise<User[]> {
    // Здесь можно реализовать получение всех пользователей через KeycloakService
    // Но пока оставим заглушку
    this.logger.log('Finding all users');
    return [];
  }

  async findOne(id: string): Promise<User> {
    this.logger.log(`Finding user by id: ${id}`);
    
    const userInfo = await this.keycloakService.getUserById(id);
    
    if (!userInfo) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    
    return new User({
      id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      enabled: userInfo.enabled,
      emailVerified: userInfo.emailVerified,
      createdTimestamp: userInfo.createdTimestamp,
    });
  }

  async findByUsername(username: string): Promise<User> {
    this.logger.log(`Finding user by username: ${username}`);
    
    const userInfo = await this.keycloakService.getUserByUsername(username);
    
    if (!userInfo) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    
    return new User({
      id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      enabled: userInfo.enabled,
      emailVerified: userInfo.emailVerified,
      createdTimestamp: userInfo.createdTimestamp,
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with id: ${id}`);
    
    // Сначала проверяем, существует ли пользователь
    const existingUser = await this.keycloakService.getUserById(id);
    
    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    
    // Подготавливаем данные для обновления
    const userData = { ...existingUser };
    
    if (updateUserDto.firstName) {
      userData.firstName = updateUserDto.firstName;
    }
    
    if (updateUserDto.lastName) {
      userData.lastName = updateUserDto.lastName;
    }
    
    if (updateUserDto.email) {
      userData.email = updateUserDto.email;
    }
    
    // Обновляем профиль пользователя в Keycloak
    await this.keycloakService.updateUser(id, userData);
    
    // Если предоставлен новый пароль, нужно его обновить отдельно
    if (updateUserDto.password) {
      // Обновление пароля (реализуйте в KeycloakService)
      // await this.keycloakService.updatePassword(id, updateUserDto.password);
    }
    
    // Получаем обновленного пользователя
    const updatedUser = await this.keycloakService.getUserById(id);
    
    return new User({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      enabled: updatedUser.enabled,
      emailVerified: updatedUser.emailVerified,
      createdTimestamp: updatedUser.createdTimestamp,
    });
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Removing user with id: ${id}`);
    
    // Сначала проверяем, существует ли пользователь
    const existingUser = await this.keycloakService.getUserById(id);
    
    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    
    await this.keycloakService.deleteUser(id);
  }

  // Метод для преобразования данных из Keycloak в наш формат User
  private mapKeycloakUser(keycloakUser: any): User {
    return new User({
      id: keycloakUser.id,
      username: keycloakUser.username,
      email: keycloakUser.email,
      firstName: keycloakUser.firstName,
      lastName: keycloakUser.lastName,
      enabled: keycloakUser.enabled,
      emailVerified: keycloakUser.emailVerified,
      createdTimestamp: keycloakUser.createdTimestamp,
    });
  }
} 