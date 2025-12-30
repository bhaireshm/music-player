import mongoose, { Schema, Document } from 'mongoose';

export interface IJukeboxSession extends Document {
    passcode: string;
    hostId: string; // The user who started the session
    isActive: boolean;
    currentSong: {
        songId: string;
        startedAt: Date;
        pausedAt?: Date;
    } | null;
    queue: Array<{
        songId: string;
        title?: string;
        artist?: string;
        coverUrl?: string;
        addedBy: string; // userId or 'guest'
        votes: string[]; // array of userIds who voted
        addedAt: Date;
    }>;
    participants: string[]; // List of socketIds or userIds
    createdAt: Date;
    updatedAt: Date;
}

const JukeboxSessionSchema: Schema = new Schema(
    {
        passcode: { type: String, required: true, unique: true },
        hostId: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        currentSong: {
            songId: { type: String },
            startedAt: { type: Date },
            pausedAt: { type: Date },
        },
        queue: [
            {
                songId: { type: String, required: true },
                title: { type: String },
                artist: { type: String },
                coverUrl: { type: String },
                addedBy: { type: String, required: true },
                addedByName: { type: String },
                votes: [{ type: String }],
                addedAt: { type: Date, default: Date.now },
            },
        ],
        participants: [{ type: String }],
    },
    { timestamps: true }
);

// Auto-remove sessions older than 24h
JukeboxSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model<IJukeboxSession>('JukeboxSession', JukeboxSessionSchema);
