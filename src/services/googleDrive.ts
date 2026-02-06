/**
 * Google Drive Service
 * Handles backup and sync operations with Google Drive
 */

import {Platform} from 'react-native';
import {PostIt, BackupData, SyncResult, DriveFileMetadata} from '../types';
import {GoogleAuthService} from './googleAuth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_NAME = 'PostItApp';
const BACKUP_FILE_NAME = 'postit_backup.json';
const APP_VERSION = '1.0.0';

/**
 * Get device ID for tracking sync source
 */
const getDeviceId = (): string => {
  return `${Platform.OS}-${Platform.Version}-${Date.now().toString(36)}`;
};

/**
 * Create authorization headers for API calls
 */
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await GoogleAuthService.getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in first.');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Google Drive Service
 */
export const GoogleDriveService = {
  /**
   * Find or create the PostItApp folder in Drive
   */
  async getOrCreateFolder(): Promise<string> {
    const headers = await getAuthHeaders();

    // Search for existing folder
    const searchQuery = encodeURIComponent(
      `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    );
    const searchResponse = await fetch(
      `${DRIVE_API_BASE}/files?q=${searchQuery}&spaces=drive&fields=files(id,name)`,
      {headers},
    );

    if (!searchResponse.ok) {
      throw new Error('Failed to search for folder');
    }

    const searchData = await searchResponse.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create new folder
    const createResponse = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create folder');
    }

    const createData = await createResponse.json();
    return createData.id;
  },

  /**
   * Find backup file in the PostItApp folder
   */
  async findBackupFile(folderId: string): Promise<DriveFileMetadata | null> {
    const headers = await getAuthHeaders();

    const searchQuery = encodeURIComponent(
      `name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`,
    );
    const response = await fetch(
      `${DRIVE_API_BASE}/files?q=${searchQuery}&spaces=drive&fields=files(id,name,mimeType,modifiedTime,size)`,
      {headers},
    );

    if (!response.ok) {
      throw new Error('Failed to search for backup file');
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0] as DriveFileMetadata;
    }

    return null;
  },

  /**
   * Upload backup to Google Drive
   */
  async uploadBackup(postIts: PostIt[]): Promise<SyncResult> {
    try {
      const folderId = await this.getOrCreateFolder();
      const existingFile = await this.findBackupFile(folderId);
      const headers = await getAuthHeaders();

      const backupData: BackupData = {
        postIts,
        syncedAt: Date.now(),
        deviceId: getDeviceId(),
        version: APP_VERSION,
      };

      const metadata = {
        name: BACKUP_FILE_NAME,
        mimeType: 'application/json',
        parents: existingFile ? undefined : [folderId],
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(backupData) +
        closeDelimiter;

      let url: string;
      let method: string;

      if (existingFile) {
        // Update existing file
        url = `${DRIVE_UPLOAD_BASE}/files/${existingFile.id}?uploadType=multipart`;
        method = 'PATCH';
      } else {
        // Create new file
        url = `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`;
        method = 'POST';
      }

      const token = await GoogleAuthService.getAccessToken();
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      return {
        success: true,
        message: existingFile
          ? 'Backup updated successfully'
          : 'Backup created successfully',
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error('Upload backup error:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload backup',
        timestamp: Date.now(),
      };
    }
  },

  /**
   * Download backup from Google Drive
   */
  async downloadBackup(): Promise<BackupData | null> {
    try {
      const folderId = await this.getOrCreateFolder();
      const backupFile = await this.findBackupFile(folderId);

      if (!backupFile) {
        console.log('No backup file found');
        return null;
      }

      const token = await GoogleAuthService.getAccessToken();
      const response = await fetch(
        `${DRIVE_API_BASE}/files/${backupFile.id}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      const backupData = (await response.json()) as BackupData;
      return backupData;
    } catch (error: any) {
      console.error('Download backup error:', error);
      return null;
    }
  },

  /**
   * Get backup metadata without downloading content
   */
  async getBackupMetadata(): Promise<{modifiedTime: Date; size: number} | null> {
    try {
      const folderId = await this.getOrCreateFolder();
      const backupFile = await this.findBackupFile(folderId);

      if (!backupFile) {
        return null;
      }

      return {
        modifiedTime: new Date(backupFile.modifiedTime),
        size: parseInt(backupFile.size || '0', 10),
      };
    } catch (error) {
      console.error('Get backup metadata error:', error);
      return null;
    }
  },

  /**
   * Sync post-its bidirectionally
   * Merges local and remote data intelligently
   */
  async syncPostIts(localPostIts: PostIt[]): Promise<SyncResult & {postIts?: PostIt[]}> {
    try {
      const remoteBackup = await this.downloadBackup();

      if (!remoteBackup) {
        // No remote backup, upload local data
        const uploadResult = await this.uploadBackup(localPostIts);
        return {
          ...uploadResult,
          postIts: localPostIts,
          message: 'Initial backup created',
        };
      }

      // Merge local and remote post-its
      const mergedPostIts = this.mergePostIts(localPostIts, remoteBackup.postIts);
      const conflictsResolved = Math.abs(
        mergedPostIts.length - Math.max(localPostIts.length, remoteBackup.postIts.length),
      );

      // Upload merged data
      const uploadResult = await this.uploadBackup(mergedPostIts);

      return {
        ...uploadResult,
        postIts: mergedPostIts,
        conflictsResolved,
        message: `Sync completed. ${mergedPostIts.length} post-its synchronized.`,
      };
    } catch (error: any) {
      console.error('Sync error:', error);
      return {
        success: false,
        message: error.message || 'Sync failed',
        timestamp: Date.now(),
      };
    }
  },

  /**
   * Merge local and remote post-its
   * Uses updatedAt timestamp to resolve conflicts
   */
  mergePostIts(local: PostIt[], remote: PostIt[]): PostIt[] {
    const mergedMap = new Map<string, PostIt>();

    // Add all remote post-its first
    remote.forEach(postIt => {
      mergedMap.set(postIt.id, postIt);
    });

    // Merge with local, using most recent version
    local.forEach(localPostIt => {
      const remotePostIt = mergedMap.get(localPostIt.id);

      if (!remotePostIt) {
        // Local-only post-it, add it
        mergedMap.set(localPostIt.id, localPostIt);
      } else if (localPostIt.updatedAt > remotePostIt.updatedAt) {
        // Local is newer, use local
        mergedMap.set(localPostIt.id, localPostIt);
      }
      // Otherwise keep remote (already in map)
    });

    return Array.from(mergedMap.values());
  },

  /**
   * Delete backup from Google Drive
   */
  async deleteBackup(): Promise<SyncResult> {
    try {
      const folderId = await this.getOrCreateFolder();
      const backupFile = await this.findBackupFile(folderId);

      if (!backupFile) {
        return {
          success: true,
          message: 'No backup to delete',
          timestamp: Date.now(),
        };
      }

      const headers = await getAuthHeaders();
      const response = await fetch(`${DRIVE_API_BASE}/files/${backupFile.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to delete backup');
      }

      return {
        success: true,
        message: 'Backup deleted successfully',
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error('Delete backup error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete backup',
        timestamp: Date.now(),
      };
    }
  },
};

export default GoogleDriveService;
