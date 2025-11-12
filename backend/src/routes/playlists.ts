import { Router, type Router as RouterType } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  getPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
} from '../controllers/playlistController';

const router: RouterType = Router();

// GET /playlists - Get all playlists for authenticated user
router.get('/', verifyToken, getPlaylists);

// GET /playlists/:id - Get a single playlist with populated songs
router.get('/:id', verifyToken, getPlaylist);

// POST /playlists - Create a new playlist
router.post('/', verifyToken, createPlaylist);

// PUT /playlists/:id - Update playlist songs
router.put('/:id', verifyToken, updatePlaylist);

// DELETE /playlists/:id - Delete a playlist
router.delete('/:id', verifyToken, deletePlaylist);

export default router;
