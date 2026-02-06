/**
 * Google Authentication Service
 * Handles Google Sign-In for Google Drive integration
 */

import {
  GoogleSignin,
  statusCodes,
  User,
} from '@react-native-google-signin/google-signin';
import {GoogleUser} from '../types';

// Google Drive scope for app data access
const SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
];

/**
 * Configure Google Sign-In
 * Call this once during app initialization
 */
export const configureGoogleSignIn = (): void => {
  GoogleSignin.configure({
    scopes: SCOPES,
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual web client ID
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};

/**
 * Transform Google Sign-In user to our GoogleUser type
 */
const transformUser = (user: User): GoogleUser => ({
  id: user.user.id,
  email: user.user.email,
  name: user.user.name || user.user.email,
  photo: user.user.photo || undefined,
});

/**
 * Google Authentication Service
 */
export const GoogleAuthService = {
  /**
   * Check if user is already signed in
   */
  async isSignedIn(): Promise<boolean> {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      return isSignedIn;
    } catch (error) {
      console.error('Error checking sign-in status:', error);
      return false;
    }
  },

  /**
   * Get currently signed-in user
   */
  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      if (userInfo) {
        return transformUser(userInfo);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Sign in with Google
   */
  async signIn(): Promise<GoogleUser | null> {
    try {
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const userInfo = await GoogleSignin.signIn();
      return transformUser(userInfo);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the sign-in flow');
        return null;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign-in is already in progress');
        return null;
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error('Play Services not available or outdated');
        throw new Error('Google Play Services not available. Please update and try again.');
      } else {
        console.error('Sign-in error:', error);
        throw new Error('Failed to sign in with Google. Please try again.');
      }
    }
  },

  /**
   * Sign in silently (if user was previously signed in)
   */
  async signInSilently(): Promise<GoogleUser | null> {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      return transformUser(userInfo);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        console.log('User needs to sign in');
        return null;
      } else {
        console.error('Silent sign-in error:', error);
        return null;
      }
    }
  },

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Sign-out error:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  },

  /**
   * Revoke access (disconnect the app completely)
   */
  async revokeAccess(): Promise<void> {
    try {
      await GoogleSignin.revokeAccess();
    } catch (error) {
      console.error('Revoke access error:', error);
      throw new Error('Failed to revoke access. Please try again.');
    }
  },

  /**
   * Get access token for API calls
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  /**
   * Refresh access token if needed
   */
  async refreshTokens(): Promise<string | null> {
    try {
      // Clear cached tokens to force refresh
      await GoogleSignin.clearCachedAccessToken(
        (await GoogleSignin.getTokens()).accessToken,
      );
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      // Try silent sign in to get new tokens
      const user = await this.signInSilently();
      if (user) {
        return this.getAccessToken();
      }
      return null;
    }
  },
};

export default GoogleAuthService;
