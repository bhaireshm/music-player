import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signUp as firebaseSignUp, signIn as firebaseSignIn, signOut as firebaseSignOut } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;

/**
 * Custom hook to manage authentication state and operations
 * Tracks current user, loading state, and handles authentication errors
 * 
 * @returns {UseAuthReturn} Authentication state and action functions
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (authError) => {
        console.error('Auth state change error:', authError);
        setError(authError.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Sign up a new user with email and password
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @throws {Error} If sign up fails
   */
  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignUp(email, password);
      // User state will be updated by onAuthStateChanged
    } catch (err: unknown) {
      let errorMessage = 'Failed to sign up';
      const error = err as { code?: string; message?: string };
      
      // Handle Firebase-specific error codes
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists. Please sign in instead.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address format.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled. Please contact support.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please use a stronger password.';
            break;
          default:
            errorMessage = error.message || 'Failed to sign up';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      console.error('Sign up error:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in an existing user with email and password
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @throws {Error} If sign in fails
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignIn(email, password);
      // User state will be updated by onAuthStateChanged
    } catch (err: unknown) {
      let errorMessage = 'Failed to sign in';
      const error = err as { code?: string; message?: string };
      
      // Handle Firebase-specific error codes
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email. Please sign up first.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address format.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please check your credentials.';
            break;
          default:
            errorMessage = error.message || 'Failed to sign in';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      console.error('Sign in error:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out the current user
   * 
   * @throws {Error} If sign out fails
   */
  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignOut();
      // User state will be updated by onAuthStateChanged
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
  };
}
