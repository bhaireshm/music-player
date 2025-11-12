'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Navigation component with links to main pages and user authentication display
 * Shows current user email and logout button when authenticated
 */
export default function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-xl font-bold text-zinc-900 dark:text-zinc-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Music Player
            </Link>
            
            {user && (
              <div className="hidden md:flex space-x-4">
                <Link
                  href="/library"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/library')
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  Library
                </Link>
                <Link
                  href="/playlists"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/playlists')
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  Playlists
                </Link>
              </div>
            )}
          </div>

          {/* User info and logout */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-zinc-600 dark:text-zinc-400 hidden sm:block">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        {user && (
          <div className="md:hidden pb-3 flex space-x-2">
            <Link
              href="/library"
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium text-center transition-colors ${
                isActive('/library')
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              Library
            </Link>
            <Link
              href="/playlists"
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium text-center transition-colors ${
                isActive('/playlists')
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              Playlists
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
