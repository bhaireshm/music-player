'use client';

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { uploadSong, ApiError } from '@/lib/api';

interface UploadFormProps {
  onUploadSuccess?: () => void;
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supported audio MIME types
  const SUPPORTED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/ogg',
    'audio/flac',
    'audio/aac',
    'audio/m4a',
    'audio/x-m4a',
  ];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setSuccess(false);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (!SUPPORTED_AUDIO_TYPES.includes(selectedFile.type)) {
      setError(
        'Invalid file type. Please upload an audio file (MP3, WAV, OGG, FLAC, AAC, M4A).'
      );
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate form
    if (!file) {
      setError('Please select an audio file to upload.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a song title.');
      return;
    }

    if (!artist.trim()) {
      setError('Please enter an artist name.');
      return;
    }

    // Start upload
    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadSong(file, title.trim(), artist.trim(), (progress) => {
        setUploadProgress(Math.round(progress));
      });

      // Upload successful
      setSuccess(true);
      setTitle('');
      setArtist('');
      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Call success callback to refresh library
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      // Handle errors
      if (err instanceof ApiError) {
        if (err.code === 'DUPLICATE_SONG') {
          setError(
            'This song has already been uploaded. Duplicate detected based on audio fingerprint.'
          );
        } else {
          setError(err.message || 'Failed to upload song. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Song</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Input */}
        <div>
          <label
            htmlFor="file"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Audio File *
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="file"
            accept="audio/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Title Input */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Song Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading}
            placeholder="Enter song title"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:ring-blue-500 focus:border-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Artist Input */}
        <div>
          <label
            htmlFor="artist"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Artist *
          </label>
          <input
            type="text"
            id="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            disabled={isUploading}
            placeholder="Enter artist name"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:ring-blue-500 focus:border-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <p className="text-sm">Song uploaded successfully!</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading || !file}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload Song'}
        </button>
      </form>
    </div>
  );
}
