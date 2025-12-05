/**
 * Upload Queue Manager
 * Manages the queue of files to upload with concurrent upload limiting
 */

export type UploadStatus = 'pending' | 'uploading' | 'complete' | 'failed' | 'paused';

export interface UploadFile {
  id: string;
  file: File;
  title: string;
  artist: string;
  album?: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

export interface UploadQueueState {
  files: UploadFile[];
  activeUploads: number;
  maxConcurrent: number;
  isPaused: boolean;
}

export interface UploadQueueStats {
  total: number;
  pending: number;
  uploading: number;
  complete: number;
  failed: number;
  paused: number;
}

export class UploadQueueManager {
  private state: UploadQueueState;
  private listeners: Set<(state: UploadQueueState) => void>;

  constructor(maxConcurrent: number = 3) {
    this.state = {
      files: [],
      activeUploads: 0,
      maxConcurrent,
      isPaused: false,
    };
    this.listeners = new Set();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: UploadQueueState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notify(): void {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  /**
   * Get current state (immutable copy)
   */
  getState(): UploadQueueState {
    return {
      ...this.state,
      files: [...this.state.files],
    };
  }

  /**
   * Add files to the queue
   */
  addFiles(files: UploadFile[]): void {
    this.state.files = [...this.state.files, ...files];
    this.notify();
  }

  /**
   * Remove a file from the queue
   */
  removeFile(fileId: string): void {
    this.state.files = this.state.files.filter((f) => f.id !== fileId);
    this.notify();
  }

  /**
   * Update file status
   */
  updateFileStatus(fileId: string, status: UploadStatus, error?: string): void {
    const file = this.state.files.find((f) => f.id === fileId);
    if (file) {
      file.status = status;
      if (error) {
        file.error = error;
      }
      this.notify();
    }
  }

  /**
   * Update file progress
   */
  updateFileProgress(fileId: string, progress: number): void {
    const file = this.state.files.find((f) => f.id === fileId);
    if (file) {
      file.progress = Math.min(100, Math.max(0, progress));
      this.notify();
    }
  }

  /**
   * Update file metadata
   */
  updateFileMetadata(
    fileId: string,
    metadata: { title?: string; artist?: string; album?: string }
  ): void {
    const file = this.state.files.find((f) => f.id === fileId);
    if (file) {
      if (metadata.title !== undefined) file.title = metadata.title;
      if (metadata.artist !== undefined) file.artist = metadata.artist;
      if (metadata.album !== undefined) file.album = metadata.album;
      this.notify();
    }
  }

  /**
   * Get next file to upload (respecting concurrent limit)
   */
  getNextFile(): UploadFile | null {
    if (this.state.isPaused) {
      return null;
    }

    if (this.state.activeUploads >= this.state.maxConcurrent) {
      return null;
    }

    const nextFile = this.state.files.find((f) => f.status === 'pending');
    return nextFile || null;
  }

  /**
   * Increment active uploads counter
   */
  incrementActiveUploads(): void {
    this.state.activeUploads++;
    this.notify();
  }

  /**
   * Decrement active uploads counter
   */
  decrementActiveUploads(): void {
    this.state.activeUploads = Math.max(0, this.state.activeUploads - 1);
    this.notify();
  }

  /**
   * Pause all uploads
   */
  pause(): void {
    this.state.isPaused = true;
    // Mark uploading files as paused
    this.state.files.forEach((file) => {
      if (file.status === 'uploading' || file.status === 'pending') {
        file.status = 'paused';
      }
    });
    this.notify();
  }

  /**
   * Resume uploads
   */
  resume(): void {
    this.state.isPaused = false;
    // Mark paused files as pending
    this.state.files.forEach((file) => {
      if (file.status === 'paused') {
        file.status = 'pending';
      }
    });
    this.notify();
  }

  /**
   * Clear all files from queue
   */
  clear(): void {
    this.state.files = [];
    this.state.activeUploads = 0;
    this.notify();
  }

  /**
   * Get upload statistics
   */
  /**
   * Get upload statistics
   */
  getStats(): UploadQueueStats {
    return {
      total: this.state.files.length,
      pending: this.state.files.filter((f) => f.status === 'pending').length,
      uploading: this.state.files.filter((f) => f.status === 'uploading').length,
      complete: this.state.files.filter((f) => f.status === 'complete').length,
      failed: this.state.files.filter((f) => f.status === 'failed').length,
      paused: this.state.files.filter((f) => f.status === 'paused').length,
    };
  }

  /**
   * Check if all uploads are complete
   */
  isComplete(): boolean {
    const stats = this.getStats();
    return stats.total > 0 && stats.pending === 0 && stats.uploading === 0 && stats.paused === 0;
  }

  /**
   * Retry a failed file
   */
  retryFile(fileId: string): void {
    const file = this.state.files.find((f) => f.id === fileId);
    if (file && file.status === 'failed') {
      file.status = 'pending';
      file.progress = 0;
      file.error = undefined;
      this.notify();
    }
  }

  /**
   * Retry all failed files
   */
  retryAll(): void {
    this.state.files.forEach((file) => {
      if (file.status === 'failed') {
        file.status = 'pending';
        file.progress = 0;
        file.error = undefined;
      }
    });
    this.notify();
  }
}
