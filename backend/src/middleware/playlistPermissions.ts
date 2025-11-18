import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { Playlist } from '../models/Playlist';
import { Types } from 'mongoose';

/**
 * Permission levels for playlists
 */
export enum PlaylistPermission {
  OWNER = 'owner',
  COLLABORATOR = 'collaborator',
  FOLLOWER = 'follower',
  NONE = 'none',
}

/**
 * Get user's permission level for a playlist
 */
export function getPlaylistPermission(
  playlist: any,
  userId: string
): PlaylistPermission {
  // Convert to string to handle both string and ObjectId types
  const ownerId = playlist.ownerId?.toString() || playlist.ownerId;
  const playlistUserId = playlist.userId?.toString() || playlist.userId;
  
  // Check if user is the owner (check both ownerId and userId for backward compatibility)
  if (ownerId === userId || playlistUserId === userId) {
    return PlaylistPermission.OWNER;
  }
  
  // Check if user is a collaborator
  if (playlist.collaborators && playlist.collaborators.includes(userId)) {
    return PlaylistPermission.COLLABORATOR;
  }
  
  // Public playlists are viewable by anyone
  if (playlist.visibility === 'public') {
    return PlaylistPermission.FOLLOWER;
  }
  
  // Shared playlists are viewable by collaborators (already checked above)
  if (playlist.visibility === 'shared' && playlist.collaborators && playlist.collaborators.includes(userId)) {
    return PlaylistPermission.COLLABORATOR;
  }
  
  return PlaylistPermission.NONE;
}

/**
 * Middleware to check if user is the playlist owner
 */
export async function checkPlaylistOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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

    // Check if user is owner
    const ownerId = playlist.ownerId?.toString() || playlist.ownerId;
    const playlistUserId = playlist.userId?.toString() || playlist.userId;
    const isOwner = ownerId === userId || playlistUserId === userId;
    
    if (!isOwner) {
      res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Only the playlist owner can perform this action',
        },
      });
      return;
    }

    // Attach playlist to request for use in controller
    (req as any).playlist = playlist;
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to check playlist permissions',
        details: errorMessage,
      },
    });
  }
}

/**
 * Middleware to check if user is owner or collaborator
 */
export async function checkPlaylistCollaborator(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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

    // Attach playlist and permission info to request
    (req as any).playlist = playlist;
    (req as any).isOwner = isOwner;
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to check playlist permissions',
        details: errorMessage,
      },
    });
  }
}

/**
 * Middleware to check if user has access to view playlist
 */
export async function checkPlaylistAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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

    // Check access based on visibility and user relationship
    const ownerId = playlist.ownerId?.toString() || playlist.ownerId;
    const playlistUserId = playlist.userId?.toString() || playlist.userId;
    const isOwner = ownerId === userId || playlistUserId === userId;
    const isCollaborator = playlist.collaborators.includes(userId);
    const isPublic = playlist.visibility === 'public';
    const isShared = playlist.visibility === 'shared' && isCollaborator;

    if (!isOwner && !isCollaborator && !isPublic && !isShared) {
      res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have permission to view this playlist',
        },
      });
      return;
    }

    // Attach playlist and permission info to request
    (req as any).playlist = playlist;
    (req as any).permission = getPlaylistPermission(playlist, userId);
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to check playlist permissions',
        details: errorMessage,
      },
    });
  }
}
