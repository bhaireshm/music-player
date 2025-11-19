import express, { Router } from 'express';
import { Song } from '../models/Song';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';

const router: Router = express.Router();

/**
 * GET /api/albums
 * Get all albums with song counts (auto-generated from songs)
 */
router.get('/', verifyToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Aggregate albums from songs
    const albums = await Song.aggregate([
      {
        $match: {
          uploadedBy: userId,
          album: { $ne: null, $exists: true },
        },
      },
      {
        $group: {
          _id: { artist: '$artist', album: '$album' },
          songCount: { $sum: 1 },
          year: { $first: '$year' },
          genre: { $first: '$genre' },
          albumArt: { $first: '$albumArt' },
          songIds: { $push: '$_id' },
        },
      },
      {
        $project: {
          _id: 0,
          artist: '$_id.artist',
          album: '$_id.album',
          songCount: 1,
          year: 1,
          genre: 1,
          albumArt: 1,
          songIds: 1,
        },
      },
      { $sort: { artist: 1, album: 1 } },
    ]);

    res.json({ albums });
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

/**
 * GET /api/albums/:artistName/:albumName
 * Get a specific album with all songs
 */
router.get('/:artistName/:albumName', verifyToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.userId;
    const { artistName, albumName } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Decode the names from URL
    const decodedArtistName = decodeURIComponent(artistName);
    const decodedAlbumName = decodeURIComponent(albumName);

    // Find all songs in this album
    // Match by primary artist or any artist in the artists array
    const songs = await Song.find({
      uploadedBy: userId,
      $or: [
        { artist: decodedArtistName },
        { artists: decodedArtistName }
      ],
      album: decodedAlbumName,
    }).sort({ title: 1 });

    if (songs.length === 0) {
      res.status(404).json({ error: 'Album not found' });
      return;
    }

    // Calculate total duration
    const totalDuration = songs.reduce((acc, song) => acc + (song.duration || 0), 0);

    res.json({
      artist: decodedArtistName,
      album: decodedAlbumName,
      year: songs[0]?.year,
      genre: songs[0]?.genre,
      albumArt: songs[0]?.albumArt,
      songCount: songs.length,
      totalDuration,
      songs,
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

/**
 * PUT /api/albums/:artistName/:albumName
 * Update album metadata (applies to all songs in the album)
 */
router.put('/:artistName/:albumName', verifyToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.userId;
    const { artistName, albumName } = req.params;
    const { newArtist, newAlbum, year, genre, albumArt } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const decodedArtistName = decodeURIComponent(artistName);
    const decodedAlbumName = decodeURIComponent(albumName);

    // Find all songs in this album
    // Match by primary artist or any artist in the artists array
    const songs = await Song.find({
      uploadedBy: userId,
      $or: [
        { artist: decodedArtistName },
        { artists: decodedArtistName }
      ],
      album: decodedAlbumName,
    });

    if (songs.length === 0) {
      res.status(404).json({ error: 'Album not found' });
      return;
    }

    // Update all songs in the album
    const updateData: any = {};
    if (newArtist !== undefined) updateData.artist = newArtist;
    if (newAlbum !== undefined) updateData.album = newAlbum;
    if (year !== undefined) updateData.year = year;
    if (genre !== undefined) updateData.genre = genre;
    if (albumArt !== undefined) updateData.albumArt = albumArt;

    await Song.updateMany(
      {
        uploadedBy: userId,
        $or: [
          { artist: decodedArtistName },
          { artists: decodedArtistName }
        ],
        album: decodedAlbumName,
      },
      { $set: updateData }
    );

    res.json({
      message: 'Album updated successfully',
      updatedSongs: songs.length,
    });
  } catch (error) {
    console.error('Error updating album:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

/**
 * DELETE /api/albums/:artistName/:albumName
 * Delete an entire album (all songs)
 */
router.delete('/:artistName/:albumName', verifyToken, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.userId;
    const { artistName, albumName } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const decodedArtistName = decodeURIComponent(artistName);
    const decodedAlbumName = decodeURIComponent(albumName);

    // Delete all songs in this album
    // Match by primary artist or any artist in the artists array
    const result = await Song.deleteMany({
      uploadedBy: userId,
      $or: [
        { artist: decodedArtistName },
        { artists: decodedArtistName }
      ],
      album: decodedAlbumName,
    });

    res.json({
      message: 'Album deleted successfully',
      deletedSongs: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

export default router;
