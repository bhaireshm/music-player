/**
 * Upload State Persistence
 * Saves and restores upload queue state to/from localStorage
 */

import { UploadFile } from './uploadQueue';

const STORAGE_KEY = 'musicPlayerUploadQueue';

export interface PersistedUploadState {
  files: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    title: string;
    artist: string;
    album?: string;
    status: string;
    progress: number;
    error?: string;
  }>;
  timestamp: number;
}

/**
 * Save upload queue to localStorage
 */
export function saveUploadState(files: UploadFile[]): void {
  try {
    // Only save pending and failed uploads (not complete or uploading)
    const filesToSave = files.filter(
      (f) => f.status === 'pending' || f.status === 'failed' || f.status === 'paused'
    );

    if (filesToSave.length === 0) {
      // Clear storage if no files to save
      clearUploadState();
      return;
    }

    const state: PersistedUploadState = {
      files: filesToSave.map((f) => ({
        id: f.id,
        fileName: f.file.name,
        fileSize: f.file.size,
        fileType: f.file.type,
        title: f.title,
        artist: f.artist,
        album: f.album,
        status: f.status,
        progress: f.progress,
        error: f.error,
      })),
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save upload state:', error);
  }
}

/**
 * Load upload queue from localStorage
 * Note: Cannot restore File objects, so this returns metadata only
 */
export function loadUploadState(): PersistedUploadState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const state: PersistedUploadState = JSON.parse(stored);

    // Check if state is too old (more than 24 hours)
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - state.timestamp > MAX_AGE) {
      clearUploadState();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to load upload state:', error);
    return null;
  }
}

/**
 * Clear upload state from localStorage
 */
export function clearUploadState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear upload state:', error);
  }
}

/**
 * Check if there is persisted upload state
 */
export function hasPersistedState(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null;
  } catch {
    return false;
  }
}
