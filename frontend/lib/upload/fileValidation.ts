/**
 * File Validation Utilities
 * Validates audio files for format, size, and extracts metadata
 */

// Supported audio formats
const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg', // MP3
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/flac',
  'audio/x-flac',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
];

const SUPPORTED_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.ogg',
  '.flac',
  '.aac',
  '.m4a',
];

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileMetadata {
  title: string;
  artist: string;
  album?: string;
}

/**
 * Validate if file is a supported audio format
 */
export function validateAudioFormat(file: File): ValidationResult {
  // Check MIME type
  if (SUPPORTED_AUDIO_FORMATS.includes(file.type)) {
    return { valid: true };
  }

  // Fallback: check file extension
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (extension && SUPPORTED_EXTENSIONS.includes(extension)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `Unsupported file format. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
  };
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Validate a file (format and size)
 */
export function validateFile(file: File): ValidationResult {
  // Check format
  const formatResult = validateAudioFormat(file);
  if (!formatResult.valid) {
    return formatResult;
  }

  // Check size
  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  return { valid: true };
}

/**
 * Extract metadata from filename
 * Attempts to parse common filename patterns like "Artist - Title.mp3"
 */
export function extractMetadataFromFilename(filename: string): FileMetadata {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

  // Try to parse "Artist - Title" pattern
  const dashPattern = /^(.+?)\s*-\s*(.+)$/;
  const match = nameWithoutExt.match(dashPattern);

  if (match) {
    return {
      title: match[2].trim(),
      artist: match[1].trim(),
    };
  }

  // Fallback: use filename as title
  return {
    title: nameWithoutExt.trim(),
    artist: 'Unknown Artist',
  };
}

/**
 * Validate multiple files and return results
 */
export function validateFiles(files: File[]): {
  valid: File[];
  invalid: Array<{ file: File; error: string }>;
} {
  const valid: File[] = [];
  const invalid: Array<{ file: File; error: string }> = [];

  files.forEach((file) => {
    const result = validateFile(file);
    if (result.valid) {
      valid.push(file);
    } else {
      invalid.push({
        file,
        error: result.error || 'Validation failed',
      });
    }
  });

  return { valid, invalid };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toUpperCase() : '';
}
