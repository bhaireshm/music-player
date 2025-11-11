import admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK
 * Configures service account credentials from environment variables
 */
function initializeFirebase(): admin.app.App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error(
      'Missing Firebase configuration. Ensure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL are set.'
    );
  }

  // Replace escaped newlines in private key (common when stored in env vars)
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: formattedPrivateKey,
        clientEmail,
      }),
    });

    console.log('Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

// Initialize and export the admin instance
export const firebaseAdmin = initializeFirebase();

// Export auth instance for token verification
export const auth = firebaseAdmin.auth();
