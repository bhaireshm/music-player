import { Schema, model, Document, Types } from 'mongoose';

export interface ISong extends Document {
  title: string;
  artist: string;
  album?: string;
  year?: number;
  genre?: string[];
  fileKey: string;
  mimeType: string;
  uploadedBy: string; // Firebase UID
  fingerprint: string;
  createdAt: Date;
}

const songSchema = new Schema<ISong>({
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: String,
    required: true,
  },
  album: {
    type: String,
    required: false,
  },
  year: {
    type: Number,
    required: false,
  },
  genre: {
    type: [String],
    required: false,
  },
  fileKey: {
    type: String,
    required: true,
    unique: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: String, // Firebase UID
    required: true,
  },
  fingerprint: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Song = model<ISong>('Song', songSchema);
