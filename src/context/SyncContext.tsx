/**
 * Sync Context
 * Provides global sync state management for Google Drive integration
 */

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppState, AppStateStatus} from 'react-native';
import {
  SyncState,
  SyncStatus,
  GoogleUser,
  PostIt,
  SyncResult,
  initialSyncState,
} from '../types';
import {GoogleAuthService, GoogleDriveService} from '../services';

const SYNC_SETTINGS_KEY = '@PostItApp:syncSettings';
const LAST_SYNC_KEY = '@PostItApp:lastSync';

interface SyncContextType {
  syncState: SyncState;
  signIn: () => Promise<GoogleUser | null>;
  signOut: () => Promise<void>;
  syncNow: (postIts: PostIt[]) => Promise<SyncResult & {postIts?: PostIt[]}>;
  uploadBackup: (postIts: PostIt[]) => Promise<SyncResult>;
  downloadBackup: () => Promise<PostIt[] | null>;
  toggleAutoSync: () => Promise<void>;
  formatLastSync: () => string;
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({children}) => {
  const [syncState, setSyncState] = useState<SyncState>(initialSyncState);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Load sync settings from storage
   */
  const loadSyncSettings = useCallback(async () => {
    try {
      const [settingsJson, lastSyncJson] = await Promise.all([
        AsyncStorage.getItem(SYNC_SETTINGS_KEY),
        AsyncStorage.getItem(LAST_SYNC_KEY),
      ]);

      const settings = settingsJson ? JSON.parse(settingsJson) : {};
      const lastSyncAt = lastSyncJson ? parseInt(lastSyncJson, 10) : null;

      setSyncState(prev => ({
        ...prev,
        autoSyncEnabled: settings.autoSyncEnabled ?? true,
        lastSyncAt,
      }));
    } catch (error) {
      console.error('Error loading sync settings:', error);
    }
  }, []);

  /**
   * Save sync settings to storage
   */
  const saveSyncSettings = useCallback(async (settings: Partial<SyncState>) => {
    try {
      if (settings.autoSyncEnabled !== undefined) {
        await AsyncStorage.setItem(
          SYNC_SETTINGS_KEY,
          JSON.stringify({autoSyncEnabled: settings.autoSyncEnabled}),
        );
      }

      if (settings.lastSyncAt) {
        await AsyncStorage.setItem(
          LAST_SYNC_KEY,
          settings.lastSyncAt.toString(),
        );
      }
    } catch (error) {
      console.error('Error saving sync settings:', error);
    }
  }, []);

  /**
   * Initialize authentication state
   */
  const initAuth = useCallback(async () => {
    try {
      const user = await GoogleAuthService.signInSilently();
      setSyncState(prev => ({
        ...prev,
        isConnected: !!user,
        user,
      }));
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }, []);

  /**
   * Sign in with Google
   */
  const signIn = useCallback(async (): Promise<GoogleUser | null> => {
    try {
      setSyncState(prev => ({
        ...prev,
        status: SyncStatus.SYNCING,
        error: null,
      }));

      const user = await GoogleAuthService.signIn();

      if (user) {
        setSyncState(prev => ({
          ...prev,
          isConnected: true,
          user,
          status: SyncStatus.SUCCESS,
        }));
      } else {
        setSyncState(prev => ({
          ...prev,
          status: SyncStatus.IDLE,
        }));
      }

      return user;
    } catch (error: any) {
      setSyncState(prev => ({
        ...prev,
        status: SyncStatus.ERROR,
        error: error.message,
      }));
      return null;
    }
  }, []);

  /**
   * Sign out from Google
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await GoogleAuthService.signOut();
      setSyncState(prev => ({
        ...prev,
        isConnected: false,
        user: null,
        status: SyncStatus.IDLE,
        error: null,
      }));
    } catch (error: any) {
      setSyncState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  }, []);

  /**
   * Perform sync operation
   */
  const syncNow = useCallback(
    async (postIts: PostIt[]): Promise<SyncResult & {postIts?: PostIt[]}> => {
      if (isSyncing || !syncState.isConnected) {
        return {
          success: false,
          message: syncState.isConnected
            ? 'Sync already in progress'
            : 'Not connected to Google',
          timestamp: Date.now(),
        };
      }

      setIsSyncing(true);
      setSyncState(prev => ({
        ...prev,
        status: SyncStatus.SYNCING,
        error: null,
      }));

      try {
        const result = await GoogleDriveService.syncPostIts(postIts);

        const newLastSync = Date.now();
        setSyncState(prev => ({
          ...prev,
          status: result.success ? SyncStatus.SUCCESS : SyncStatus.ERROR,
          lastSyncAt: result.success ? newLastSync : prev.lastSyncAt,
          error: result.success ? null : result.message,
        }));

        if (result.success) {
          await saveSyncSettings({lastSyncAt: newLastSync});
        }

        // Reset status after a delay
        setTimeout(() => {
          setSyncState(prev => ({
            ...prev,
            status: SyncStatus.IDLE,
          }));
        }, 3000);

        return result;
      } catch (error: any) {
        setSyncState(prev => ({
          ...prev,
          status: SyncStatus.ERROR,
          error: error.message,
        }));

        return {
          success: false,
          message: error.message,
          timestamp: Date.now(),
        };
      } finally {
        setIsSyncing(false);
      }
    },
    [isSyncing, syncState.isConnected, saveSyncSettings],
  );

  /**
   * Upload backup manually
   */
  const uploadBackup = useCallback(
    async (postIts: PostIt[]): Promise<SyncResult> => {
      if (!syncState.isConnected) {
        return {
          success: false,
          message: 'Not connected to Google',
          timestamp: Date.now(),
        };
      }

      setSyncState(prev => ({
        ...prev,
        status: SyncStatus.SYNCING,
      }));

      try {
        const result = await GoogleDriveService.uploadBackup(postIts);

        const newLastSync = Date.now();
        setSyncState(prev => ({
          ...prev,
          status: result.success ? SyncStatus.SUCCESS : SyncStatus.ERROR,
          lastSyncAt: result.success ? newLastSync : prev.lastSyncAt,
          error: result.success ? null : result.message,
        }));

        if (result.success) {
          await saveSyncSettings({lastSyncAt: newLastSync});
        }

        return result;
      } catch (error: any) {
        setSyncState(prev => ({
          ...prev,
          status: SyncStatus.ERROR,
          error: error.message,
        }));

        return {
          success: false,
          message: error.message,
          timestamp: Date.now(),
        };
      }
    },
    [syncState.isConnected, saveSyncSettings],
  );

  /**
   * Download backup manually
   */
  const downloadBackup = useCallback(async (): Promise<PostIt[] | null> => {
    if (!syncState.isConnected) {
      return null;
    }

    setSyncState(prev => ({
      ...prev,
      status: SyncStatus.SYNCING,
    }));

    try {
      const backup = await GoogleDriveService.downloadBackup();

      if (backup?.postIts) {
        const newLastSync = Date.now();
        setSyncState(prev => ({
          ...prev,
          status: SyncStatus.SUCCESS,
          lastSyncAt: newLastSync,
        }));
        await saveSyncSettings({lastSyncAt: newLastSync});
        return backup.postIts;
      }

      setSyncState(prev => ({
        ...prev,
        status: SyncStatus.IDLE,
      }));
      return null;
    } catch (error: any) {
      setSyncState(prev => ({
        ...prev,
        status: SyncStatus.ERROR,
        error: error.message,
      }));
      return null;
    }
  }, [syncState.isConnected, saveSyncSettings]);

  /**
   * Toggle auto-sync setting
   */
  const toggleAutoSync = useCallback(async (): Promise<void> => {
    const newValue = !syncState.autoSyncEnabled;
    setSyncState(prev => ({
      ...prev,
      autoSyncEnabled: newValue,
    }));
    await saveSyncSettings({autoSyncEnabled: newValue});
  }, [syncState.autoSyncEnabled, saveSyncSettings]);

  /**
   * Format last sync time for display
   */
  const formatLastSync = useCallback((): string => {
    if (!syncState.lastSyncAt) {
      return 'Never synced';
    }

    const now = Date.now();
    const diff = now - syncState.lastSyncAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }, [syncState.lastSyncAt]);

  /**
   * Set syncing state manually
   */
  const setSyncing = useCallback((syncing: boolean) => {
    setSyncState(prev => ({
      ...prev,
      status: syncing ? SyncStatus.SYNCING : SyncStatus.IDLE,
    }));
  }, []);

  /**
   * Set error state manually
   */
  const setError = useCallback((error: string | null) => {
    setSyncState(prev => ({
      ...prev,
      status: error ? SyncStatus.ERROR : SyncStatus.IDLE,
      error,
    }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadSyncSettings();
    initAuth();
  }, [loadSyncSettings, initAuth]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && syncState.isConnected) {
        // Refresh auth state when app becomes active
        initAuth();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [syncState.isConnected, initAuth]);

  const value: SyncContextType = {
    syncState,
    signIn,
    signOut,
    syncNow,
    uploadBackup,
    downloadBackup,
    toggleAutoSync,
    formatLastSync,
    setSyncing,
    setError,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
