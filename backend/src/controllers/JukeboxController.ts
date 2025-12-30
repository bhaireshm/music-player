import { Server, Socket } from 'socket.io';
import JukeboxSession from '../models/JukeboxSession';

export const initializeJukeboxSockets = (io: Server) => {
    const jukeboxNamespace = io.of('/jukebox');

    jukeboxNamespace.on('connection', (socket: Socket) => {
        console.log(`User connected to jukebox: ${socket.id}`);

        // Join a session
        socket.on('join_session', async ({ passcode, user }) => {
            try {
                const session = await JukeboxSession.findOne({ passcode, isActive: true });
                if (!session) {
                    socket.emit('error', { message: 'Session not found or inactive' });
                    return;
                }

                // Remove user from any other active sessions to enforce single-session rule
                const userId = user.id || socket.id;
                await JukeboxSession.updateMany(
                    {
                        passcode: { $ne: passcode }, // Not this session
                        isActive: true,
                        participants: userId
                    },
                    { $pull: { participants: userId } }
                );

                socket.join(passcode);

                // Add participant if not already there
                if (!session.participants.includes(userId)) {
                    session.participants.push(userId);
                    await session.save();
                }

                socket.emit('session_joined', session);
                jukeboxNamespace.to(passcode).emit('participant_joined', { user, count: session.participants.length });

                console.log(`User ${user.name || socket.id} joined session ${passcode}`);
            } catch (error) {
                console.error('Error joining session:', error);
                socket.emit('error', { message: 'Failed to join session' });
            }
        });

        // Create a session
        socket.on('create_session', async ({ hostId }) => {
            try {
                // First, deactivate any existing active sessions from this host
                await JukeboxSession.updateMany(
                    { hostId, isActive: true },
                    { $set: { isActive: false } }
                );

                // Generate a simple 4-digit passcode
                let passcode = Math.floor(1000 + Math.random() * 9000).toString();

                const newSession = new JukeboxSession({
                    passcode,
                    hostId,
                    participants: [hostId],
                    queue: []
                });

                await newSession.save();
                socket.join(passcode);

                socket.emit('session_created', newSession);
                console.log(`Session created: ${passcode} by ${hostId}`);
            } catch (error) {
                console.error('Error creating session:', error);
                socket.emit('error', { message: 'Failed to create session' });
            }
        });

        // Add song to queue
        socket.on('add_to_queue', async ({ passcode, song, user }) => {
            try {
                const session = await JukeboxSession.findOne({ passcode });
                if (!session) return;

                // Check if song is already in queue
                const existing = session.queue.find((item: any) => item.songId === song.id);
                if (existing) {
                    socket.emit('error', { message: 'Song already in queue' });
                    return;
                }

                const queueItem = {
                    songId: song.id,
                    title: song.title,
                    artist: song.artist,
                    coverUrl: song.albumArt,
                    addedBy: user.id || 'guest',
                    addedByName: user.name || 'Guest',
                    votes: [],
                    addedAt: new Date()
                };

                session.queue.push(queueItem);
                await session.save();

                // Broadcast updated queue
                jukeboxNamespace.to(passcode).emit('queue_updated', session.queue);
            } catch (error) {
                console.error('Error adding to queue:', error);
            }
        });

        // Vote on a song
        socket.on('vote_song', async ({ passcode, songId, userId }) => {
            try {
                const session = await JukeboxSession.findOne({ passcode });
                if (!session) return;

                const songIndex = session.queue.findIndex((s: any) => s.songId === songId);
                if (songIndex === -1) return;

                const song = session.queue[songIndex];
                const hasVoted = song.votes.includes(userId);

                if (hasVoted) {
                    // Remove vote (toggle off)
                    song.votes = song.votes.filter((id) => id !== userId);
                } else {
                    song.votes.push(userId);
                }

                // Re-sort queue: Descending votes, then addedAt
                session.queue.sort((a, b) => {
                    if (b.votes.length !== a.votes.length) {
                        return b.votes.length - a.votes.length;
                    }
                    return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
                });

                await session.save();
                jukeboxNamespace.to(passcode).emit('queue_updated', session.queue);

            } catch (error) {
                console.error('Error voting:', error);
            }
        });

        // --- Real-time Playback Sync ---

        // Host starts playing a song
        socket.on('play_song', async ({ passcode, song }) => {
            // Broadcast to all in room to play this song
            // Ideally we update session state too
            try {
                const session = await JukeboxSession.findOne({ passcode });
                if (session) {
                    session.currentSong = {
                        songId: song.id,
                        startedAt: new Date(),
                        pausedAt: undefined
                    };
                    await session.save();
                }
                jukeboxNamespace.to(passcode).emit('sync_play_song', song);
            } catch (e) { console.error(e); }
        });

        // Host pauses playback
        socket.on('pause_song', async ({ passcode }) => {
            jukeboxNamespace.to(passcode).emit('sync_pause_song');
        });

        // Host resumes playback
        socket.on('resume_song', async ({ passcode }) => {
            jukeboxNamespace.to(passcode).emit('sync_resume_song');
        });

        // Host seeks to time
        socket.on('seek_song', ({ passcode, time }) => {
            jukeboxNamespace.to(passcode).emit('sync_seek_song', time);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected', socket.id);
        });
    });
};
