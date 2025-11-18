/**
 * Upload Worker
 * Handles individual file uploads with progress tracking and retry logic
 */

import { getIdToken } from '../firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface UploadOptions {
  file: File;
  title: string;
  artist: string;
  album?: string;
  onProgress?: (progress: number) => void;
  onComplete?: (songId: string) => void;
  onError?: (error: string) => void;
}

export interface UploadResult {
  success: boolean;
  songId?: string;
  error?: string;
}

/**
 * Upload a single file with progress tracking
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { file, title, artist, album, onProgress, onComplete, onError } = options;

  try {
    // Get authentication token
    const token = await getIdToken();
    if (!token) {
      throw new Error('User is not authenticated');
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('artist', artist);
    if (album) {
      formData.append('album', album);
    }

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            const songId = data.song?.id;
            
            if (songId && onComplete) {
              onComplete(songId);
            }
            
            resolve({
              success: true,
              songId,
            });
          } catch {
            const errorMsg = 'Failed to parse server response';
            if (onError) {
              onError(errorMsg);
            }
            resolve({
              success: false,
              error: errorMsg,
            });
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            const errorMsg = errorData.error?.message || `Upload failed with status ${xhr.status}`;
            if (onError) {
              onError(errorMsg);
            }
            resolve({
              success: false,
              error: errorMsg,
            });
          } catch {
            const errorMsg = `Upload failed with status ${xhr.status}`;
            if (onError) {
              onError(errorMsg);
            }
            resolve({
              success: false,
              error: errorMsg,
            });
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        const errorMsg = 'Network error occurred during upload';
        if (onError) {
          onError(errorMsg);
        }
        resolve({
          success: false,
          error: errorMsg,
        });
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        const errorMsg = 'Upload was cancelled';
        if (onError) {
          onError(errorMsg);
        }
        resolve({
          success: false,
          error: errorMsg,
        });
      });

      // Open and send request
      xhr.open('POST', `${API_BASE_URL}/songs/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    if (onError) {
      onError(errorMsg);
    }
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Upload file with automatic retry logic
 */
export async function uploadFileWithRetry(
  options: UploadOptions,
  maxRetries: number = 3
): Promise<UploadResult> {
  let lastError: string | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Exponential backoff: 1s, 2s, 4s
    if (attempt > 0) {
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const result = await uploadFile(options);
    
    if (result.success) {
      return result;
    }

    lastError = result.error;

    // Don't retry on authentication or validation errors
    if (
      lastError?.includes('authenticated') ||
      lastError?.includes('validation') ||
      lastError?.includes('format')
    ) {
      break;
    }
  }

  return {
    success: false,
    error: lastError || 'Upload failed after multiple attempts',
  };
}
