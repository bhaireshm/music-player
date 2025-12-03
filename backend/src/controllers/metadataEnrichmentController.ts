import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Song } from '../models/Song';
import { searchMusicBrainz } from '../services/metadataEnrichmentService';

/**
 * Enrich song metadata using online sources (MusicBrainz)
 * POST /songs/:id/enrich
 */
export async function enrichSongMetadata(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { id } = req.params;
        const { forceUpdate } = req.body; // If true, overwrite existing fields

        const song = await Song.findById(id);
        if (!song) {
            res.status(404).json({ error: 'Song not found' });
            return;
        }

        // Ensure we have enough info to search
        if (!song.title || !song.artist) {
            res.status(400).json({
                error: 'Song must have a title and artist to perform enrichment'
            });
            return;
        }

        console.log(`Enriching metadata for: ${song.title} - ${song.artist}`);

        // Search online
        const enrichedData = await searchMusicBrainz(song.title, song.artist);

        if (!enrichedData) {
            res.status(404).json({
                message: 'No matching metadata found online',
                song
            });
            return;
        }

        // Update fields
        let updated = false;

        // Helper to update if missing or forced
        const shouldUpdate = (current: any, incoming: any) => {
            if (!incoming) return false;
            if (!current) return true;
            return forceUpdate === true;
        };

        if (shouldUpdate(song.album, enrichedData.album)) {
            song.album = enrichedData.album;
            updated = true;
        }

        if (shouldUpdate(song.year, enrichedData.year)) {
            song.year = enrichedData.year;
            updated = true;
        }

        // For genre, we might want to merge or append
        if (enrichedData.genres && enrichedData.genres.length > 0) {
            // If song.genre is a string, split it. If array, use it.
            let currentGenres: string[] = [];
            if (Array.isArray(song.genre)) {
                currentGenres = song.genre;
            } else if (typeof song.genre === 'string' && song.genre) {
                currentGenres = song.genre.split(',').map(g => g.trim());
            }

            // Add new genres that don't exist
            const newGenres = enrichedData.genres.filter(g => !currentGenres.includes(g));

            if (newGenres.length > 0) {
                // If we are forcing update, maybe we replace? For now, let's append/merge to be safe
                // Or if forceUpdate is true, we could replace.
                // Let's stick to merging for genres to be safe.

                // Update the genre field. 
                // Note: We need to respect the schema. If schema is String, we join.
                // Based on previous tasks, we know schema expects String but we want to support Arrays eventually.
                // For now, let's join them back to a string if the schema is String.

                const merged = [...currentGenres, ...newGenres];
                // Limit to reasonable number
                const finalGenres = merged.slice(0, 5);

                // Check if we need to save as string or array. 
                // The controller previously handled this by checking if it's an array.
                // Let's try to save as string to be safe with current schema.
                song.genre = finalGenres.join(', ');
                updated = true;
            }
        }

        // Cover Art
        if (shouldUpdate(song.albumArt, enrichedData.coverArtUrl)) {
            song.albumArt = enrichedData.coverArtUrl;
            updated = true;
        }

        if (updated) {
            await song.save();
            res.status(200).json({
                message: 'Metadata enriched successfully',
                enrichedFields: enrichedData,
                song
            });
        } else {
            res.status(200).json({
                message: 'Metadata already up to date',
                song
            });
        }

    } catch (error) {
        console.error('Metadata enrichment failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Apply AI-enhanced metadata cleanup to fix swapped fields and clean junk data
 * POST /songs/:id/cleanup
 */
export async function aiEnhancedMetadataCleanup(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { id } = req.params;

        const song = await Song.findById(id);
        if (!song) {
            res.status(404).json({ error: 'Song not found' });
            return;
        }

        // Only owner can cleanup metadata
        if (song.uploadedBy !== req.userId) {
            res.status(403).json({ error: 'Not authorized to modify this song' });
            return;
        }

        console.log(`AI-enhanced cleanup for: ${song.title} - ${song.artist}`);

        // Import the AI-enhanced swap detection
        const { aiEnhancedSwapDetection, cleanMetadata } = await import('../utils/metadataCleaner');

        let updated = false;
        const changes: string[] = [];

        // Check if title/artist need to be swapped
        if (song.title && song.artist) {
            const swapResult = await aiEnhancedSwapDetection(
                song.title,
                song.artist,
                song.genre
            );

            if (swapResult.shouldSwap && swapResult.confidence >= 0.75) {
                const oldTitle = song.title;
                const oldArtist = song.artist;

                song.title = oldArtist;
                song.artist = oldTitle;
                updated = true;
                changes.push(`Swapped title/artist (confidence: ${(swapResult.confidence * 100).toFixed(0)}%): "${oldTitle}" ↔ "${oldArtist}"`);

                console.log(`✓ Swapped fields (${swapResult.reason})`);
            }
        }

        // Apply comprehensive metadata cleaning
        const originalMetadata = {
            title: song.title,
            artist: song.artist,
            album: song.album,
            genre: song.genre,
            year: song.year
        };

        const cleanedMetadata = cleanMetadata({
            title: song.title,
            artist: song.artist,
            album: song.album,
            genre: song.genre,
            year: song.year
        });

        // Update fields if they changed
        if (cleanedMetadata.title && cleanedMetadata.title !== originalMetadata.title) {
            song.title = cleanedMetadata.title;
            updated = true;
            changes.push(`Cleaned title: "${originalMetadata.title}" → "${cleanedMetadata.title}"`);
        }

        if (cleanedMetadata.artist && cleanedMetadata.artist !== originalMetadata.artist) {
            song.artist = cleanedMetadata.artist;
            updated = true;
            changes.push(`Cleaned artist: "${originalMetadata.artist}" → "${cleanedMetadata.artist}"`);
        }

        if (cleanedMetadata.album && cleanedMetadata.album !== originalMetadata.album) {
            song.album = cleanedMetadata.album;
            updated = true;
            changes.push(`Cleaned album: "${originalMetadata.album}" → "${cleanedMetadata.album}"`);
        }

        if (updated) {
            await song.save();
            res.status(200).json({
                message: 'Metadata cleaned successfully',
                changes,
                song
            });
        } else {
            res.status(200).json({
                message: 'Metadata is already clean',
                song
            });
        }

    } catch (error) {
        console.error('AI-enhanced metadata cleanup failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Batch process multiple songs for metadata cleanup
 * POST /songs/batch-cleanup
 */
export async function batchMetadataCleanup(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { songIds, processAll } = req.body;

        if (!processAll && (!songIds || !Array.isArray(songIds))) {
            res.status(400).json({
                error: 'Either provide songIds array or set processAll to true'
            });
            return;
        }

        console.log(`Starting batch metadata cleanup (processAll: ${processAll})`);

        // Import cleanup functions
        const { aiEnhancedSwapDetection, cleanMetadata } = await import('../utils/metadataCleaner');

        // Get songs to process
        let songs;
        if (processAll) {
            // Only process user's own songs
            songs = await Song.find({ uploadedBy: req.userId });
        } else {
            // Only process user's own songs from the provided IDs
            songs = await Song.find({
                _id: { $in: songIds },
                uploadedBy: req.userId
            });
        }

        const results: Array<{
            id: string;
            title: string;
            status: 'success' | 'skipped' | 'failed';
            changes?: string[];
            error?: string;
        }> = [];

        let processed = 0;
        let failed = 0;
        let skipped = 0;

        for (const song of songs) {
            try {
                const changes: string[] = [];
                let updated = false;

                // Check if title/artist need to be swapped
                if (song.title && song.artist) {
                    const swapResult = await aiEnhancedSwapDetection(
                        song.title,
                        song.artist,
                        song.genre
                    );

                    if (swapResult.shouldSwap && swapResult.confidence >= 0.75) {
                        const oldTitle = song.title;
                        const oldArtist = song.artist;

                        song.title = oldArtist;
                        song.artist = oldTitle;
                        updated = true;
                        changes.push(`Swapped (${(swapResult.confidence * 100).toFixed(0)}%): "${oldTitle}" ↔ "${oldArtist}"`);
                    }
                }

                // Apply comprehensive cleaning
                const originalMetadata = {
                    title: song.title,
                    artist: song.artist,
                    album: song.album
                };

                const cleanedMetadata = cleanMetadata({
                    title: song.title,
                    artist: song.artist,
                    album: song.album,
                    genre: song.genre,
                    year: song.year
                });

                // Update fields if they changed
                if (cleanedMetadata.title && cleanedMetadata.title !== originalMetadata.title) {
                    song.title = cleanedMetadata.title;
                    updated = true;
                    changes.push(`Title: "${originalMetadata.title}" → "${cleanedMetadata.title}"`);
                }

                if (cleanedMetadata.artist && cleanedMetadata.artist !== originalMetadata.artist) {
                    song.artist = cleanedMetadata.artist;
                    updated = true;
                    changes.push(`Artist: "${originalMetadata.artist}" → "${cleanedMetadata.artist}"`);
                }

                if (cleanedMetadata.album && cleanedMetadata.album !== originalMetadata.album) {
                    song.album = cleanedMetadata.album;
                    updated = true;
                    changes.push(`Album: "${originalMetadata.album}" → "${cleanedMetadata.album}"`);
                }

                if (updated) {
                    await song.save();
                    processed++;
                    results.push({
                        id: song.id,
                        title: song.title || 'Unknown',
                        status: 'success',
                        changes
                    });
                } else {
                    skipped++;
                    results.push({
                        id: song.id,
                        title: song.title || 'Unknown',
                        status: 'skipped'
                    });
                }

            } catch (error) {
                failed++;
                results.push({
                    id: song.id,
                    title: song.title || 'Unknown',
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                console.error(`Failed to clean metadata for song ${song.id}:`, error);
            }
        }

        res.status(200).json({
            message: 'Batch metadata cleanup completed',
            total: songs.length,
            processed,
            skipped,
            failed,
            results
        });

    } catch (error) {
        console.error('Batch metadata cleanup failed:', error);
        res.status(500).json({
            error: 'Batch cleanup failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
