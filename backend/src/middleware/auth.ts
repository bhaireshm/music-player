import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

/**
 * Extended Request interface to include userId
 */
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Authentication middleware to verify Firebase ID tokens
 * Extracts token from Authorization header, verifies it using Firebase Admin SDK,
 * and attaches userId to request object on success
 */
export async function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'No authentication token provided',
        },
      });
      return;
    }

    // Extract the token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    // Verify token using Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);

    // Attach userId to request object
    req.userId = decodedToken.uid;

    // Proceed to next middleware/handler
    next();
  } catch (error) {
    // Handle token verification errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(401).json({
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid or expired authentication token',
        details: errorMessage,
      },
    });
  }
}
