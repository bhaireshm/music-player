/**
 * Metadata extraction service for audio files
 */

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string[];
  duration?: number;
}

/**
 * Extract metadata from an audio file buffer
 * @param fileBuffer - The audio file buffer to extract metadata from
 * @returns Promise resolving to AudioMetadata object
 */
export async function extractMetadata(fileBuffer: Buffer): Promise<AudioMetadata> {
  try {
    // Dynamic import of music-metadata
    const { parseBuffer } = await import('music-metadata');
    
    // Parse the audio file buffer
    const metadata = await parseBuffer(fileBuffer);
    
    // Extract common metadata fields
    const audioMetadata: AudioMetadata = {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      year: metadata.common.year,
      genre: metadata.common.genre,
      duration: metadata.format.duration,
    };
    
    // Count fields that were successfully extracted
    const fieldCount = Object.values(audioMetadata).filter(v => v !== undefined).length;
    
    // Log success with field count
    console.log('Metadata extraction succeeded:', {
      fieldsExtracted: fieldCount,
      title: audioMetadata.title || 'missing',
      artist: audioMetadata.artist || 'missing',
      album: audioMetadata.album || 'missing',
      year: audioMetadata.year || 'missing',
      genre: audioMetadata.genre ? audioMetadata.genre.join(', ') : 'missing',
      duration: audioMetadata.duration ? `${audioMetadata.duration.toFixed(2)}s` : 'missing',
    });
    
    // Log warnings for missing critical metadata
    if (!audioMetadata.title) {
      console.warn('Metadata extraction warning: Title field is missing from audio file');
    }
    if (!audioMetadata.artist) {
      console.warn('Metadata extraction warning: Artist field is missing from audio file');
    }
    
    return audioMetadata;
  } catch (error) {
    // Log error with stack trace for debugging
    console.error('Metadata extraction failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Return empty object on failure (graceful degradation)
    return {};
  }
}
