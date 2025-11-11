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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
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
