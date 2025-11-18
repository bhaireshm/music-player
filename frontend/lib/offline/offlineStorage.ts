/**
 * Offline Storage Service
 * High-level API for managing offline data
 */

import { indexedDBManager, STORES, StoredSong, StoredPlaylist, StoredFavorite, OfflineSong, SyncQueueItem, UserData } from './indexedDB';

export class OfflineStorageService {
  /**
   * Initialize offline storage
   */
  async init(): Promise<void> {
    await indexedDBManager.init();
    console.log('Offline storage initialized');
  }

  // ===== SONGS =====

  /**
   * Store song metadata
   */
  async storeSong(song: Omit<StoredSong, 'isOffline' | 'playCount'>): Promise<void> {
    const storedSong: StoredSong = {
      ...song,
      isOffline: false,
      playCount: 0,
    };
    await indexedDBManager.put(STORES.SONGS, storedSong);
  }

  /**
   * Get song by ID
   */
  async getSong(id: string): Promise<StoredSong | undefined> {
    return indexedDBManager.get<StoredSong>(STORES.SONGS, id);
  }

  /**
   * Get all songs
   */
  async getAllSongs(): Promise<StoredSong[]> {
    return indexedDBManager.getAll<StoredSong>(STORES.SONGS);
  }

  /**
   * Get offline songs only
   */
  async getOfflineSongs(): Promise<StoredSong[]> {
    return indexedDBManager.getByIndex<StoredSong>(STORES.SONGS, 'isOffline', 1);
  }

  /**
   * Mark song as offline
   */
  async markSongOffline(songId: string): Promise<void> {
    const song = await this.getSong(songId);
    if (song) {
      song.isOffline = true;
      song.downloadedAt = Date.now();
      await indexedDBManager.put(STORES.SONGS, song);
    }
  }

  /**
   * Remove song from offline storage
   */
  async removeSongFromOffline(songId: string): Promise<void> {
    const song = await this.getSong(songId);
    if (song) {
      song.isOffline = false;
      song.downloadedAt = undefined;
      await indexedDBManager.put(STORES.SONGS, song);
    }
    // Also remove the audio blob
    await indexedDBManager.delete(STORES.OFFLINE_SONGS, songId);
  }

  /**
   * Update song play count
   */
  async updatePlayCount(songId: string): Promise<void> {
    const song = await this.getSong(songId);
    if (song) {
      song.playCount += 1;
      song.lastPlayed = Date.now();
      await indexedDBManager.put(STORES.SONGS, song);
    }
  }

  // ===== OFFLINE AUDIO FILES =====

  /**
   * Store audio file blob
   */
  async storeAudioFile(songId: string, audioBlob: Blob): Promise<void> {
    const offlineSong: OfflineSong = {
      id: songId,
      audioBlob,
      downloadedAt: Date.now(),
      size: audioBlob.size,
    };
    await indexedDBManager.put(STORES.OFFLINE_SONGS, offlineSong);
    await this.markSongOffline(songId);
  }

  /**
   * Get audio file blob
   */
  async getAudioFile(songId: string): Promise<Blob | undefined> {
    const offlineSong = await indexedDBManager.get<OfflineSong>(STORES.OFFLINE_SONGS, songId);
    return offlineSong?.audioBlob;
  }

  /**
   * Check if audio file is available offline
   */
  async isAudioAvailableOffline(songId: string): Promise<boolean> {
    const offlineSong = await indexedDBManager.get<OfflineSong>(STORES.OFFLINE_SONGS, songId);
    return !!offlineSong;
  }

  // ===== PLAYLISTS =====

  /**
   * Store playlist
   */
  async storePlaylist(playlist: Omit<StoredPlaylist, 'isOffline'>): Promise<void> {
    const storedPlaylist: StoredPlaylist = {
      ...playlist,
      isOffline: false,
    };
    await indexedDBManager.put(STORES.PLAYLISTS, storedPlaylist);
  }

  /**
   * Get playlist by ID
   */
  async getPlaylist(id: string): Promise<StoredPlaylist | undefined> {
    return indexedDBManager.get<StoredPlaylist>(STORES.PLAYLISTS, id);
  }

  /**
   * Get all playlists
   */
  async getAllPlaylists(): Promise<StoredPlaylist[]> {
    return indexedDBManager.getAll<StoredPlaylist>(STORES.PLAYLISTS);
  }

  /**
   * Get offline playlists only
   */
  async getOfflinePlaylists(): Promise<StoredPlaylist[]> {
    return indexedDBManager.getByIndex<StoredPlaylist>(STORES.PLAYLISTS, 'isOffline', 1);
  }

  /**
   * Mark playlist as offline
   */
  async markPlaylistOffline(playlistId: string): Promise<void> {
    const playlist = await this.getPlaylist(playlistId);
    if (playlist) {
      playlist.isOffline = true;
      await indexedDBManager.put(STORES.PLAYLISTS, playlist);
    }
  }

  /**
   * Remove playlist from offline storage
   */
  async removePlaylistFromOffline(playlistId: string): Promise<void> {
    const playlist = await this.getPlaylist(playlistId);
    if (playlist) {
      playlist.isOffline = false;
      await indexedDBManager.put(STORES.PLAYLISTS, playlist);
    }
  }

  /**
   * Delete playlist
   */
  async deletePlaylist(playlistId: string): Promise<void> {
    await indexedDBManager.delete(STORES.PLAYLISTS, playlistId);
  }

  // ===== FAVORITES =====

  /**
   * Add song to favorites
   */
  async addToFavorites(songId: string, synced: boolean = false): Promise<void> {
    const favorite: StoredFavorite = {
      songId,
      addedAt: Date.now(),
      synced,
    };
    await indexedDBManager.put(STORES.FAVORITES, favorite);

    // Add to sync queue if not synced
    if (!synced) {
      await this.addToSyncQueue('favorite', { songId });
    }
  }

  /**
   * Remove song from favorites
   */
  async removeFromFavorites(songId: string, synced: boolean = false): Promise<void> {
    await indexedDBManager.delete(STORES.FAVORITES, songId);

    // Add to sync queue if not synced
    if (!synced) {
      await this.addToSyncQueue('unfavorite', { songId });
    }
  }

  /**
   * Check if song is favorited
   */
  async isFavorited(songId: string): Promise<boolean> {
    const favorite = await indexedDBManager.get<StoredFavorite>(STORES.FAVORITES, songId);
    return !!favorite;
  }

  /**
   * Get all favorites
   */
  async getAllFavorites(): Promise<StoredFavorite[]> {
    return indexedDBManager.getAll<StoredFavorite>(STORES.FAVORITES);
  }

  /**
   * Get unsynced favorites
   */
  async getUnsyncedFavorites(): Promise<StoredFavorite[]> {
    return indexedDBManager.getByIndex<StoredFavorite>(STORES.FAVORITES, 'synced', 0);
  }

  /**
   * Mark favorite as synced
   */
  async markFavoriteSynced(songId: string): Promise<void> {
    const favorite = await indexedDBManager.get<StoredFavorite>(STORES.FAVORITES, songId);
    if (favorite) {
      favorite.synced = true;
      await indexedDBManager.put(STORES.FAVORITES, favorite);
    }
  }

  // ===== SYNC QUEUE =====

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(
    type: SyncQueueItem['type'],
    data: Record<string, unknown>
  ): Promise<void> {
    const item: SyncQueueItem = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };
    await indexedDBManager.put(STORES.SYNC_QUEUE, item);
  }

  /**
   * Get all sync queue items
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return indexedDBManager.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(itemId: string): Promise<void> {
    await indexedDBManager.delete(STORES.SYNC_QUEUE, itemId);
  }

  /**
   * Update sync queue item retry count
   */
  async updateSyncQueueRetry(itemId: string): Promise<void> {
    const item = await indexedDBManager.get<SyncQueueItem>(STORES.SYNC_QUEUE, itemId);
    if (item) {
      item.retryCount += 1;
      await indexedDBManager.put(STORES.SYNC_QUEUE, item);
    }
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    await indexedDBManager.clear(STORES.SYNC_QUEUE);
  }

  // ===== USER DATA =====

  /**
   * Store user data
   */
  async storeUserData(userData: UserData): Promise<void> {
    await indexedDBManager.put(STORES.USER_DATA, userData);
  }

  /**
   * Get user data
   */
  async getUserData(userId: string): Promise<UserData | undefined> {
    return indexedDBManager.get<UserData>(STORES.USER_DATA, userId);
  }

  // ===== UTILITY METHODS =====

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    return indexedDBManager.getStorageInfo();
  }

  /**
   * Clear all offline data
   */
  async clearAllData(): Promise<void> {
    await Promise.all([
      indexedDBManager.clear(STORES.SONGS),
      indexedDBManager.clear(STORES.PLAYLISTS),
      indexedDBManager.clear(STORES.FAVORITES),
      indexedDBManager.clear(STORES.OFFLINE_SONGS),
      indexedDBManager.clear(STORES.SYNC_QUEUE),
      indexedDBManager.clear(STORES.USER_DATA),
    ]);
  }

  /**
   * Export data for backup
   */
  async exportData(): Promise<{
    songs: StoredSong[];
    playlists: StoredPlaylist[];
    favorites: StoredFavorite[];
    userData: UserData[];
  }> {
    const [songs, playlists, favorites, userData] = await Promise.all([
      this.getAllSongs(),
      this.getAllPlaylists(),
      this.getAllFavorites(),
      indexedDBManager.getAll<UserData>(STORES.USER_DATA),
    ]);

    return { songs, playlists, favorites, userData };
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
