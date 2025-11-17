import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';

/**
 * GET /users/me/settings
 * Get current user settings
 */
export async function getUserSettings(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;

    // Find user
    const user = await User.findOne({ uid: userId });

    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // Return user settings
    res.status(200).json({
      settings: {
        theme: user.preferences?.theme || 'system',
        language: user.preferences?.language || 'en',
        notifications: user.preferences?.notifications !== false,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch user settings',
        details: errorMessage,
      },
    });
  }
}

/**
 * PUT /users/me/settings
 * Update current user settings
 */
export async function updateUserSettings(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const { theme, language, notifications } = req.body;

    // Validate theme
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      res.status(400).json({
        error: {
          code: 'INVALID_THEME',
          message: 'Theme must be light, dark, or system',
        },
      });
      return;
    }

    // Find and update user
    const user = await User.findOne({ uid: userId });

    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    // Update preferences
    if (!user.preferences) {
      user.preferences = {};
    }

    if (theme !== undefined) user.preferences.theme = theme;
    if (language !== undefined) user.preferences.language = language;
    if (notifications !== undefined) user.preferences.notifications = notifications;
    user.updatedAt = new Date();

    await user.save();

    // Return updated settings
    res.status(200).json({
      settings: {
        theme: user.preferences.theme || 'system',
        language: user.preferences.language || 'en',
        notifications: user.preferences.notifications !== false,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update user settings',
        details: errorMessage,
      },
    });
  }
}
