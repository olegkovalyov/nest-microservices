import NextAuth, { type User, type Account, type Profile, type Session, type NextAuthConfig } from 'next-auth'; 
import { AdapterUser } from 'next-auth/adapters';
import { type JWT } from '@auth/core/jwt'; 
import CredentialsProvider from 'next-auth/providers/credentials';

// Define the structure of the user object your API returns after login/registration
// And the structure of the JWT token you'll create
interface BackendTokens {
  accessToken: string;
  refreshToken: string;
}

interface SessionUser extends User {
  id: string; // Or number, depending on your User ID type
  email: string;
  firstName?: string;
  lastName?: string;
  accessToken: string; // We'll store the access token in the session
  // Add refreshToken temporarily to pass it to the jwt callback
  refreshToken?: string;
  expiresIn?: number; // Optional expiresIn (in seconds)
  error?: string; // To handle login errors
}

// Define the structure of the token object used in callbacks
// We use the built-in JWT type and augment it later

export const authOptions: NextAuthConfig = { 
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        // Not strictly needed if using custom login page, but good for definition
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        firstName: { label: 'First Name', type: 'text' }, // For registration
        lastName: { label: 'Last Name', type: 'text' },   // For registration
      },
      async authorize(credentials, req): Promise<SessionUser | null> {
        if (!credentials) {
          return null;
        }

        // Determine if it's a login or registration based on presence of name fields
        const isLogin = !credentials.firstName;

        const apiUrl = isLogin
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}/users`; // POST /users for registration

        const body = isLogin
          ? { email: credentials.email, password: credentials.password }
          : { email: credentials.email, password: credentials.password, firstName: credentials.firstName, lastName: credentials.lastName };

        try {
          console.log(`Attempting ${isLogin ? 'login' : 'registration'} to:`, apiUrl);
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });

          const responseData = await res.json(); // Read response regardless of status

          if (!res.ok) {
             console.error(`API Error (${res.status}) for ${isLogin ? 'login' : 'registration'}:`, responseData);
            // Throw an error that NextAuth can understand. Pass message from API if available.
            throw new Error(responseData.message || `Failed to ${isLogin ? 'login' : 'register'}`);
          }

          console.log(`${isLogin ? 'Login' : 'Registration'} successful. API Response:`, responseData);

          // Expecting { user: { id, email, firstName, lastName }, tokens: { accessToken, refreshToken } }
          if (responseData && responseData.user && responseData.tokens) {
            return {
              id: responseData.user.id,
              email: responseData.user.email,
              firstName: responseData.user.firstName,
              lastName: responseData.user.lastName,
              accessToken: responseData.tokens.accessToken,
              refreshToken: responseData.tokens.refreshToken, // Pass refreshToken to jwt callback
            };
          } else {
            console.error('Unexpected API response format:', responseData);
            throw new Error('Invalid response format from authentication server.');
          }
        } catch (error: any) {
          console.error('Authorize error:', error);
          // Propagate the error message to the frontend
          throw new Error(error.message || 'An unexpected error occurred during authentication.');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // The jwt callback is called first, then the session callback.
    // We use it to persist the accessToken and handle refresh token logic.
    async jwt({ token, user, account, trigger, session }: { token: JWT; user?: User | AdapterUser | SessionUser; account?: Account | null; trigger?: "signIn" | "signUp" | "update" | "jwt"; session?: any }) {
      // console.log('[JWT Callback]', { token, user, account, trigger, session });

      // Initial sign in: `user` contains the object returned from `authorize`
      if (account && user) {
        // console.log('[JWT Callback] Initial Sign in', { user });
        // Persist the Oauth access_token and user info to the token right after signin
        // The user object here is the enriched SessionUser from authorize
        const sessionUser = user as SessionUser; // Cast user to SessionUser
        return {
          accessToken: sessionUser.accessToken, // From backend response
          accessTokenExpires: Date.now() + (sessionUser.expiresIn ?? 3600) * 1000, // Calculate expiry time (e.g., 1 hour)
          refreshToken: sessionUser.refreshToken, // From backend response
          id: sessionUser.id,
          email: sessionUser.email,
          firstName: sessionUser.firstName,
          lastName: sessionUser.lastName,
          // Keep other JWT standard claims if needed
        };
      }

      // Return previous token if the access token has not expired yet
      // Add a buffer (e.g., 5 minutes) to refresh proactively
      const bufferSeconds = 300; // 5 minutes
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires - bufferSeconds * 1000) {
        // console.log('[JWT Callback] Access token is valid');
        return token;
      }

      // Access token has expired, try to update it using the refresh token
      // console.log('[JWT Callback] Access token expired, attempting refresh...');
      if (!token.refreshToken) {
          console.error('[JWT Callback] No refresh token found, cannot refresh session.');
          // Optionally sign out the user or return error
          return { ...token, error: 'RefreshError' }; // Propagate error
      }

      try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/refresh`, { // Assumed refresh endpoint
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: token.refreshToken }),
          });

          const refreshedTokens = await response.json();

          if (!response.ok) {
              console.error('[JWT Callback] Refresh token request failed:', refreshedTokens);
              // throw new Error('RefreshAccessTokenError');
               return { ...token, error: 'RefreshError' }; // Propagate specific error
          }

          // console.log('[JWT Callback] Tokens refreshed successfully', refreshedTokens);

          // Update the token with new values
          return {
              ...token, // Keep previous values like id, email, etc.
              accessToken: refreshedTokens.accessToken,
              accessTokenExpires: Date.now() + (refreshedTokens.expiresIn ?? 3600) * 1000,
              // Optionally update refresh token if backend sends a new one
              // refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
              error: undefined, // Clear any previous error
          };
      } catch (error) {
          console.error('[JWT Callback] Error refreshing access token:', error);
          // Sign out user or return token with error
          return { ...token, error: 'RefreshError' };
      }
    },

    // The session callback receives the token from the jwt callback.
    // We use it to expose necessary data to the client-side session object.
    async session({ session, token }: { session: Session; token: JWT }) {
      // console.log('[Session Callback]', { session, token });
      // No need to cast token, directly use its properties if they exist after augmentation

      // Send properties to the client, needed for UI or client-side API calls
      if (token) {
        // Assign values carefully, providing fallbacks for required fields
        session.user.id = token.id ?? ''; // Provide fallback if id is somehow undefined
        session.user.email = token.email ?? ''; // Provide fallback to satisfy string type
        session.user.firstName = token.firstName; // Already optional in Session type
        session.user.lastName = token.lastName;   // Already optional in Session type
        session.accessToken = token.accessToken; // Optional in Session type
        // Propagate potential errors
        if (token.error) {
          session.error = token.error;
        }
      }

      // Ensure refreshToken is NEVER sent to the client session
      // delete (session as any).refreshToken; // Just to be explicit

      return session;
    },
  },
  pages: {
    signIn: '/login', // Redirect users to our custom login page
    error: '/login', // Redirect to login page on error (e.g., invalid credentials)
    // signOut: '/auth/signout', // Default works fine usually
    // newUser: '/register' // Can redirect after successful registration if needed
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET, // MUST be set in .env!
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Add type extensions for the session object to include our custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string; // Keep this as required string, handled by fallback above
      firstName?: string;
      lastName?: string;
    } & Omit<User, 'id' | 'email'>; // Use Omit to avoid conflict with our 'id' and 'email'
    accessToken?: string;
    error?: string;
  }
}

// Correct module augmentation for JWT type
declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    id?: string;
    firstName?: string;
    lastName?: string;
    error?: string;
  }
}
