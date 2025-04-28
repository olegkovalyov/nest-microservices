import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Auth0MgmtTokenService } from './auth0-mgmt-token.service';
import { HttpService } from '@nestjs/axios';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { Result, success, failure } from '@app/common/result';
import axios, { AxiosError } from 'axios';

@Injectable()
export class Auth0UserService {
  private readonly logger = new Logger(Auth0UserService.name);
  private readonly httpService: HttpService;

  constructor(
    private readonly configService: ConfigService,
    private readonly auth0MgmtTokenService: Auth0MgmtTokenService,
    httpService: HttpService,
  ) {
    this.httpService = httpService;
  }

  /**
   * Creates a user in Auth0 and assigns the default 'user' role.
   * Returns the Auth0 user ID on success.
   */
  async createUserInAuth0(
    createUserDto: CreateUserDto,
  ): Promise<Result<string, Error>> {
    try {
      const mgmtTokenResult = await this.auth0MgmtTokenService.getMgmtToken();
      if (!mgmtTokenResult.success) {
        const errMsg = 'Failed to get Auth0 mgmt token';
        this.logger.error(errMsg, mgmtTokenResult.error);
        return failure(new Error(`Failed to get Auth0 mgmt token: ${mgmtTokenResult.error?.message}`));
      }
      const mgmtToken = mgmtTokenResult.value;

      const auth0ApiUrl = this.configService.get<string>('AUTH0_MGMT_API_URL');
      const defaultUserRoleId = this.configService.get<string>('AUTH0_USER_ROLE_ID');
      const connection = this.configService.get<string>('AUTH0_CONNECTION');

      if (!auth0ApiUrl) {
        this.logger.error('AUTH0_MGMT_API_URL is not configured.');
        return failure(new Error('Auth0 User Role ID configuration is missing.'));
      }
      if (!connection) {
        this.logger.error('AUTH0_CONNECTION is not configured.');
        return failure(new Error('Auth0 Connection configuration is missing.'));
      }

      const { email, password, firstName, lastName } = createUserDto;

      const headers = {
        Authorization: `Bearer ${mgmtToken}`,
        'Content-Type': 'application/json',
      };

      // --- Step 1: Create User ---
      const createUserUrl = `${auth0ApiUrl}/api/v2/users`;
      const createUserPayload = {
        email,
        password,
        connection,
        given_name: firstName,
        family_name: lastName,
        // Auth0 'name' field might be optional or derived, let's use firstName + lastName
        name: `${firstName || ''} ${lastName || ''}`.trim(),
      };

      try {
        const response = await this.httpService.axiosRef.post(createUserUrl, createUserPayload, { headers });
        const userId = response.data.user_id;
        this.logger.log(`Successfully created user in Auth0 with ID: ${userId}`);

        // --- Step 2: Assign Default Role ---
        const assignRoleUrl = `${auth0ApiUrl}/api/v2/users/${userId}/roles`;
        const assignRolePayload = {
          roles: [defaultUserRoleId],
        };

        try {
          this.logger.log(`Assigning role ${defaultUserRoleId} to user ${userId}`);
          await this.httpService.axiosRef.post(assignRoleUrl, assignRolePayload, { headers });
          this.logger.log(`Successfully assigned role ${defaultUserRoleId} to user ${userId}`);
        } catch (error) {
          // Provide type for expected error data
          const axiosError = error as AxiosError<{ message?: string; error?: string, statusCode?: number }>;
          // Log a warning but don't fail the entire operation
          const errorMessage = `Failed to assign default role ${defaultUserRoleId} to user ${userId}: ${axiosError.response?.data?.message || axiosError.message}`;
          this.logger.warn(errorMessage, axiosError.stack);
          // Continue successfully as the user was created
        }

        // Return success with the Auth0 user ID
        return success(userId);
      } catch (error) {
        // Handle specific Auth0 API error during user creation
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<{ message?: string; error?: string, statusCode?: number }>;
          const status = axiosError.response?.status;
          const auth0Message = (axiosError.response?.data as any)?.message || axiosError.message;

          if (status === 409) {
            // User conflict (already exists)
            const conflictMessage = `User creation conflict (Auth0): ${auth0Message}`;
            this.logger.warn(conflictMessage);
            return failure(new Error(conflictMessage));
          }

          // Other Auth0 API errors
          const apiErrorMessage = `Auth0 API error (${status}): ${auth0Message}`;
          this.logger.error(apiErrorMessage, axiosError.stack);
          return failure(new Error(apiErrorMessage));
        }
        // Handle non-Axios errors during Auth0 API call
        const nonAxiosErrorMessage = `Unexpected error during Auth0 user creation: ${(error as Error)?.message}`;
        this.logger.error(nonAxiosErrorMessage, (error as Error)?.stack);
        return failure(new Error(nonAxiosErrorMessage));
      }
    } catch (err) {
      // Handle errors from getToken or unexpected issues
      const genericErrorMessage = `Failed to create user due to an unexpected error: ${(err as Error)?.message}`;
      this.logger.error(genericErrorMessage, (err as Error)?.stack);
      return failure(new Error(genericErrorMessage));
    }
  }

  /**
   * Updates a user in Auth0.
   * @param auth0UserId The ID of the user in Auth0.
   * @param payload An object containing fields to update (e.g., { given_name: 'NewFirstName', family_name: 'NewLastName' }).
   *                Only include fields that need to be changed.
   * @returns Result<void, Error> indicating success or failure.
   */
  async updateUserInAuth0(auth0UserId: string, payload: { name?: string; given_name?: string; family_name?: string }): Promise<Result<void, Error>> {
    this.logger.debug(`Attempting to update user in Auth0. User ID: ${auth0UserId}, Payload: ${JSON.stringify(payload)}`);

    if (!auth0UserId) {
      const error = new Error('Auth0 User ID is required for updating.');
      this.logger.error(error.message);
      return failure(error);
    }

    if (Object.keys(payload).length === 0) {
      this.logger.debug('Payload is empty, no update needed in Auth0.');
      return success(undefined); // Nothing to update
    }

    // 1. Get Management API Token
    this.logger.debug('Retrieving Auth0 Management API token...');
    const tokenResult = await this.auth0MgmtTokenService.getMgmtToken();
    if (!tokenResult.success) {
      this.logger.error('Failed to get Management API token for update.', tokenResult.error.stack);
      return failure(new Error(`Failed to get Management API token: ${tokenResult.error.message}`));
    }
    const accessToken = tokenResult.value;
    this.logger.debug('Successfully retrieved Management API token.');

    // 2. Prepare request
    const auth0Domain = this.configService.get<string>('AUTH0_DOMAIN');
    if (!auth0Domain) {
        const error = new Error('AUTH0_DOMAIN is not configured.');
        this.logger.error(error.message);
        return failure(error);
    }
    const apiUrl = `https://${auth0Domain}/api/v2/users/${encodeURIComponent(auth0UserId)}`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    this.logger.debug(`Auth0 API URL for update: ${apiUrl}`);
    this.logger.debug(`Auth0 API Payload for update: ${JSON.stringify(payload)}`);

    // 3. Make the API call to update the user
    try {
      this.logger.debug('Sending PATCH request to Auth0 Management API...');
      const response = await axios.patch(apiUrl, payload, { headers });
      this.logger.debug(`Auth0 API update successful. Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
      return success(undefined);
    } catch (error) {
      let errorMessage = `Failed to update user ${auth0UserId} in Auth0.`;
      if (axios.isAxiosError(error)) {
        errorMessage += ` Status: ${error.response?.status}, Data: ${JSON.stringify(error.response?.data)}`;
        this.logger.error(errorMessage, error.stack);
        // Create a more specific error based on the Axios error
        return failure(new Error(`${errorMessage}. Axios error: ${error.message}`))
      } else {
        errorMessage += ` Error: ${(error as Error).message}`; 
        this.logger.error(errorMessage, (error as Error).stack);
        return failure(new Error(errorMessage));
      }
    }
  }
}
