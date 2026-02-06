/**
 * Google Authentication Service (Expo)
 * Uses expo-auth-session for OAuth2 flow with Google
 */

import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleUser } from '../types';

// ─── Constants ───────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

const TOKEN_STORAGE_KEY = '@PostItApp:googleTokens';
const USER_STORAGE_KEY = '@PostItApp:googleUser';

const SCOPES: string[] = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const redirectUri = AuthSession.makeRedirectUri();

// ─── Types ───────────────────────────────────────────────────────────────────

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  idToken?: string;
}

// ─── Helper Functions ────────────────────────────────────────────────────────

async function loadTokens(): Promise<TokenData | null> {
  try {
    const json = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (!json) {
      return null;
    }
    return JSON.parse(json) as TokenData;
  } catch {
    return null;
  }
}

async function saveTokens(tokens: TokenData): Promise<void> {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

async function loadUser(): Promise<GoogleUser | null> {
  try {
    const json = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (!json) {
      return null;
    }
    return JSON.parse(json) as GoogleUser;
  } catch {
    return null;
  }
}

async function saveUser(user: GoogleUser): Promise<void> {
  await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

async function clearStorage(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
}

function isTokenExpired(tokens: TokenData): boolean {
  if (!tokens.expiresAt) {
    return false;
  }
  // Consider expired 60 seconds before actual expiry
  return Date.now() >= tokens.expiresAt - 60_000;
}

async function fetchUserInfo(accessToken: string): Promise<GoogleUser> {
  const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.status}`);
  }

  const data = (await response.json()) as {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    photo: data.picture,
  };
}

async function exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<TokenData> {
  const params: Record<string, string> = {
    client_id: GOOGLE_CLIENT_ID,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  };

  if (codeVerifier) {
    params.code_verifier = codeVerifier;
  }

  const body = new URLSearchParams(params);

  const response = await fetch(discovery.tokenEndpoint!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
  };

  const tokens: TokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
  };

  if (data.expires_in) {
    tokens.expiresAt = Date.now() + data.expires_in * 1000;
  }

  return tokens;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenData> {
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(discovery.tokenEndpoint!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
  };

  const tokens: TokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    idToken: data.id_token,
  };

  if (data.expires_in) {
    tokens.expiresAt = Date.now() + data.expires_in * 1000;
  }

  return tokens;
}

// ─── configureGoogleSignIn (no-op for Expo compatibility) ────────────────────

export function configureGoogleSignIn(): void {
  // No-op: expo-auth-session does not require pre-configuration.
  // This function exists solely for backward compatibility with the
  // previous @react-native-google-signin/google-signin implementation.
}

// ─── GoogleAuthService ───────────────────────────────────────────────────────

export const GoogleAuthService = {
  async isSignedIn(): Promise<boolean> {
    try {
      const tokens = await loadTokens();
      if (!tokens) {
        return false;
      }

      if (isTokenExpired(tokens)) {
        if (!tokens.refreshToken) {
          await clearStorage();
          return false;
        }

        try {
          const refreshed = await refreshAccessToken(tokens.refreshToken);
          await saveTokens(refreshed);
          return true;
        } catch {
          await clearStorage();
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  },

  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      return await loadUser();
    } catch {
      return null;
    }
  },

  async signIn(): Promise<GoogleUser | null> {
    try {
      const authRequest = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        redirectUri,
        scopes: SCOPES,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      });

      const result = await authRequest.promptAsync(discovery);

      if (result.type !== 'success' || !result.params?.code) {
        return null;
      }

      const code = result.params.code;
      const codeVerifier = authRequest.codeVerifier;

      const tokens = await exchangeCodeForTokens(code, codeVerifier);
      await saveTokens(tokens);

      const user = await fetchUserInfo(tokens.accessToken);
      await saveUser(user);

      return user;
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      return null;
    }
  },

  async signInSilently(): Promise<GoogleUser | null> {
    try {
      const tokens = await loadTokens();
      if (!tokens) {
        return null;
      }

      let currentAccessToken = tokens.accessToken;

      if (isTokenExpired(tokens)) {
        if (!tokens.refreshToken) {
          await clearStorage();
          return null;
        }

        try {
          const refreshed = await refreshAccessToken(tokens.refreshToken);
          await saveTokens(refreshed);
          currentAccessToken = refreshed.accessToken;
        } catch {
          await clearStorage();
          return null;
        }
      }

      const storedUser = await loadUser();
      if (storedUser) {
        return storedUser;
      }

      const user = await fetchUserInfo(currentAccessToken);
      await saveUser(user);
      return user;
    } catch {
      return null;
    }
  },

  async signOut(): Promise<void> {
    await clearStorage();
  },

  async revokeAccess(): Promise<void> {
    try {
      const tokens = await loadTokens();
      if (tokens?.accessToken) {
        const body = new URLSearchParams({
          token: tokens.accessToken,
        });

        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        });
      }
    } catch {
      // Revocation may fail if token is already invalid; ignore errors
    } finally {
      await clearStorage();
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      const tokens = await loadTokens();
      if (!tokens) {
        return null;
      }

      if (isTokenExpired(tokens)) {
        if (!tokens.refreshToken) {
          return null;
        }

        const refreshed = await refreshAccessToken(tokens.refreshToken);
        await saveTokens(refreshed);
        return refreshed.accessToken;
      }

      return tokens.accessToken;
    } catch {
      return null;
    }
  },

  async refreshTokens(): Promise<string | null> {
    try {
      const tokens = await loadTokens();
      if (!tokens?.refreshToken) {
        return null;
      }

      const refreshed = await refreshAccessToken(tokens.refreshToken);
      await saveTokens(refreshed);
      return refreshed.accessToken;
    } catch {
      return null;
    }
  },
};

export default GoogleAuthService;
