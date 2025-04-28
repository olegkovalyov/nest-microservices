import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { Result, success, failure } from '@app/common/result';

@Injectable()
export class UserPersistenceService {
  private readonly logger = new Logger(UserPersistenceService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<Result<User, Error>> {
    this.logger.debug(`Finding user by id: ${id}`);
    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        this.logger.warn(`User with id ${id} not found.`);
        return failure(new Error(`User not found with ID: ${id}`));
      }
      this.logger.debug(`Found user: ${JSON.stringify(user)}`);
      return success(user);
    } catch (error: unknown) {
      const message = `Error finding user by id ${id}`;
      if (error instanceof Error) {
        this.logger.error(message, error.stack);
        return failure(new Error(`${message}: ${error.message}`));
      } else {
        this.logger.error(`${message}. Caught error is not an Error instance: ${JSON.stringify(error)}`);
        return failure(new Error(`${message}: An unknown error occurred.`));
      }
    }
  }

  async findByEmail(email: string): Promise<Result<User | null, Error>> {
    this.logger.debug(`Finding user by email: ${email}`);
    try {
      const user = await this.userRepository.findOneBy({ email });
      if (user) {
        this.logger.debug(`Found user with email ${email}: ${JSON.stringify(user)}`);
        return success(user);
      } else {
        this.logger.debug(`User with email ${email} not found.`);
        return success(null); // Return success with null if not found
      }
    } catch (error: unknown) {
      const message = `Error finding user by email ${email}`;
      if (error instanceof Error) {
        this.logger.error(message, error.stack);
        return failure(new Error(`${message}: ${error.message}`));
      } else {
        this.logger.error(`${message}. Caught error is not an Error instance: ${JSON.stringify(error)}`);
        return failure(new Error(`${message}: An unknown error occurred.`));
      }
    }
  }

  async createUser(createUserData: Partial<User>): Promise<Result<User, Error>> {
    this.logger.debug(`Creating user with data: ${JSON.stringify(createUserData)}`);
    try {
      const newUser = this.userRepository.create(createUserData);
      const savedUser = await this.userRepository.save(newUser);
      this.logger.debug(`Successfully created user with id: ${savedUser.id}`);
      return success(savedUser);
    } catch (error: unknown) {
      const message = `Error creating user`;
      if (error instanceof Error) {
        // Check for unique constraint violation (e.g., email already exists)
        // TypeORM might throw specific error types depending on the driver (e.g., QueryFailedError)
        // You might need more specific error handling here based on your DB driver
        if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint failed')) {
            this.logger.warn(`${message}: Potential duplicate entry. ${error.message}`);
            // Returning a specific failure might be better, but for now, a generic one
            return failure(new Error(`Conflict: A user with provided details might already exist.`));
        }
        this.logger.error(message, error.stack);
        return failure(new Error(`${message}: ${error.message}`));
      } else {
        this.logger.error(`${message}. Caught error is not an Error instance: ${JSON.stringify(error)}`);
        return failure(new Error(`${message}: An unknown error occurred.`));
      }
    }
  }

  async updateUser(id: string, updateUserData: Partial<User>): Promise<Result<void, Error>> {
    this.logger.debug(`Updating user id ${id} with data: ${JSON.stringify(updateUserData)}`);
    // Ensure we don't try to update with an empty payload
    if (Object.keys(updateUserData).length === 0) {
      this.logger.warn(`Update called for user ${id} with empty payload. Skipping DB update.`);
      return success(undefined);
    }

    try {
      const updateResult = await this.userRepository.update(id, updateUserData);

      if (updateResult.affected === 0) {
        this.logger.warn(`Update operation for user ${id} affected 0 rows. User might not exist.`);
        return failure(new Error(`User not found with ID: ${id} for update.`));
      }

      this.logger.debug(`Successfully triggered update for user id: ${id}. Affected rows: ${updateResult.affected}`);
      return success(undefined);
    } catch (error: unknown) {
      const message = `Error updating user id ${id}`;
      if (error instanceof Error) {
        this.logger.error(message, error.stack);
        return failure(new Error(`${message}: ${error.message}`));
      } else {
        this.logger.error(`${message}. Caught error is not an Error instance: ${JSON.stringify(error)}`);
        return failure(new Error(`${message}: An unknown error occurred.`));
      }
    }
  }

  // TODO: Add other necessary persistence methods if any
}
