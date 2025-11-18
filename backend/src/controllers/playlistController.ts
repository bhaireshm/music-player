import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Playlist } from '../models/Playlist';
import { Song } from '../models/Song';
import { Types } from 'mongoose';
import { getPlaylistPermission, PlaylistPermission } from '../middleware/playlistPermissions';

/**
 * GET /playlists
 * Fetch all playlists for the authenticated user
 */
export async function getPlaylists(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId!;

    // Query playlists where user is owner, collaborator, or follower
    const playlists = await Playlist.find({
      $or: [
        { userId },
        { ownerId: userId },
        { collaborators: userId },
        { followers: userId },
      ],
    })
      .populate('songIds', 'title artist mimeType createdAt')
      .exec();

    // Transform playlists to match frontend interface
    const transformedPlaylists = playlists.map((playlist) => {
      const permission = getPlaylistPermission(playlist, userId);
      return {
        id: (playlist._id as Types.ObjectId).toString(),
        name: playlist.name,
        userId: playlist.userId,
        ownerId: playlist.ownerId,
        visibility: playlist.visibility,
        collaborators: playlist.collaborators,
        followers: playlist.followers,
        followerCount: playlist.followers.length,
        permission,
        songIds: playlist.songIds.map((song: any) => 
          song._id ? {
            id: song._id.toString(),
            title: song.title,
            artist: song.artist,
            mimeType: song.mimeType,
            createdAt: song.createdAt,
          } : song
        ),
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      };
    });

    res.status(200).json(transformedPlaylists);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch playlists',
        details: errorMessage,
      },
    });
  }
}

/**
 * GET /playlists/:id
 * Fetch a single playlist with populated songs
 */
export async function getPlaylist(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId!;
    const playlistId = req.params.id;

    // Validate playlist ID
    if (!Types.ObjectId.isValid(playlistId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Invalid playlist ID format',
        },
      });
      return;
    }

    // Find playlist
    const playlist = await Playlist.findById(playlistId)
      .populate('songIds', 'title artist mimeType createdAt')
      .exec();

    if (!playlist) {
      res.status(404).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Playlist not found',
        },
      });
      return;
    }

    // Check access permissions
    const permission = getPlaylistPermission(playlist, userId);
    
    if (permission === PlaylistPermission.NONE) {
      res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to view this playlist',
        },
      });
      return;
    }

    // Transform playlist to match frontend interface
    const transformedPlaylist = {
      id: (playlist._id as Types.ObjectId).toString(),
      name: playlist.name,
      userId: playlist.userId,
      ownerId: playlist.ownerId,
      visibility: playlist.visibility,
      collaborators: playlist.collaborators,
      followers: playlist.followers,
      followerCount: playlist.followers.length,
      permission,
      songIds: playlist.songIds.map((song: any) => ({
        id: song._id.toString(),
        title: song.title,
        artist: song.artist,
        mimeType: song.mimeType,
        createdAt: song.createdAt,
      })),
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };

    res.status(200).json(transformedPlaylist);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch playlist',
        details: errorMessage,
      },
    });
  }
}

/**
 * POST /playlists
 * Create a new playlist for the authenticated user
 */
export async function createPlaylist(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId!;
    const { name } = req.body;

    // Validate playlist name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        error: {
          code: 'MISSING_METADATA',
          message: 'Playlist name is required',
        },
      });
      return;
    }

    // Create new playlist
    const playlist = new Playlist({
      name: name.trim(),
      userId,
      ownerId: userId, // Set ownerId to current user
      visibility: 'private', // Default to private
      collaborators: [],
      followers: [],
      songIds: [],
    });

    await playlist.save();

    // Transform playlist to match frontend interface
    const transformedPlaylist = {
      id: (playlist._id as Types.ObjectId).toString(),
      name: playlist.name,
      userId: playlist.userId,
      ownerId: playlist.ownerId,
      visibility: playlist.visibility,
      collaborators: playlist.collaborators,
      followers: playlist.followers,
      followerCount: 0,
      permission: PlaylistPermission.OWNER,
      songIds: [],
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };

    res.status(201).json({ playlist: transformedPlaylist });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create playlist',
        details: errorMessage,
      },
    });
  }
}

/**
 * PUT /playlists/:id
 * Update playlist songs
 */
export async function updatePlaylist(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId!;
    const playlistId = req.params.id;
    const { songIds } = req.body;

    // Validate playlist ID
    if (!Types.ObjectId.isValid(playlistId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Invalid playlist ID format',
        },
      });
      return;
    }

    // Validate songIds array
    if (!Array.isArray(songIds)) {
      res.status(400).json({
        error: {
          code: 'MISSING_METADATA',
          message: 'songIds must be an array',
        },
      });
      return;
    }

    // Verify all songIds are valid ObjectIds
    const validSongIds = songIds.every((id) => Types.ObjectId.isValid(id));
    if (!validSongIds) {
      res.status(400).json({
        error: {
          code: 'MISSING_METADATA',
          message: 'All songIds must be valid ObjectIds',
        },
      });
      return;
    }

    // Verify all songs exist in database
    const existingSongs = await Song.find({
      _id: { $in: songIds },
    }).select('_id');

    if (existingSongs.length !== songIds.length) {
      res.status(400).json({
        error: {
          code: 'MISSING_METADATA',
          message: 'One or more song IDs do not exist',
        },
      });
      return;
    }

    // Find playlist
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      res.status(404).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Playlist not found',
        },
      });
      return;
    }

    // Check if user is owner or collaborator
    const ownerId = playlist.ownerId?.toString() || playlist.ownerId;
    const playlistUserId = playlist.userId?.toString() || playlist.userId;
    const isOwner = ownerId === userId || playlistUserId === userId;
    const isCollaborator = playlist.collaborators.includes(userId);

    if (!isOwner && !isCollaborator) {
      res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to edit this playlist',
        },
      });
      return;
    }

    // Update playlist
    playlist.songIds = songIds.map((id) => new Types.ObjectId(id));
    playlist.updatedAt = new Date();
    await playlist.save();

    // Populate and return updated playlist
    await playlist.populate('songIds', 'title artist mimeType createdAt');

    // Get permission level
    const permission = getPlaylistPermission(playlist, userId);

    // Transform playlist to match frontend interface
    const transformedPlaylist = {
      id: (playlist._id as Types.ObjectId).toString(),
      name: playlist.name,
      userId: playlist.userId,
      ownerId: playlist.ownerId,
      visibility: playlist.visibility,
      collaborators: playlist.collaborators,
      followers: playlist.followers,
      followerCount: playlist.followers.length,
      permission,
      songIds: playlist.songIds.map((song: any) => ({
        id: song._id.toString(),
        title: song.title,
        artist: song.artist,
        mimeType: song.mimeType,
        createdAt: song.createdAt,
      })),
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };

    res.status(200).json({ playlist: transformedPlaylist });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update playlist',
        details: errorMessage,
      },
    });
  }
}

/**
 * DELETE /playlists/:id
 * Delete a playlist
 */
export async function deletePlaylist(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId!;
    const playlistId = req.params.id;

    // Validate playlist ID
    if (!Types.ObjectId.isValid(playlistId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Invalid playlist ID format',
        },
      });
      return;
    }

    // Find playlist
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      res.status(404).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Playlist not found',
        },
      });
      return;
    }

    // Only owner can delete playlist
    if (playlist.ownerId !== userId) {
      res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Only the playlist owner can delete this playlist',
        },
      });
      return;
    }

    // Delete playlist
    await Playlist.findByIdAndDelete(playlistId);

    res.status(200).json({
      message: 'Playlist deleted successfully',
      playlistId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete playlist',
        details: errorMessage,
      },
    });
  }
}

/**
 * POST /playlists/:id/songs
 * Add a song to a playlist
 */
export async function addSongToPlaylist(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId!;
    const playlistId = req.params.id;
    const { songId } = req.body;

    // Validate playlist ID
    if (!Types.ObjectId.isValid(playlistId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Invalid playlist ID format',
        },
      });
      return;
    }

    // Validate song ID
    if (!songId || !Types.ObjectId.isValid(songId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_SONG_ID',
          message: 'Invalid song ID format',
        },
      });
      return;
    }

    // Check if song exists
    const song = await Song.findById(songId);
    if (!song) {
      res.status(404).json({
        error: {
          code: 'SONG_NOT_FOUND',
          message: 'Song not found',
        },
      });
      return;
    }

    // Find playlist
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      res.status(404).json({
        error: {
          code: 'PLAYLIST_NOT_FOUND',
          message: 'Playlist not found',
        },
      });
      return;
    }

    // Check if user is owner or collaborator
    const ownerId = playlist.ownerId?.toString() || playlist.ownerId;
    const playlistUserId = playlist.userId?.toString() || playlist.userId;
    const isOwner = ownerId === userId || playlistUserId === userId;
    const isCollaborator = playlist.collaborators.includes(userId);

    if (!isOwner && !isCollaborator) {
      res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to edit this playlist',
        },
      });
      return;
    }

    // Check if song is already in playlist
    const songObjectId = new Types.ObjectId(songId);
    const songExists = playlist.songIds.some(id => id.equals(songObjectId));

    if (songExists) {
      res.status(400).json({
        error: {
          code: 'SONG_ALREADY_EXISTS',
          message: 'Song is already in the playlist',
        },
      });
      return;
    }

    // Add song to playlist
    playlist.songIds.push(songObjectId);
    playlist.updatedAt = new Date();
    await playlist.save();

    // Populate and return updated playlist
    await playlist.populate('songIds', 'title artist mimeType createdAt');

    // Get permission level
    const permission = getPlaylistPermission(playlist, userId);

    // Transform playlist to match frontend interface
    const transformedPlaylist = {
      id: (playlist._id as Types.ObjectId).toString(),
      name: playlist.name,
      userId: playlist.userId,
      ownerId: playlist.ownerId,
      visibility: playlist.visibility,
      collaborators: playlist.collaborators,
      followers: playlist.followers,
      followerCount: playlist.followers.length,
      permission,
      songIds: playlist.songIds.map((song: any) => ({
        id: song._id.toString(),
        title: song.title,
        artist: song.artist,
        mimeType: song.mimeType,
        createdAt: song.createdAt,
      })),
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };

    res.status(200).json({ playlist: transformedPlaylist });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to add song to playlist',
        details: errorMessage,
      },
    });
  }
}

/**
 * DELETE /playlists/:id/songs/:songId
 * Remove a song from a playlist
 */
export async function removeSongFromPlaylist(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId!;
    const playlistId = req.params.id;
    const songId = req.params.songId;

    // Validate playlist ID
    if (!Types.ObjectId.isValid(playlistId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_PLAYLIST_ID',
          message: 'Invalid playlist ID format',
        },
      });
      return;
    }

    // Validate song ID
    if (!Types.ObjectId.isValid(songId)) {
      res.status(400).json({
        error: {
          code: 'INVALID_SONG_ID',
          message: 'Invalid song ID format',
        },
      });
      return;
    }

    // Find playlist
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      res.status(404).json({
        error: {
          code: 'PLAYLIST_NOT_FOUND',
          message: 'Playlist not found',
        },
      });
      return;
    }

    // Check if user is owner or collaborator
    const ownerId = playlist.ownerId?.toString() || playlist.ownerId;
    const playlistUserId = playlist.userId?.toString() || playlist.userId;
    const isOwner = ownerId === userId || playlistUserId === userId;
    const isCollaborator = playlist.collaborators.includes(userId);

    if (!isOwner && !isCollaborator) {
      res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to edit this playlist',
        },
      });
      return;
    }

    // Remove song from playlist
    const songObjectId = new Types.ObjectId(songId);
    const initialLength = playlist.songIds.length;
    
    // Filter out the song - handle both ObjectId and string comparisons
    playlist.songIds = playlist.songIds.filter(id => {
      const idString = id.toString();
      return idString !== songId && idString !== songObjectId.toString();
    });
    
    // Check if song was actually removed
    if (playlist.songIds.length === initialLength) {
      res.status(404).json({
        error: {
          code: 'SONG_NOT_IN_PLAYLIST',
          message: 'Song not found in playlist',
        },
      });
      return;
    }
    
    playlist.updatedAt = new Date();
    await playlist.save();

    res.status(200).json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error removing song from playlist:', {
      playlistId: req.params.id,
      songId: req.params.songId,
      userId: req.userId,
      error: errorMessage,
    });
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to remove song from playlist',
        details: errorMessage,
      },
    });
  }
}
