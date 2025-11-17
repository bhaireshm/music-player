import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Playlist } from '../models/Playlist';
import { Types } from 'mongoose';

/**
 * PUT /playlists/:id/visibility
 * Update playlist visibility
 */
export async function updateVisibility(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId!;
    const playlistId = req.params.id;
    const { visibility } = req.body;

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

    // Validate visibility value
    if (!['private', 'shared', 'public'].includes(visibility)) {
      res.status(400).json({
        error: {
          code: 'INVALID_VISIBILITY',
          message: 'Visibility must be private, shared, or public',
        },
      });
      return;
    }

    // Find playlist and verify ownership
    const playlist = await Playlist.findOne({
      _id: playlistId,
      ownerId: userId,
    });

    if (!playlist) {
      res.status(404).json({
        error: {
          code: 'PLAYLIST_NOT_FOUND',
          message: 'Playlist not found or you do not have permission',
        },
      });
      return;
    }

    // Update visibility
    playlist.visibility = visibility;
    playlist.updatedAt = new Date();
    await playlist.save();

    res.status(200).json({
      playlist: {
        id: (playlist._id as Types.ObjectId).toString(),
        name: playlist.name,
        ownerId: playlist.ownerId,
        visibility: playlist.visibility,
        collaborators: playlist.collaborators,
        followers: playlist.followers,
        songIds: playlist.songIds,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update playlist visibility',
        details: errorMessage,
      },
    });
  }
}

/**
 * POST /playlists/:id/collaborators
 * Add a collaborator to a playlist
 */
export async function addCollaborator(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId!;
    const playlistId = req.params.id;
    const { collaboratorId } = req.body;

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

    // Validate collaborator ID
    if (!collaboratorId || typeof collaboratorId !== 'string') {
      res.status(400).json({
        error: {
          code: 'INVALID_COLLABORATOR_ID',
          message: 'Collaborator ID is required',
        },
      });
      return;
    }

    // Find playlist and verify ownership
    const playlist = await Playlist.findOne({
      _id: playlistId,
      ownerId: userId,
    });

    if (!playlist) {
      res.status(404).json({
        error: {
          code: 'PLAYLIST_NOT_FOUND',
          message: 'Playlist not found or you do not have permission',
        },
      });
      return;
    }

    // Check if already a collaborator
    if (playlist.collaborators.includes(collaboratorId)) {
      res.status(400).json({
        error: {
          code: 'ALREADY_COLLABORATOR',
          message: 'User is already a collaborator',
        },
      });
      return;
    }

    // Check if trying to add owner
    if (collaboratorId === userId) {
      res.status(400).json({
        error: {
          code: 'CANNOT_ADD_OWNER',
          message: 'Cannot add owner as collaborator',
        },
      });
      return;
    }

    // Add collaborator
    playlist.collaborators.push(collaboratorId);
    playlist.updatedAt = new Date();
    await playlist.save();

    res.status(200).json({
      playlist: {
        id: (playlist._id as Types.ObjectId).toString(),
        name: playlist.name,
        ownerId: playlist.ownerId,
        visibility: playlist.visibility,
        collaborators: playlist.collaborators,
        followers: playlist.followers,
        songIds: playlist.songIds,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to add collaborator',
        details: errorMessage,
      },
    });
  }
}

/**
 * DELETE /playlists/:id/collaborators/:collaboratorId
 * Remove a collaborator from a playlist
 */
export async function removeCollaborator(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId!;
    const playlistId = req.params.id;
    const collaboratorId = req.params.collaboratorId;

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

    // Find playlist and verify ownership
    const playlist = await Playlist.findOne({
      _id: playlistId,
      ownerId: userId,
    });

    if (!playlist) {
      res.status(404).json({
        error: {
          code: 'PLAYLIST_NOT_FOUND',
          message: 'Playlist not found or you do not have permission',
        },
      });
      return;
    }

    // Remove collaborator
    playlist.collaborators = playlist.collaborators.filter(
      (id) => id !== collaboratorId
    );
    playlist.updatedAt = new Date();
    await playlist.save();

    res.status(200).json({
      success: true,
      message: 'Collaborator removed successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to remove collaborator',
        details: errorMessage,
      },
    });
  }
}

/**
 * POST /playlists/:id/follow
 * Follow a public playlist
 */
export async function followPlaylist(
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
          code: 'PLAYLIST_NOT_FOUND',
          message: 'Playlist not found',
        },
      });
      return;
    }

    // Check if playlist is public
    if (playlist.visibility !== 'public') {
      res.status(403).json({
        error: {
          code: 'PLAYLIST_NOT_PUBLIC',
          message: 'Can only follow public playlists',
        },
      });
      return;
    }

    // Check if already following
    if (playlist.followers.includes(userId)) {
      res.status(400).json({
        error: {
          code: 'ALREADY_FOLLOWING',
          message: 'Already following this playlist',
        },
      });
      return;
    }

    // Add follower
    playlist.followers.push(userId);
    playlist.updatedAt = new Date();
    await playlist.save();

    res.status(200).json({
      success: true,
      message: 'Playlist followed successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to follow playlist',
        details: errorMessage,
      },
    });
  }
}

/**
 * DELETE /playlists/:id/follow
 * Unfollow a playlist
 */
export async function unfollowPlaylist(
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
          code: 'PLAYLIST_NOT_FOUND',
          message: 'Playlist not found',
        },
      });
      return;
    }

    // Remove follower
    playlist.followers = playlist.followers.filter((id) => id !== userId);
    playlist.updatedAt = new Date();
    await playlist.save();

    res.status(200).json({
      success: true,
      message: 'Playlist unfollowed successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to unfollow playlist',
        details: errorMessage,
      },
    });
  }
}

/**
 * GET /playlists/public
 * Get all public playlists with pagination and search
 */
export async function getPublicPlaylists(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string || '';

    // Build query
    const query: { visibility: string; name?: { $regex: string; $options: string } } = { visibility: 'public' };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Get total count
    const total = await Playlist.countDocuments(query);

    // Get playlists with pagination
    const playlists = await Playlist.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('songIds', 'title artist mimeType createdAt')
      .exec();

    // Transform playlists
    const transformedPlaylists = playlists.map((playlist) => {
      const songs = playlist.songIds as unknown as Array<{ _id: Types.ObjectId; title: string; artist: string; mimeType: string; createdAt: Date }>;
      return {
        id: (playlist._id as Types.ObjectId).toString(),
        name: playlist.name,
        ownerId: playlist.ownerId,
        visibility: playlist.visibility,
        collaborators: playlist.collaborators,
        followers: playlist.followers,
        followerCount: playlist.followers.length,
        songIds: songs.map((song) => ({
          id: song._id.toString(),
          title: song.title,
          artist: song.artist,
          mimeType: song.mimeType,
          createdAt: song.createdAt,
        })),
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      };
    });

    res.status(200).json({
      playlists: transformedPlaylists,
      total,
      limit,
      offset,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch public playlists',
        details: errorMessage,
      },
    });
  }
}

/**
 * GET /playlists/discover
 * Get recommended public playlists (most followed)
 */
export async function getDiscoverPlaylists(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    // Get public playlists sorted by follower count
    const playlists = await Playlist.aggregate([
      { $match: { visibility: 'public' } },
      {
        $addFields: {
          followerCount: { $size: '$followers' },
        },
      },
      { $sort: { followerCount: -1, createdAt: -1 } },
      { $limit: limit },
    ]);

    // Populate song details
    await Playlist.populate(playlists, {
      path: 'songIds',
      select: 'title artist mimeType createdAt',
    });

    // Transform playlists
    const transformedPlaylists = playlists.map((playlist: { _id: Types.ObjectId; name: string; ownerId: string; visibility: string; collaborators: string[]; followers: string[]; followerCount: number; songIds: unknown; createdAt: Date; updatedAt: Date }) => {
      const songs = playlist.songIds as Array<{ _id: Types.ObjectId; title: string; artist: string; mimeType: string; createdAt: Date }>;
      return {
        id: playlist._id.toString(),
        name: playlist.name,
        ownerId: playlist.ownerId,
        visibility: playlist.visibility,
        collaborators: playlist.collaborators,
        followers: playlist.followers,
        followerCount: playlist.followerCount,
        songIds: songs.map((song) => ({
          id: song._id.toString(),
          title: song.title,
          artist: song.artist,
          mimeType: song.mimeType,
          createdAt: song.createdAt,
        })),
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt,
      };
    });

    res.status(200).json({
      playlists: transformedPlaylists,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch discover playlists',
        details: errorMessage,
      },
    });
  }
}

/**
 * GET /playlists/:id/share-link
 * Generate a shareable link for a playlist
 */
export async function generateShareLink(
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

    // Find playlist and verify access
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

    // Check if user has access to generate share link
    const hasAccess =
      playlist.ownerId === userId ||
      playlist.collaborators.includes(userId) ||
      playlist.visibility === 'public';

    if (!hasAccess) {
      res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to share this playlist',
        },
      });
      return;
    }

    // Generate share link (using frontend URL from environment or default)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareLink = `${frontendUrl}/playlists/${playlistId}`;

    res.status(200).json({
      shareLink,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to generate share link',
        details: errorMessage,
      },
    });
  }
}
