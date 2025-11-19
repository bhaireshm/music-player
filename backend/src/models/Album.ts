import mongoose, { Schema, Document } from 'mongoose';

export interface IAlbum extends Document {
  artist: string;
  album: string;
  year?: string;
  genre?: string;
  albumArt?: string;
  uploadedBy: string;
  songIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AlbumSchema: Schema = new Schema(
  {
    artist: { type: String, required: true },
    album: { type: String, required: true },
    year: { type: String },
    genre: { type: String },
    albumArt: { type: String },
    uploadedBy: { type: String, required: true },
    songIds: [{ type: Schema.Types.ObjectId, ref: 'Song' }],
  },
  {
    timestamps: true,
  }
);

// Compound index for unique albums per user
AlbumSchema.index({ artist: 1, album: 1, uploadedBy: 1 }, { unique: true });

export const Album = mongoose.model<IAlbum>('Album', AlbumSchema);
