import express, { Router } from 'express';
import { Song } from '../models/Song';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';

const router: Router = express.Router();

/**
 * GET /api/artists
 * Get all artists with song and album counts
 */
router.get('/', verifyToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Aggregate artists with their song counts
    const artists = await Song.aggregate([
      { $match: { uploadedBy: userId } },
      {
        $group: {
          _id: '$artist',
          songCount: { $sum: 1 },
          albums: { $addToSet: '$album' },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          songCount: 1,
          albumCount: {
            $size: {
              $filter: {
                input: '$albums',
                as: 'album',
                cond: { $ne: ['$$album', null] },
              },
            },
          },
        },
      },
      { $sort: { name: 1 } },
    ]);

    res.json({ artists });
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
});

/**
 * GET /api/artists/:artistName
 * Get all songs and albums by a specific artist
 */
router.get('/:artistName', verifyToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.userId;
    const { artistName } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Decode the artist name from URL
    const decodedArtistName = decodeURIComponent(artistName);

    // Find all songs by this artist
    // Match by primary artist or any artist in the artists array
    const songs = await Song.find({
      uploadedBy: userId,
      $or: [
        { artist: decodedArtistName },
        { artists: decodedArtistName }
      ],
    }).sort({ album: 1, title: 1 });

    if (songs.length === 0) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }

    // Get unique albums
    const albums = [...new Set(songs.filter(s => s.album).map(s => s.album))];

    // Calculate total duration
    const totalDuration = songs.reduce((acc, song) => acc + (song.duration || 0), 0);

    res.json({
      artist: decodedArtistName,
      songCount: songs.length,
      albumCount: albums.length,
      totalDuration,
      songs,
      albums,
    });
  } catch (error) {
    console.error('Error fetching artist songs:', error);
    res.status(500).json({ error: 'Failed to fetch artist songs' });
  }
});

/**
 * PUT /api/artists/:artistName
 * Update artist name (applies to all songs by this artist)
 */
router.put('/:artistName', verifyToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.userId;
    const { artistName } = req.params;
    const { newArtist } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!newArtist || !newArtist.trim()) {
      res.status(400).json({ error: 'New artist name is required' });
      return;
    }

    const decodedArtistName = decodeURIComponent(artistName);

    // Find all songs by this artist
    // Match by primary artist or any artist in the artists array
    const songs = await Song.find({
      uploadedBy: userId,
      $or: [
        { artist: decodedArtistName },
        { artists: decodedArtistName }
      ],
    });

    if (songs.length === 0) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }

    // Update all songs by this artist
    await Song.updateMany(
      {
        uploadedBy: userId,
        $or: [
          { artist: decodedArtistName },
          { artists: decodedArtistName }
        ],
      },
      { $set: { artist: newArtist.trim() } }
    );

    res.json({
      message: 'Artist updated successfully',
      updatedSongs: songs.length,
    });
  } catch (error) {
    console.error('Error updating artist:', error);
    res.status(500).json({ error: 'Failed to update artist' });
  }
});

/**
 * DELETE /api/artists/:artistName
 * Delete all songs by an artist
 */
router.delete('/:artistName', verifyToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.userId;
    const { artistName } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const decodedArtistName = decodeURIComponent(artistName);

    // Delete all songs by this artist
    // Match by primary artist or any artist in the artists array
    const result = await Song.deleteMany({
      uploadedBy: userId,
      $or: [
        { artist: decodedArtistName },
        { artists: decodedArtistName }
      ],
    });

    res.json({
      message: 'Artist deleted successfully',
      deletedSongs: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting artist:', error);
    res.status(500).json({ error: 'Failed to delete artist' });
  }
});

export default router;
