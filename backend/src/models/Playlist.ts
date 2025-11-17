import { Schema, model, Document, Types } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  userId: string; // Firebase UID (kept for backward compatibility)
  ownerId: string; // Firebase UID of the owner
  visibility: 'private' | 'shared' | 'public';
  collaborators: string[]; // Array of Firebase UIDs
  followers: string[]; // Array of Firebase UIDs
  songIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new Schema<IPlaylist>({
  name: {
    type: String,
    required: true,
  },
  userId: {
    type: String, // Firebase UID (kept for backward compatibility)
    required: true,
  },
  ownerId: {
    type: String, // Firebase UID of the owner
    required: true,
  },
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private',
  },
  collaborators: [{
    type: String, // Firebase UIDs
  }],
  followers: [{
    type: String, // Firebase UIDs
  }],
  songIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Song',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add compound index for search optimization
playlistSchema.index({ name: 1, userId: 1 });
// Add indexes for sharing features
playlistSchema.index({ visibility: 1 });
playlistSchema.index({ ownerId: 1 });
playlistSchema.index({ visibility: 1, createdAt: -1 });
playlistSchema.index({ followers: 1 });

export const Playlist = model<IPlaylist>('Playlist', playlistSchema);
