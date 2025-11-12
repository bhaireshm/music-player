'use client';

import { useState, useEffect } from 'react';
import { getSongs, Song } from '@/lib/api';
import AudioPlayer from '@/components/AudioPlayer';
import UploadForm from '@/components/UploadForm';
import ProtectedRoute from '@/components/ProtectedRoute';

function LibraryPageContent() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Fetch songs on component mount
  useEffect(() => {
    fetchSongs();
  }, []);

  /**
   * Fetch all songs from the backend
   */
  const fetchSongs = async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedSongs = await getSongs();
      setSongs(fetchedSongs);
    } catch (err) {
      setError('Failed to load songs. Please try again.');
      console.error('Error fetching songs:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle song selection for playback
   */
  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
  };

  /**
   * Handle successful upload - refresh the song list
   */
  const handleUploadSuccess = () => {
    fetchSongs();
    setShowUploadForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">My Library</h1>
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              {showUploadForm ? 'Hide Upload' : 'Upload Song'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Form */}
        {showUploadForm && (
          <div className="mb-8">
            <UploadForm onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>{error}</p>
            <button
              onClick={fetchSongs}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && songs.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No songs</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading your first song.
            </p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              Upload Song
            </button>
          </div>
        )}

        {/* Song List */}
        {!loading && !error && songs.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                All Songs ({songs.length})
              </h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {songs.map((song) => (
                <li
                  key={song.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                    currentSong?.id === song.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-900 truncate">
                        {song.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {song.artist}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePlaySong(song)}
                      className={`ml-4 flex-shrink-0 p-2 rounded-full transition-colors ${
                        currentSong?.id === song.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      aria-label={`Play ${song.title}`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Audio Player */}
      <AudioPlayer song={currentSong} />
    </div>
  );
}


export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <LibraryPageContent />
    </ProtectedRoute>
  );
}
