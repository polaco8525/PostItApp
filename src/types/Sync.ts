/**
 * Sync-related types for Google Drive integration
 */

import {PostIt} from './PostIt';

/**
 * Enum representing the current sync status
 */
export enum SyncStatus {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

/**
 * Google user information
 */
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  photo?: string;
}

/**
 * State for sync functionality
 */
export interface SyncState {
  status: SyncStatus;
  lastSyncAt: number | null;
  isConnected: boolean;
  user: GoogleUser | null;
  autoSyncEnabled: boolean;
  error: string | null;
}

/**
 * Backup data structure stored in Google Drive
 */
export interface BackupData {
  postIts: PostIt[];
  syncedAt: number;
  deviceId: string;
  version: string;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: number;
  conflictsResolved?: number;
}

/**
 * Google Drive file metadata
 */
export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
}

/**
 * Sync configuration options
 */
export interface SyncConfig {
  autoSyncEnabled: boolean;
  syncIntervalMs: number;
  wifiOnlySync: boolean;
  conflictResolution: 'local' | 'remote' | 'merge';
}

/**
 * Initial sync state
 */
export const initialSyncState: SyncState = {
  status: SyncStatus.IDLE,
  lastSyncAt: null,
  isConnected: false,
  user: null,
  autoSyncEnabled: true,
  error: null,
};
