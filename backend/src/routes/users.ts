import { Router, type Router as RouterType } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  getUserProfile,
  updateUserProfile,
  getUserById,
  searchUsers,
} from '../controllers/userController';
import {
  getUserSettings,
  updateUserSettings,
} from '../controllers/userSettingsController';

const router: RouterType = Router();

// User search (must come before /me routes)
router.get('/search', verifyToken, searchUsers);

// Current user profile
router.get('/me', verifyToken, getUserProfile);
router.put('/me', verifyToken, updateUserProfile);

// Current user settings
router.get('/me/settings', verifyToken, getUserSettings);
router.put('/me/settings', verifyToken, updateUserSettings);

// Public user info
router.get('/:id', verifyToken, getUserById);

export default router;
