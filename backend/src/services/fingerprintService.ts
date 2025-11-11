import { exec } from 'child_process';
import { promisify } from 'util';
import { Song, ISong } from '../models/Song';

const execAsync = promisify(exec);

/**
 * Generate audio fingerprint using Chromaprint's fpcalc tool
 * @param fileBuffer - Audio file buffer
 * @returns Fingerprint hash string
 * @throws Error if fpcalc execution fails or fingerprint cannot be extracted
 */
export async function generateFingerprint(fileBuffer: Buffer): Promise<string> {
  try {
    // Write buffer to temporary file for fpcalc processing
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `audio_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    
    // Write buffer to temp file
    fs.writeFileSync(tempFilePath, fileBuffer);
    
    try {
      // Execute fpcalc to generate fingerprint
      const { stdout, stderr } = await execAsync(`fpcalc "${tempFilePath}"`);
      
      if (stderr) {
        console.error('fpcalc stderr:', stderr);
      }
      
      // Parse fpcalc output to extract fingerprint
      // Expected format:
      // DURATION=123
      // FINGERPRINT=AQADtNQ...
      const lines = stdout.split('\n');
      const fingerprintLine = lines.find(line => line.startsWith('FINGERPRINT='));
      
      if (!fingerprintLine) {
        throw new Error('Failed to extract fingerprint from fpcalc output');
      }
      
      const fingerprint = fingerprintLine.replace('FINGERPRINT=', '').trim();
      
      if (!fingerprint) {
        throw new Error('Extracted fingerprint is empty');
      }
      
      return fingerprint;
    } finally {
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Fingerprint generation failed: ${error.message}`);
    }
    throw new Error('Fingerprint generation failed: Unknown error');
  }
}

/**
 * Check if a song with the given fingerprint already exists in the database
 * @param fingerprint - Audio fingerprint hash to check
 * @returns Existing song document if found, null otherwise
 */
export async function checkDuplicate(fingerprint: string): Promise<ISong | null> {
  try {
    const existingSong = await Song.findOne({ fingerprint }).exec();
    return existingSong;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Duplicate check failed: ${error.message}`);
    }
    throw new Error('Duplicate check failed: Unknown error');
  }
}
