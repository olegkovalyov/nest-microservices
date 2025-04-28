import { Injectable, Logger } from '@nestjs/common';
import { User } from './user.entity';
import { UserDto } from './dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Result, success, failure } from '@app/common/result';
import { Auth0UserService } from '../auth/auth0-user.service';
import { UserPersistenceService } from './services/user-persistence.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userPersistenceService: UserPersistenceService,
    private readonly auth0UserService: Auth0UserService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<Result<UserDto, Error>> {
    this.logger.log(
      `Attempting to create user with email: ${createUserDto.email}`,
    );

    // 1. Check if user already exists in local DB by email
    const existingUserResult = await this.userPersistenceService.findByEmail(createUserDto.email);
    if (!existingUserResult.success) {
      this.logger.error(`Failed to check for existing user by email ${createUserDto.email}`, existingUserResult.error.stack);
      return failure(new Error(`Database error checking for existing user: ${existingUserResult.error.message}`));
    }
    if (existingUserResult.value) {
      this.logger.warn(`User with email ${createUserDto.email} already exists in local DB.`);
      // Use the specific error message format the controller expects for ALREADY_EXISTS
      return failure(new Error(`Conflict: User with email ${createUserDto.email} already exists.`));
    }
    this.logger.debug(`No existing user found with email ${createUserDto.email} in local DB.`);

    // 2. Create user in Auth0
    this.logger.log(`Creating user in Auth0 for email: ${createUserDto.email}`);
    // Pass CreateUserDto directly, assuming the service handles mapping internally
    const auth0Result = await this.auth0UserService.createUserInAuth0(createUserDto);

    if (!auth0Result.success) {
      this.logger.error(`Failed to create user in Auth0 for email ${createUserDto.email}`, auth0Result.error.stack);
      // Check if Auth0 error indicates a conflict
      if (auth0Result.error.message.toLowerCase().includes('conflict') || auth0Result.error.message.toLowerCase().includes('already exists')) {
        return failure(new Error(`Conflict: User with email ${createUserDto.email} might already exist in Auth0.`));
      } 
      return failure(new Error(`Auth0 error: ${auth0Result.error.message}`));
    }

    const auth0UserId = auth0Result.value;
    this.logger.log(`User successfully created in Auth0 with ID: ${auth0UserId}`);

    // 3. Create and save user in local DB using Persistence Service
    const newUserPersistenceData: Partial<User> = {
      identity_provider_id: auth0UserId,
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      roles: [], // Start with empty roles
    };

    this.logger.log(`Saving user to local DB with Auth0 ID: ${auth0UserId}`);
    const saveResult = await this.userPersistenceService.createUser(newUserPersistenceData);

    if (!saveResult.success) {
        this.logger.error(`Failed to save user ${auth0UserId} to local DB`, saveResult.error.stack);
        // Attempt to clean up Auth0 user if DB save fails?
        // For now, just return the DB error.
        // Consider adding a compensating transaction later if needed.
        this.logger.warn(`Auth0 user ${auth0UserId} was created, but DB save failed. Manual cleanup might be needed.`);
        return failure(new Error(`Database error saving user: ${saveResult.error.message}`));
    }

    const savedUser = saveResult.value;
    this.logger.log(`User successfully saved to DB with local ID: ${savedUser.id}`);

    // 4. Map to UserDto and return success
    const userDto = this.mapEntityToDto(savedUser);
    return success(userDto);
  }

  /**
   * Retrieves a user by their ID.
   * @param id The user ID.
   * @returns A Result containing the UserDto or an Error.
   */
  async getUser(id: string): Promise<Result<UserDto, Error>> {
    this.logger.log(`Attempting to find user with ID: ${id}`);
    // Use persistence service to find the user
    const findResult = await this.userPersistenceService.findById(id);

    // Handle failure from persistence layer
    if (!findResult.success) {
      this.logger.error(`Failed to find user ${id} in persistence layer`, findResult.error.stack);
      // Check if it was specifically a 'not found' error from persistence
      if (findResult.error.message.startsWith('User not found')) {
        this.logger.warn(`User with ID ${id} not found.`);
        // Keep the 'User not found' error message consistent
        return failure(findResult.error);
      } 
      // Otherwise, it's a different database error
      return failure(new Error(`Database error fetching user: ${findResult.error.message}`));
    }

    // User was found by the persistence layer
    const userEntity = findResult.value;
    this.logger.debug(`User found in DB: ${userEntity.id}. Mapping to DTO.`);
    
    // Map entity to DTO
    try {
      const userDto = this.mapEntityToDto(userEntity);
      return success(userDto);
    } catch (mappingError: unknown) {
       // Catch potential errors during mapping (e.g., if mapEntityToDto throws)
       const message = `Error mapping user entity ${id} to DTO`;
       if (mappingError instanceof Error) {
            this.logger.error(message, mappingError.stack);
            return failure(new Error(`${message}: ${mappingError.message}`));
       } else {
            this.logger.error(`${message}. Caught mapping error is not an Error instance: ${JSON.stringify(mappingError)}`);
            return failure(new Error(`${message}: An unknown mapping error occurred.`));
       }
    }
  }

  /**
   * Updates a user's information in both Auth0 and the local database.
   * @param id The local user ID.
   * @param updateUserDto The data transfer object containing updates.
   * @returns A Result containing the updated UserDto or an Error.
   */
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Result<UserDto, Error>> {
    this.logger.log(
      `Attempting to update user ID: ${id} with data: ${JSON.stringify(
        updateUserDto,
      )}`,
    );

    // --- 1. Fetch current user data from DB --- 
    this.logger.debug(`Fetching current user data for ID: ${id}`);
    const initialUserResult = await this.userPersistenceService.findById(id);

    if (!initialUserResult.success) {
      this.logger.error(`Failed to find user ${id} for update.`, initialUserResult.error.stack);
      // Check if it was specifically a 'not found' error
      if (initialUserResult.error.message.startsWith('User not found')) {
         return failure(initialUserResult.error); // Propagate 'not found' error
      }
      return failure(new Error(`Database error fetching user for update: ${initialUserResult.error.message}`));
    }

    const currentUserEntity = initialUserResult.value;
    const auth0UserId = currentUserEntity.identity_provider_id;
    this.logger.debug(`Found user ${id}, Auth0 ID: ${auth0UserId}`);

    // --- 2. Prepare Payloads --- 
    const auth0UpdatePayload: { 
        given_name?: string;
        family_name?: string;
        name?: string; 
    } = {};
    const localDbUpdatePayload: Partial<User> = {};
    let nameNeedsUpdateInAuth0 = false;

    if (updateUserDto.firstName !== undefined && updateUserDto.firstName !== currentUserEntity.firstName) {
        auth0UpdatePayload.given_name = updateUserDto.firstName;
        localDbUpdatePayload.firstName = updateUserDto.firstName;
        nameNeedsUpdateInAuth0 = true;
        this.logger.debug(`Queued firstName update for user ${id}.`);
    }
    if (updateUserDto.lastName !== undefined && updateUserDto.lastName !== currentUserEntity.lastName) {
        auth0UpdatePayload.family_name = updateUserDto.lastName;
        localDbUpdatePayload.lastName = updateUserDto.lastName;
        nameNeedsUpdateInAuth0 = true;
        this.logger.debug(`Queued lastName update for user ${id}.`);
    }
    
    // Construct the full 'name' for Auth0 if first or last name changed (See Memory: 94698fdf)
    if (nameNeedsUpdateInAuth0) {
        const newFirstName = updateUserDto.firstName ?? currentUserEntity.firstName;
        const newLastName = updateUserDto.lastName ?? currentUserEntity.lastName;
        auth0UpdatePayload.name = `${newFirstName} ${newLastName}`.trim();
        this.logger.debug(`Queued full 'name' update for Auth0 user ${auth0UserId}: ${auth0UpdatePayload.name}`);
    }

    // --- 3. Update Auth0 (if necessary) --- 
    let auth0UpdateResult: Result<void, Error> | null = null;
    if (Object.keys(auth0UpdatePayload).length > 0) {
        this.logger.log(`Sending update to Auth0 for user ID: ${auth0UserId} with payload: ${JSON.stringify(auth0UpdatePayload)}`);
        auth0UpdateResult = await this.auth0UserService.updateUserInAuth0(
            auth0UserId,
            auth0UpdatePayload
        );

        if (!auth0UpdateResult.success) {
            this.logger.error(`Failed to update user ${auth0UserId} in Auth0.`, auth0UpdateResult.error.stack);
            // Do not proceed with local DB update if Auth0 failed
            return failure(new Error(`Auth0 update failed: ${auth0UpdateResult.error.message}`));
        }
        this.logger.log(`Successfully updated user ${auth0UserId} in Auth0.`);
    } else {
        this.logger.log(`No changes detected for Auth0 update for user ${id}.`);
    }

    // --- 4. Update Local DB (if necessary) --- 
    let dbUpdateResult: Result<void, Error> | null = null;
    if (Object.keys(localDbUpdatePayload).length > 0) {
      this.logger.log(`Updating local DB for user ID: ${id} with payload: ${JSON.stringify(localDbUpdatePayload)}`);
      dbUpdateResult = await this.userPersistenceService.updateUser(id, localDbUpdatePayload);

      if (!dbUpdateResult.success) {
        this.logger.error(`Failed to update user ${id} in local DB.`, dbUpdateResult.error.stack);
        // Critical: Auth0 might have been updated, but local DB failed. 
        // Log a warning for potential inconsistency.
        this.logger.warn(`POTENTIAL INCONSISTENCY: User ${id} (Auth0 ID: ${auth0UserId}) update failed in local DB after potential Auth0 update.`);
        return failure(new Error(`Local DB update failed: ${dbUpdateResult.error.message}`));
      }
      this.logger.log(`Local DB record update triggered successfully for user ID: ${id}.`);
    } else {
      this.logger.log(`No changes detected for local DB update for user ${id}.`);
    }

    // --- 5. Fetch Final Updated User Data --- 
    // Re-fetch the user to get the latest state (e.g., updated timestamps)
    this.logger.debug(`Re-fetching user ${id} to get final updated state.`);
    const finalUserResult = await this.userPersistenceService.findById(id);

    if (!finalUserResult.success) {
        // This is unlikely if the update succeeded, but handle defensively
        this.logger.error(`Failed to re-fetch user ${id} after update.`, finalUserResult.error.stack);
        return failure(new Error(`Failed to fetch updated user data: ${finalUserResult.error.message}`));
    }
    
    const updatedUserEntity = finalUserResult.value;
    this.logger.log(`Successfully updated user ${id}. Returning updated data.`);

    // --- 6. Map to DTO and Return Success --- 
    try {
        const userDto = this.mapEntityToDto(updatedUserEntity);
        return success(userDto);
    } catch (mappingError: unknown) {
       const message = `Error mapping updated user entity ${id} to DTO`;
       if (mappingError instanceof Error) {
            this.logger.error(message, mappingError.stack);
            return failure(new Error(`${message}: ${mappingError.message}`));
       } else {
            this.logger.error(`${message}. Caught mapping error is not an Error instance: ${JSON.stringify(mappingError)}`);
            return failure(new Error(`${message}: An unknown mapping error occurred.`));
       }
    }
  }

  /**
   * Maps a User entity to a UserDto.
   * @param userEntity The user entity.
   * @returns The user DTO.
   */
  private mapEntityToDto(userEntity: User): UserDto {
    if (!userEntity) {
        this.logger.error('mapEntityToDto called with null or undefined userEntity');
        throw new Error('Cannot map null or undefined user entity to DTO.'); 
        // Or return a specific failure Result if the calling context can handle it
    }
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
