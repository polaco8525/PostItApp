/**
 * Hook for Google Drive synchronization
 * Manages sync state and auto-sync functionality
 */

import {useState, useEffect, useCallback, useRef} from 'react';
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

interface UseGoogleDriveSyncProps {
  postIts: PostIt[];
  onPostItsUpdated: (postIts: PostIt[]) => void;
}

interface UseGoogleDriveSyncReturn {
  syncState: SyncState;
  signIn: () => Promise<GoogleUser | null>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<SyncResult>;
  toggleAutoSync: () => Promise<void>;
  uploadBackup: () => Promise<SyncResult>;
  downloadBackup: () => Promise<PostIt[] | null>;
  formatLastSync: () => string;
}

export const useGoogleDriveSync = ({
  postIts,
  onPostItsUpdated,
}: UseGoogleDriveSyncProps): UseGoogleDriveSyncReturn => {
  const [syncState, setSyncState] = useState<SyncState>(initialSyncState);
  const previousPostItsRef = useRef<PostIt[]>([]);
  const isSyncingRef = useRef(false);
  const autoSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      const currentSettings = {
        autoSyncEnabled: settings.autoSyncEnabled,
      };
      await AsyncStorage.setItem(
        SYNC_SETTINGS_KEY,
        JSON.stringify(currentSettings),
      );

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

        // Perform initial sync after sign in
        setTimeout(() => syncNow(), 500);
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
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (isSyncingRef.current || !syncState.isConnected) {
      return {
        success: false,
        message: syncState.isConnected
          ? 'Sync already in progress'
          : 'Not connected to Google',
        timestamp: Date.now(),
      };
    }

    isSyncingRef.current = true;
    setSyncState(prev => ({
      ...prev,
      status: SyncStatus.SYNCING,
      error: null,
    }));

    try {
      const result = await GoogleDriveService.syncPostIts(postIts);

      if (result.success && result.postIts) {
        // Update local post-its with merged data
        onPostItsUpdated(result.postIts);
        previousPostItsRef.current = result.postIts;
      }

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
      isSyncingRef.current = false;
    }
  }, [syncState.isConnected, postIts, onPostItsUpdated, saveSyncSettings]);

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
   * Upload backup manually
   */
  const uploadBackup = useCallback(async (): Promise<SyncResult> => {
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

      setSyncState(prev => ({
        ...prev,
        status: result.success ? SyncStatus.SUCCESS : SyncStatus.ERROR,
        lastSyncAt: result.success ? Date.now() : prev.lastSyncAt,
        error: result.success ? null : result.message,
      }));

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
  }, [syncState.isConnected, postIts]);

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
        onPostItsUpdated(backup.postIts);
        setSyncState(prev => ({
          ...prev,
          status: SyncStatus.SUCCESS,
          lastSyncAt: Date.now(),
        }));
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
  }, [syncState.isConnected, onPostItsUpdated]);

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

  // Initialize on mount
  useEffect(() => {
    loadSyncSettings();
    initAuth();
  }, [loadSyncSettings, initAuth]);

  // Auto-sync when post-its change
  useEffect(() => {
    if (
      !syncState.isConnected ||
      !syncState.autoSyncEnabled ||
      syncState.status === SyncStatus.SYNCING
    ) {
      return;
    }

    // Check if post-its actually changed
    const postItsChanged =
      JSON.stringify(postIts) !== JSON.stringify(previousPostItsRef.current);

    if (postItsChanged && postIts.length > 0) {
      // Debounce auto-sync
      if (autoSyncTimeoutRef.current) {
        clearTimeout(autoSyncTimeoutRef.current);
      }

      autoSyncTimeoutRef.current = setTimeout(() => {
        syncNow();
      }, 5000); // 5 second debounce
    }

    return () => {
      if (autoSyncTimeoutRef.current) {
        clearTimeout(autoSyncTimeoutRef.current);
      }
    };
  }, [postIts, syncState.isConnected, syncState.autoSyncEnabled, syncState.status, syncNow]);

  // Sync when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        nextAppState === 'active' &&
        syncState.isConnected &&
        syncState.autoSyncEnabled
      ) {
        // Sync when app becomes active
        syncNow();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [syncState.isConnected, syncState.autoSyncEnabled, syncNow]);

  return {
    syncState,
    signIn,
    signOut,
    syncNow,
    toggleAutoSync,
    uploadBackup,
    downloadBackup,
    formatLastSync,
  };
};

export default useGoogleDriveSync;
