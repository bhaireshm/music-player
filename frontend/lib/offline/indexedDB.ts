/**
 * IndexedDB Storage Manager
 * Handles offline storage for songs, playlists, and user data
 */

const DB_NAME = 'MusicPlayerDB';
const DB_VERSION = 1;

// Object store names
export const STORES = {
  SONGS: 'songs',
  PLAYLISTS: 'playlists',
  FAVORITES: 'favorites',
  OFFLINE_SONGS: 'offlineSongs',
  SYNC_QUEUE: 'syncQueue',
  USER_DATA: 'userData',
} as const;

export interface StoredSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  fileUrl: string;
  isOffline: boolean;
  downloadedAt?: number;
  lastPlayed?: number;
  playCount: number;
}

export interface StoredPlaylist {
  id: string;
  name: string;
  description?: string;
  songs: string[]; // Song IDs
  isOffline: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StoredFavorite {
  songId: string;
  addedAt: number;
  synced: boolean;
}

export interface OfflineSong {
  id: string;
  audioBlob: Blob;
  downloadedAt: number;
  size: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'favorite' | 'unfavorite' | 'playlist-create' | 'playlist-update' | 'playlist-delete';
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export interface UserData {
  id: string;
  lastSync: number;
  offlineMode: boolean;
  downloadQuality: 'low' | 'medium' | 'high';
  autoDownload: boolean;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });

    return this.dbPromise;
  }

  /**
   * Create object stores
   */
  private createObjectStores(db: IDBDatabase): void {
    // Songs store
    if (!db.objectStoreNames.contains(STORES.SONGS)) {
      const songsStore = db.createObjectStore(STORES.SONGS, { keyPath: 'id' });
      songsStore.createIndex('artist', 'artist', { unique: false });
      songsStore.createIndex('album', 'album', { unique: false });
      songsStore.createIndex('isOffline', 'isOffline', { unique: false });
    }

    // Playlists store
    if (!db.objectStoreNames.contains(STORES.PLAYLISTS)) {
      const playlistsStore = db.createObjectStore(STORES.PLAYLISTS, { keyPath: 'id' });
      playlistsStore.createIndex('isOffline', 'isOffline', { unique: false });
    }

    // Favorites store
    if (!db.objectStoreNames.contains(STORES.FAVORITES)) {
      const favoritesStore = db.createObjectStore(STORES.FAVORITES, { keyPath: 'songId' });
      favoritesStore.createIndex('synced', 'synced', { unique: false });
    }

    // Offline songs store (audio blobs)
    if (!db.objectStoreNames.contains(STORES.OFFLINE_SONGS)) {
      db.createObjectStore(STORES.OFFLINE_SONGS, { keyPath: 'id' });
    }

    // Sync queue store
    if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
      const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
      syncStore.createIndex('type', 'type', { unique: false });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
    }

    // User data store
    if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
      db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
    }
  }

  /**
   * Get a transaction
   */
  private async getTransaction(
    storeNames: string | string[],
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBTransaction> {
    const db = await this.init();
    return db.transaction(storeNames, mode);
  }

  /**
   * Add or update a record
   */
  async put<T>(storeName: string, data: T): Promise<void> {
    const transaction = await this.getTransaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a record by key
   */
  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const transaction = await this.getTransaction(storeName);
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all records from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const transaction = await this.getTransaction(storeName);
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a record
   */
  async delete(storeName: string, key: string): Promise<void> {
    const transaction = await this.getTransaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all records from a store
   */
  async clear(storeName: string): Promise<void> {
    const transaction = await this.getTransaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count records in a store
   */
  async count(storeName: string): Promise<number> {
    const transaction = await this.getTransaction(storeName);
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get records by index
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey
  ): Promise<T[]> {
    const transaction = await this.getTransaction(storeName);
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage usage information
   */
  async getStorageInfo(): Promise<{
    totalSongs: number;
    offlineSongs: number;
    totalPlaylists: number;
    offlinePlaylists: number;
    favorites: number;
    syncQueueSize: number;
    estimatedSize: number;
  }> {
    const [totalSongs, offlineSongs, totalPlaylists, offlinePlaylists, favorites, syncQueueSize] = await Promise.all([
      this.count(STORES.SONGS),
      this.getByIndex<StoredSong>(STORES.SONGS, 'isOffline', 1).then(songs => songs.length),
      this.count(STORES.PLAYLISTS),
      this.getByIndex<StoredPlaylist>(STORES.PLAYLISTS, 'isOffline', 1).then(playlists => playlists.length),
      this.count(STORES.FAVORITES),
      this.count(STORES.SYNC_QUEUE),
    ]);

    // Estimate storage size (rough calculation)
    const offlineAudioFiles = await this.getAll<OfflineSong>(STORES.OFFLINE_SONGS);
    const estimatedSize = offlineAudioFiles.reduce((total, file) => total + file.size, 0);

    return {
      totalSongs,
      offlineSongs,
      totalPlaylists,
      offlinePlaylists,
      favorites,
      syncQueueSize,
      estimatedSize,
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }
  }
}

// Export singleton instance
export const indexedDBManager = new IndexedDBManager();
