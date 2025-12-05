import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { Song, ISong } from '../models/Song';

const execAsync = promisify(exec);

/**
 * Result of fingerprint generation including the method used
 */
export interface FingerprintResult {
  fingerprint: string;
  method: 'acoustic' | 'hash';
}

/**
 * Generate SHA-256 hash of file buffer as fallback fingerprint
 * @param fileBuffer - Audio file buffer
 * @returns Hash string prefixed with "HASH:"
 */
function generateFileHash(fileBuffer: Buffer): string {
  const hash = createHash('sha256').update(fileBuffer).digest('hex');
  return `HASH:${hash}`;
}

/**
 * Generate audio fingerprint using Chromaprint's fpcalc tool with fallback to file hash
 * @param fileBuffer - Audio file buffer
 * @returns FingerprintResult containing fingerprint and method used
 */
export async function generateFingerprint(fileBuffer: Buffer): Promise<FingerprintResult> {
  try {
    // Write buffer to temporary file for fpcalc processing
    const fs = require('node:fs');
    const path = require('node:path');
    const os = require('node:os');

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `audio_${Date.now()}_${Math.random().toString(36).substring(7)}`);

    // Write buffer to temp file
    fs.writeFileSync(tempFilePath, fileBuffer);

    try {
      // Common fpcalc locations on Windows
      const fpcalcPaths = [
        'fpcalc', // Check if it's in PATH
        path.join(os.homedir(), '.chromaprint', 'fpcalc.exe'),
        path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Chromaprint', 'fpcalc.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Chromaprint', 'fpcalc.exe'),
      ];

      let fpcalcCommand = 'fpcalc';

      // Try to find fpcalc executable
      for (const fpcalcPath of fpcalcPaths) {
        try {
          if (fs.existsSync(fpcalcPath)) {
            fpcalcCommand = `"${fpcalcPath}"`;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }

      // Execute fpcalc to generate fingerprint
      const { stdout, stderr } = await execAsync(`${fpcalcCommand} "${tempFilePath}"`);

      if (stderr) {
        console.error('fpcalc stderr:', stderr);
      }

      // Parse fpcalc output to extract fingerprint
      // Expected format:
      // DURATION=123
      // FINGERPRINT=AQADtNQ...
      const lines = stdout.split('\n');
      const fingerprintLine = lines.find((line: string) => line.startsWith('FINGERPRINT='));

      if (!fingerprintLine) {
        throw new Error('Failed to extract fingerprint from fpcalc output');
      }

      const fingerprint = fingerprintLine.replace('FINGERPRINT=', '').trim();

      if (!fingerprint) {
        throw new Error('Extracted fingerprint is empty');
      }

      // Log info message when using acoustic fingerprint
      console.log('Fingerprint generated using acoustic method:', {
        method: 'acoustic',
        fingerprintLength: fingerprint.length,
      });

      return {
        fingerprint,
        method: 'acoustic'
      };
    } finally {
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }
    }
  } catch (error) {
    // Fallback to file hash when fpcalc fails
    const reason = error instanceof Error ? error.message : 'Unknown error';

    // Log warning when falling back to file hash with reason
    console.warn('Fingerprint generation falling back to file hash:', {
      reason,
      method: 'hash',
      message: 'fpcalc acoustic fingerprinting failed or unavailable',
    });

    const hashFingerprint = generateFileHash(fileBuffer);
    return {
      fingerprint: hashFingerprint,
      method: 'hash'
    };
  }
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns number of edits required to transform a to b
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if strings are similar based on normalized Levenshtein distance
 * Threshold: 0.0 to 1.0 (1.0 = identical)
 */
function isSimilar(str1: string, str2: string, threshold = 0.85): boolean {
  if (!str1 || !str2) return false;

  // Normalize: lowercase, remove special chars
  const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '').trim();

  if (s1 === s2) return true;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  const similarity = 1 - (distance / maxLength);
  return similarity >= threshold;
}

/**
 * Check for duplicates based on fingerprint (Exact) AND metadata (Fuzzy)
 */
export async function checkDuplicate(
  fingerprint: string,
  metadata?: { title: string; artist: string; duration?: number }
): Promise<ISong | null> {
  try {
    // 1. Check Exact Fingerprint
    const exactMatch = await Song.findOne({ fingerprint }).exec();
    if (exactMatch) {
      console.log('Found exact duplicate by fingerprint');
      return exactMatch;
    }

    // 2. Fuzzy Metadata Check (if metadata provided)
    if (metadata?.title && metadata?.artist) {
      // Find candidates with similar duration (+/- 5 seconds) if duration exists
      const durationQuery = metadata.duration
        ? { duration: { $gte: metadata.duration - 5, $lte: metadata.duration + 5 } }
        : {};

      // Limit candidates to optimize (e.g., search by artist first if possible, or just scan recent/all)
      // For valid performance, we should ideally have a text index, but here we'll scan candidates
      // finding songs by exact artist is a good pre-filter
      let candidates = await Song.find(durationQuery).lean();

      // Filter candidates using fuzzy matching
      for (const candidate of candidates) {
        const titleSimilar = isSimilar(candidate.title, metadata.title);
        const artistSimilar = isSimilar(candidate.artist, metadata.artist);

        if (titleSimilar && artistSimilar) {
          console.log(`Found fuzzy duplicate: "${candidate.title}" by "${candidate.artist}" matches "${metadata.title}" by "${metadata.artist}"`);
          // Use 'unknown' type assertion to bypass the specific LeanDocument type mismatch for now
          return candidate as unknown as ISong;
        }
      }
    }

    return null;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Duplicate check failed: ${error.message}`);
    }
    throw new Error('Duplicate check failed: Unknown error');
  }
}
