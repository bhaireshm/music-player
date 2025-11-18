/**
 * Download Manager
 * Handles downloading and caching of audio files for offline playback
 */

import { offlineStorage } from './offlineStorage';
import { getIdToken } from '../firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface DownloadProgress {
  songId: string;
  progress: number; // 0-100
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
}

export interface DownloadQueueItem {
  songId: string;
  title: string;
  artist: string;
  fileUrl: string;
  priority: number;
}

class DownloadManager {
  private downloadQueue: DownloadQueueItem[] = [];
  private activeDownloads = new Map<string, AbortController>();
  private progressCallbacks = new Map<string, (progress: DownloadProgress) => void>();
  private maxConcurrentDownloads = 3;
  private isProcessing = false;

  /**
   * Add song to download queue
   */
  async queueDownload(
    songId: string,
    title: string,
    artist: string,
    fileUrl: string,
    priority: number = 0,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    // Check if already downloaded
    const isOffline = await offlineStorage.isAudioAvailableOffline(songId);
    if (isOffline) {
      console.log(`Song ${songId} already downloaded`);
      return;
    }

    // Check if already in queue
    const existingIndex = this.downloadQueue.findIndex(item => item.songId === songId);
    if (existingIndex !== -1) {
      console.log(`Song ${songId} already in queue`);
      return;
    }

    // Add to queue
    this.downloadQueue.push({
      songId,
      title,
      artist,
      fileUrl,
      priority,
    });

    // Sort by priority (higher priority first)
    this.downloadQueue.sort((a, b) => b.priority - a.priority);

    // Register progress callback
    if (onProgress) {
      this.progressCallbacks.set(songId, onProgress);
    }

    // Start processing queue
    this.processQueue();
  }

  /**
   * Download a single song
   */
  async downloadSong(
    songId: string,
    title: string,
    artist: string,
    fileUrl: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    try {
      // Check storage quota before downloading
      const hasSpace = await this.checkStorageQuota();
      if (!hasSpace) {
        throw new Error('Insufficient storage space');
      }

      // Notify start
      this.notifyProgress(songId, {
        songId,
        progress: 0,
        status: 'downloading',
      });

      // Create abort controller for cancellation
      const abortController = new AbortController();
      this.activeDownloads.set(songId, abortController);

      // Get auth token
      const token = await getIdToken();

      // Download the audio file
      const response = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get content length for progress tracking
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      // Read the response as a stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Calculate and report progress
        if (total > 0) {
          const progress = Math.round((receivedLength / total) * 100);
          this.notifyProgress(songId, {
            songId,
            progress,
            status: 'downloading',
          });
        }
      }

      // Combine chunks into a single blob
      const audioBlob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });

      // Store in IndexedDB
      await offlineStorage.storeAudioFile(songId, audioBlob);

      // Store song metadata
      await offlineStorage.storeSong({
        id: songId,
        title,
        artist,
        fileUrl,
      });

      // Notify completion
      this.notifyProgress(songId, {
        songId,
        progress: 100,
        status: 'completed',
      });

      console.log(`Successfully downloaded song: ${title}`);
    } catch (error) {
      console.error(`Failed to download song ${songId}:`, error);
      
      this.notifyProgress(songId, {
        songId,
        progress: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Download failed',
      });

      throw error;
    } finally {
      this.activeDownloads.delete(songId);
      this.progressCallbacks.delete(songId);
    }
  }

  /**
   * Download multiple songs (playlist)
   */
  async downloadPlaylist(
    playlistId: string,
    songs: Array<{
      id: string;
      title: string;
      artist: string;
      fileUrl: string;
    }>,
    onProgress?: (overall: number, current: string) => void
  ): Promise<void> {
    let completed = 0;
    const total = songs.length;

    for (const song of songs) {
      try {
        await this.queueDownload(
          song.id,
          song.title,
          song.artist,
          song.fileUrl,
          1, // Normal priority
          (progress) => {
            if (onProgress) {
              const overallProgress = Math.round(
                ((completed + progress.progress / 100) / total) * 100
              );
              onProgress(overallProgress, song.title);
            }
          }
        );

        completed++;
      } catch (error) {
        console.error(`Failed to download song ${song.id}:`, error);
        // Continue with next song
      }
    }

    // Mark playlist as offline
    await offlineStorage.markPlaylistOffline(playlistId);
  }

  /**
   * Cancel a download
   */
  cancelDownload(songId: string): void {
    const abortController = this.activeDownloads.get(songId);
    if (abortController) {
      abortController.abort();
      this.activeDownloads.delete(songId);
      this.progressCallbacks.delete(songId);

      this.notifyProgress(songId, {
        songId,
        progress: 0,
        status: 'failed',
        error: 'Download cancelled',
      });
    }

    // Remove from queue
    this.downloadQueue = this.downloadQueue.filter(item => item.songId !== songId);
  }

  /**
   * Remove downloaded song
   */
  async removeSong(songId: string): Promise<void> {
    await offlineStorage.removeSongFromOffline(songId);
    console.log(`Removed song ${songId} from offline storage`);
  }

  /**
   * Get all offline songs
   */
  async getOfflineSongs() {
    return offlineStorage.getOfflineSongs();
  }

  /**
   * Check if song is available offline
   */
  async isSongOffline(songId: string): Promise<boolean> {
    return offlineStorage.isAudioAvailableOffline(songId);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    const stats = await offlineStorage.getStorageStats();
    
    // Get quota information
    let quota = 0;
    let usage = 0;

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      quota = estimate.quota || 0;
      usage = estimate.usage || 0;
    }

    return {
      ...stats,
      quota,
      usage,
      available: quota - usage,
      percentUsed: quota > 0 ? Math.round((usage / quota) * 100) : 0,
    };
  }

  /**
   * Clear all offline data
   */
  async clearAllOfflineData(): Promise<void> {
    // Cancel all active downloads
    for (const [songId] of this.activeDownloads) {
      this.cancelDownload(songId);
    }

    // Clear queue
    this.downloadQueue = [];

    // Clear storage
    await offlineStorage.clearAllData();

    console.log('Cleared all offline data');
  }

  /**
   * Process download queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.downloadQueue.length > 0 && this.activeDownloads.size < this.maxConcurrentDownloads) {
      const item = this.downloadQueue.shift();
      if (!item) break;

      // Start download (don't await - let it run in background)
      this.downloadSong(
        item.songId,
        item.title,
        item.artist,
        item.fileUrl,
        this.progressCallbacks.get(item.songId)
      ).catch(error => {
        console.error(`Download failed for ${item.songId}:`, error);
      });
    }

    this.isProcessing = false;

    // If there are still items in queue, process again after a delay
    if (this.downloadQueue.length > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  /**
   * Notify progress to callback
   */
  private notifyProgress(songId: string, progress: DownloadProgress): void {
    const callback = this.progressCallbacks.get(songId);
    if (callback) {
      callback(progress);
    }
  }

  /**
   * Check if there's enough storage space
   */
  private async checkStorageQuota(): Promise<boolean> {
    if (!('storage' in navigator && 'estimate' in navigator.storage)) {
      return true; // Can't check, assume OK
    }

    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const available = quota - usage;

      // Require at least 50MB available
      const minRequired = 50 * 1024 * 1024;

      return available > minRequired;
    } catch (error) {
      console.error('Failed to check storage quota:', error);
      return true; // Assume OK on error
    }
  }

  /**
   * Implement LRU cache eviction
   */
  async evictLeastRecentlyUsed(targetBytes: number): Promise<void> {
    const songs = await offlineStorage.getOfflineSongs();
    
    // Sort by last played (oldest first)
    songs.sort((a, b) => {
      const aTime = a.lastPlayed || a.downloadedAt || 0;
      const bTime = b.lastPlayed || b.downloadedAt || 0;
      return aTime - bTime;
    });

    let freedBytes = 0;

    for (const song of songs) {
      if (freedBytes >= targetBytes) {
        break;
      }

      // Get audio file to check size
      const audioFile = await offlineStorage.getAudioFile(song.id);
      if (audioFile) {
        freedBytes += audioFile.size;
        await this.removeSong(song.id);
        console.log(`Evicted song ${song.title} (${audioFile.size} bytes)`);
      }
    }

    console.log(`Evicted ${freedBytes} bytes from cache`);
  }
}

// Export singleton instance
export const downloadManager = new DownloadManager();
