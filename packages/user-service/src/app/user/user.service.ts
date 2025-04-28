import {Injectable, Logger} from '@nestjs/common';
import {Auth0UserService} from '../auth/auth0-user.service';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserDto} from './dto/user.dto';
import {Result, failure, success} from '@app/common/result';
import {InjectRepository} from '@nestjs/typeorm';
import {User} from './user.entity';
import {Repository} from 'typeorm';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly auth0UserService: Auth0UserService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<Result<UserDto, Error>> {
    this.logger.log(`UserService: Attempting to create user for email: ${createUserDto.email}`);

    // 1. Create user in Auth0
    const auth0Result = await this.auth0UserService.createUserInAuth0(createUserDto);

    if (!auth0Result.success) {
      // Auth0 creation failed (could be conflict or other error)
      this.logger.warn(`Failed to create user in Auth0: ${auth0Result.error.message}`);
      return failure(auth0Result.error);
    }

    const auth0UserId = auth0Result.value;
    this.logger.log(`User created in Auth0, ID: ${auth0UserId}. Proceeding to save in DB.`);

    // 2. Create and save user in local DB
    try {
      const newUser = this.userRepository.create({
        identity_provider_id: auth0UserId,
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        roles: [], // Start with empty roles
      });

      const savedUser: User = await this.userRepository.save(newUser);
      this.logger.log(`User successfully saved to DB with ID: ${savedUser.id}`);

      // 3. Map to UserDto and return success
      const userDto: UserDto = this.mapEntityToDto(savedUser); // Use helper function
      return success(userDto);

    } catch (dbError) {
      this.logger.error(`Failed to save user (Auth0 ID: ${auth0UserId}) to DB: ${(dbError as Error).message}`, (dbError as Error).stack);
      // TODO: Consider rolling back Auth0 user creation here if it's critical
      return failure(new Error('Failed to save user to database after successful Auth0 creation'));
    }
  }

  /**
   * Retrieves a user by their internal database ID.
   */
  async getUser(id: string): Promise<Result<UserDto, Error>> {
    this.logger.log(`Attempting to find user with ID: ${id}`);
    try {
      const userEntity = await this.userRepository.findOneBy({ id });

      if (!userEntity) {
        this.logger.warn(`User with ID ${id} not found.`);
        // Return a more specific error type if needed elsewhere
        return failure(new Error(`User not found with ID: ${id}`));
      }

      this.logger.log(`User found: ${userEntity.email}`);
      const userDto: UserDto = this.mapEntityToDto(userEntity); // Use helper function
      return success(userDto);

    } catch (dbError) {
      const errorMessage = `Database error while fetching user with ID ${id}: ${(dbError as Error).message}`;
      this.logger.error(errorMessage, (dbError as Error).stack);
      return failure(new Error(errorMessage));
    }
  }

  /**
   * Updates a user's first name and/or last name in Auth0 and the local database.
   * @param id The internal database ID of the user to update.
   * @param updateUserDto DTO containing the fields to update (firstName, lastName).
   * @returns A Result containing the updated UserDto on success, or an Error on failure.
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<Result<UserDto, Error>> {
    this.logger.debug(`Attempting to update user with id: ${id}, data: ${JSON.stringify(updateUserDto)}`);

    // 1. Find user in local DB to get Auth0 ID
    let userEntity: User | null;
    try {
      userEntity = await this.userRepository.findOneBy({ id });
      if (!userEntity) {
        this.logger.error(`User with id ${id} not found for update.`);
        return failure(new Error(`User not found with ID: ${id}`));
      }
    } catch (dbError) {
      const errorMessage = `DB error finding user ${id} for update: ${(dbError as Error).message}`;
      this.logger.error(errorMessage, (dbError as Error).stack);
      return failure(new Error(errorMessage));
    }
    this.logger.debug(`Found existing user: ${JSON.stringify(userEntity)}`);

    if (!userEntity.identity_provider_id) {
      const error = new Error(`User with id ${id} does not have an associated Auth0 ID.`);
      this.logger.error(error.message);
      return failure(error);
    }
    this.logger.debug(`User Auth0 ID: ${userEntity.identity_provider_id}`);

    // Prepare payload for Auth0 update (only include fields present in DTO and changed)
    const auth0UpdatePayload: { name?: string; given_name?: string; family_name?: string } = {};
    let changesExist = false; // Track if any field needs updating

    console.log('User entity: ', userEntity);
    if (updateUserDto.firstName !== undefined && updateUserDto.firstName !== userEntity.firstName) {
      auth0UpdatePayload.given_name = updateUserDto.firstName;
      changesExist = true;
    }
    if (updateUserDto.lastName !== undefined && updateUserDto.lastName !== userEntity.lastName) {
      auth0UpdatePayload.family_name = updateUserDto.lastName;
      changesExist = true;
    }

    // Construct the full name if any part changed
    if (changesExist) {
      const newFirstName = updateUserDto.firstName ?? userEntity.firstName ?? '';
      const newLastName = updateUserDto.lastName ?? userEntity.lastName ?? '';
      // Concatenate, ensuring space only if both parts exist
      auth0UpdatePayload.name = `${newFirstName}${newFirstName && newLastName ? ' ' : ''}${newLastName}`.trim();
    }

    this.logger.debug(`Constructed Auth0 update payload: ${JSON.stringify(auth0UpdatePayload)}`);

    // Call Auth0 service only if there are changes
    if (Object.keys(auth0UpdatePayload).length > 0) {
      this.logger.debug(`Calling Auth0UserService to update user in Auth0...`);
      const auth0UpdateResult = await this.auth0UserService.updateUserInAuth0(
        userEntity.identity_provider_id,
        auth0UpdatePayload,
      );

      if (!auth0UpdateResult.success) {
        this.logger.error(`Failed to update user in Auth0: ${auth0UpdateResult.error.message}`, auth0UpdateResult.error.stack);
        // Decide if we should proceed with DB update or return failure
        // For now, let's return failure to ensure consistency
        return failure(auth0UpdateResult.error);
      }
      this.logger.debug(`Successfully updated user in Auth0.`);
    } else {
      this.logger.debug(`No changes detected for Auth0 update.`);
    }

    // Prepare payload for local DB update (use fields from DTO if they exist)
    const localDbUpdatePayload: { firstName?: string; lastName?: string } = {};
    if (updateUserDto.firstName !== undefined) {
      localDbUpdatePayload.firstName = updateUserDto.firstName;
    }
    if (updateUserDto.lastName !== undefined) {
      localDbUpdatePayload.lastName = updateUserDto.lastName;
    }
    this.logger.debug(`Updating local database with payload: ${JSON.stringify(localDbUpdatePayload)}`);

    // Update local DB if there were changes OR if Auth0 was updated (to sync updatedAt)
    if (changesExist || Object.keys(auth0UpdatePayload).length > 0) {
      try {
        // Only update if there's something to update
        if (Object.keys(localDbUpdatePayload).length > 0 || Object.keys(auth0UpdatePayload).length > 0) {
          this.logger.log(`Updating local DB for user ID: ${id} with payload: ${JSON.stringify(localDbUpdatePayload)}`);
          // Use update to only modify specified columns and trigger @UpdateDateColumn
          await this.userRepository.update(id, localDbUpdatePayload);
          this.logger.log(`Local DB record updated trigger sent for user ID: ${id}`);
        } else {
          this.logger.log(`Local DB payload is empty and Auth0 was not updated, skipping local DB update for user ID: ${id}.`);
        }

        // 6. Fetch the updated entity to get latest data (including timestamps)
        const updatedUserEntity = await this.userRepository.findOneBy({ id });
        if (!updatedUserEntity) {
          // Should not happen if update succeeded, but handle defensively
          this.logger.error(`Failed to re-fetch user ${id} after update.`);
          return failure(new Error(`Failed to fetch user ${id} after update.`));
        }
        userEntity = updatedUserEntity; // Use the newly fetched entity

      } catch (dbError) {
        const errorMessage = `Failed to update local DB for user ${id} (Auth0 ID: ${userEntity.identity_provider_id}): ${(dbError as Error).message}`;
        this.logger.error(errorMessage, (dbError as Error).stack);
        // TODO: Consistency issue - Auth0 updated, DB failed. Consider strategies (retry, log, etc.)
        return failure(new Error(errorMessage));
      }
    } else {
      this.logger.log(`No changes detected, skipping local DB update for user ID: ${id}.`);
    }

    // 7. Map updated entity to DTO and return success
    const updatedUserDto = this.mapEntityToDto(userEntity); // Map the final entity state
    this.logger.debug(`Returning updated user data: ${JSON.stringify(updatedUserDto)}`);
    return success(updatedUserDto);
  }

  /**
   * Helper function to map User entity to UserDto.
   */
  private mapEntityToDto(userEntity: User): UserDto {
    return {
      id: userEntity.id,
      email: userEntity.email,
      firstName: userEntity.firstName,
      lastName: userEntity.lastName,
      roles: userEntity.roles,
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
      auth0Id: userEntity.identity_provider_id, // Include Auth0 ID if needed in DTO
    };
  }
}
