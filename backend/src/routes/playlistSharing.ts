import { Router, type Router as RouterType } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  updateVisibility,
  addCollaborator,
  removeCollaborator,
  followPlaylist,
  unfollowPlaylist,
  getPublicPlaylists,
  getDiscoverPlaylists,
  generateShareLink,
} from '../controllers/playlistSharingController';

const router: RouterType = Router();

// Public playlists routes (must come before :id routes)
router.get('/public', verifyToken, getPublicPlaylists);
router.get('/discover', verifyToken, getDiscoverPlaylists);

// Playlist visibility management (owner only)
router.put('/:id/visibility', verifyToken, updateVisibility);

// Collaborator management (owner only)
router.post('/:id/collaborators', verifyToken, addCollaborator);
router.delete('/:id/collaborators/:collaboratorId', verifyToken, removeCollaborator);

// Follow/unfollow playlists
router.post('/:id/follow', verifyToken, followPlaylist);
router.delete('/:id/follow', verifyToken, unfollowPlaylist);

// Share link generation
router.get('/:id/share-link', verifyToken, generateShareLink);

export default router;
