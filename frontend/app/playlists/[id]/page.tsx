'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPlaylist, getSongs, updatePlaylist, Song, Playlist } from '@/lib/api';
import AudioPlayer from '@/components/AudioPlayer';
import ProtectedRoute from '@/components/ProtectedRoute';

function PlaylistDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  /**
   * Fetch playlist and all available songs
   */
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [playlistData, songsData] = await Promise.all([
        getPlaylist(playlistId),
        getSongs(),
      ]);
      setPlaylist(playlistData);
      setAllSongs(songsData);
    } catch (err) {
      setError('Failed to load playlist. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch playlist and all songs on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  /**
   * Get songs in the playlist
   */
  const getPlaylistSongs = (): Song[] => {
    if (!playlist) return [];
    
    // Check if songIds are populated with Song objects
    if (playlist.songIds.length > 0 && typeof playlist.songIds[0] === 'object') {
      return playlist.songIds as Song[];
    }
    
    return [];
  };

  /**
   * Get songs not in the playlist
   */
  const getAvailableSongs = (): Song[] => {
    const playlistSongs = getPlaylistSongs();
    const playlistSongIds = playlistSongs.map(s => s.id);
    return allSongs.filter(song => !playlistSongIds.includes(song.id));
  };

  /**
   * Add a song to the playlist
   */
  const handleAddSong = async (songId: string) => {
    if (!playlist) return;

    setUpdating(true);
    try {
      const playlistSongs = getPlaylistSongs();
      const currentSongIds = playlistSongs.map(s => s.id);
      const updatedSongIds = [...currentSongIds, songId];
      
      const updatedPlaylist = await updatePlaylist(playlist.id, updatedSongIds);
      setPlaylist(updatedPlaylist);
      setShowAddSongModal(false);
    } catch (err) {
      console.error('Error adding song:', err);
      alert('Failed to add song to playlist');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Remove a song from the playlist
   */
  const handleRemoveSong = async (songId: string) => {
    if (!playlist) return;

    setUpdating(true);
    try {
      const playlistSongs = getPlaylistSongs();
      const currentSongIds = playlistSongs.map(s => s.id);
      const updatedSongIds = currentSongIds.filter(id => id !== songId);
      
      const updatedPlaylist = await updatePlaylist(playlist.id, updatedSongIds);
      setPlaylist(updatedPlaylist);
      
      // If the removed song was playing, stop it
      if (currentSong?.id === songId) {
        setCurrentSong(null);
      }
    } catch (err) {
      console.error('Error removing song:', err);
      alert('Failed to remove song from playlist');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Play a song from the playlist
   */
  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
  };

  const playlistSongs = getPlaylistSongs();
  const availableSongs = getAvailableSongs();

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/playlists')}
              className="text-gray-600 hover:text-gray-900"
              aria-label="Back to playlists"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {playlist?.name || 'Loading...'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
              </p>
            </div>
            <button
              onClick={() => setShowAddSongModal(true)}
              disabled={updating || availableSongs.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Song
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              onClick={fetchData}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && playlistSongs.length === 0 && (
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No songs in playlist</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add songs to start building your playlist.
            </p>
            {availableSongs.length > 0 && (
              <button
                onClick={() => setShowAddSongModal(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors"
              >
                Add Song
              </button>
            )}
          </div>
        )}

        {/* Song List */}
        {!loading && !error && playlistSongs.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {playlistSongs.map((song, index) => (
                <li
                  key={song.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                    currentSong?.id === song.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-gray-400 font-medium w-8 text-center">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-gray-900 truncate">
                          {song.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {song.artist}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handlePlaySong(song)}
                        className={`flex-shrink-0 p-2 rounded-full transition-colors ${
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
                      <button
                        onClick={() => handleRemoveSong(song.id)}
                        disabled={updating}
                        className="flex-shrink-0 p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Remove ${song.title}`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Add Song Modal */}
      {showAddSongModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Add Song to Playlist</h2>
              <button
                onClick={() => setShowAddSongModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-8rem)]">
              {availableSongs.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <p>All songs have been added to this playlist.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {availableSongs.map((song) => (
                    <li
                      key={song.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
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
                          onClick={() => handleAddSong(song.id)}
                          disabled={updating}
                          className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {updating ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audio Player */}
      <AudioPlayer song={currentSong} />
    </div>
  );
}


export default function PlaylistDetailPage() {
  return (
    <ProtectedRoute>
      <PlaylistDetailPageContent />
    </ProtectedRoute>
  );
}
