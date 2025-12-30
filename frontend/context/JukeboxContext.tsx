'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Song } from '@/lib/api';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { notifications } from '@mantine/notifications';

// Types
interface JukeboxSession {
    passcode: string;
    hostId: string;
    queue: Array<{
        songId: string;
        addedBy: string;
        votes: string[];
        addedAt: Date;
        song?: Song; // Hydrated song data if needed, or we fetch it
    }>;
    currentSong?: {
        songId: string;
        startedAt: Date;
        pausedAt?: Date;
    };
    participants: string[];
}

interface JukeboxContextType {
    socket: Socket | null;
    session: JukeboxSession | null;
    isConnected: boolean;
    joinSession: (passcode: string, user: { id: string; name: string }) => void;
    createSession: (hostId: string) => void;
    addToQueue: (passcode: string, song: Song, user: { id: string; name: string }) => void;
    voteSong: (passcode: string, songId: string, userId: string) => void;
    leaveSession: () => void;
    // Host Controls
    playSong: (passcode: string, song: Song) => void;
    pauseSong: (passcode: string) => void;
    resumeSong: (passcode: string) => void;
    seekSong: (passcode: string, time: number) => void;
}

const JukeboxContext = createContext<JukeboxContextType | undefined>(undefined);

export function JukeboxProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [session, setSession] = useState<JukeboxSession | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const audioPlayer = useAudioPlayerContext();

    // Initialize Socket
    useEffect(() => {
        // In production, this URL needs to be dynamic or env var
        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const socketInstance = io(`${socketUrl}/jukebox`, {
            autoConnect: false,
        });

        setSocket(socketInstance);

        socketInstance.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to Jukebox Socket');
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
            console.log('Disconnected from Jukebox Socket');
        });

        socketInstance.on('error', (err: { message: string }) => {
            notifications.show({
                title: 'Error',
                message: err.message,
                color: 'red',
            });
        });

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    // Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('session_created', (newSession: JukeboxSession) => {
            setSession(newSession);
            notifications.show({
                title: 'Session Created',
                message: `Code: ${newSession.passcode}`,
                color: 'green',
            });
            // Navigate to session URL
            if (typeof window !== 'undefined') {
                window.location.href = `/jukebox/${newSession.passcode}`;
            }
        });

        socket.on('session_joined', (joinedSession: JukeboxSession) => {
            setSession(joinedSession);
            notifications.show({
                title: 'Joined Party',
                message: 'Successfully joined the party box!',
                color: 'green',
            });
        });

        socket.on('participant_joined', ({ user, count }) => {
            // Update participant count or show notification
            // notifications.show({ title: 'New User', message: `${user.name} joined!` });
        });

        socket.on('queue_updated', (updatedQueue: any[]) => {
            setSession((prev) => prev ? { ...prev, queue: updatedQueue } : null);
        });

        // --- Sync Playback Listeners ---
        socket.on('sync_play_song', async (song: Song) => {
            console.log('Received sync_play_song', song);
            // Force load and play
            // We might want to check if it's already the current song to avoid reload
            if (audioPlayer.currentSong?.id === song.id) {
                if (!audioPlayer.isPlaying) audioPlayer.play();
            } else {
                audioPlayer.loadSong(song);
                // loadSong is async but doesn't return promise in the interface we drafted? 
                // Actually useAudioPlayer implementation defines it as async but return type might mask it.
                // We can assume load generally auto-plays or we wait a bit?
                // In useAudioPlayer, loadSong calls play if autoplay logic fits, but let's be explicit
                setTimeout(() => audioPlayer.play(), 500); // Simple delay to ensure load starts
            }
        });

        socket.on('sync_pause_song', () => {
            audioPlayer.pause();
        });

        socket.on('sync_resume_song', () => {
            audioPlayer.play();
        });

        socket.on('sync_seek_song', (time: number) => {
            audioPlayer.seek(time);
        });

        return () => {
            socket.off('session_created');
            socket.off('session_joined');
            socket.off('participant_joined');
            socket.off('queue_updated');
            socket.off('sync_play_song');
            socket.off('sync_pause_song');
            socket.off('sync_resume_song');
            socket.off('sync_seek_song');
        };
    }, [socket, audioPlayer]);

    // Restore session from localStorage on mount
    useEffect(() => {
        const storedSession = localStorage.getItem('jukebox_session');
        const storedUserId = localStorage.getItem('jukebox_user_id');
        const storedUserName = localStorage.getItem('jukebox_user_name');

        if (storedSession && storedUserId && socket && !session) {
            try {
                const sessionData = JSON.parse(storedSession);
                // Reconnect to the session
                socket.connect();
                socket.emit('join_session', {
                    passcode: sessionData.passcode,
                    user: { id: storedUserId, name: storedUserName || 'Guest' }
                });
            } catch (e) {
                console.error('Failed to restore session:', e);
                localStorage.removeItem('jukebox_session');
            }
        }
    }, [socket, session]);

    // Save session to localStorage when it changes
    useEffect(() => {
        if (session) {
            localStorage.setItem('jukebox_session', JSON.stringify({ passcode: session.passcode, hostId: session.hostId }));
        } else {
            localStorage.removeItem('jukebox_session');
        }
    }, [session]);

    const joinSession = (passcode: string, user: { id: string; name: string }) => {
        if (!socket) return;
        // Leave current session first if already in one
        if (session) {
            socket.disconnect();
        }
        // Save user info for session restoration
        localStorage.setItem('jukebox_user_id', user.id);
        localStorage.setItem('jukebox_user_name', user.name);
        socket.connect();
        socket.emit('join_session', { passcode, user });
    };

    const createSession = (hostId: string) => {
        if (!socket) return;
        // Leave current session first if already in one
        if (session) {
            socket.disconnect();
        }
        // Save host info for session restoration
        localStorage.setItem('jukebox_user_id', hostId);
        localStorage.setItem('jukebox_user_name', 'Host');
        socket.connect();
        socket.emit('create_session', { hostId });
    };

    const addToQueue = (passcode: string, song: Song, user: { id: string; name: string }) => {
        if (!socket) return;
        socket.emit('add_to_queue', { passcode, song, user });
    };

    const voteSong = (passcode: string, songId: string, userId: string) => {
        if (!socket) return;
        socket.emit('vote_song', { passcode, songId, userId });
    };

    const leaveSession = () => {
        if (socket) {
            socket.disconnect();
            setSession(null);
            // Clear session data from localStorage
            localStorage.removeItem('jukebox_session');
            localStorage.removeItem('jukebox_user_id');
            localStorage.removeItem('jukebox_user_name');
        }
    };

    // Host Controls
    const playSong = (passcode: string, song: Song) => {
        socket?.emit('play_song', { passcode, song });
    };

    const pauseSong = (passcode: string) => {
        socket?.emit('pause_song', { passcode });
    };

    const resumeSong = (passcode: string) => {
        socket?.emit('resume_song', { passcode });
    };

    const seekSong = (passcode: string, time: number) => {
        socket?.emit('seek_song', { passcode, time });
    };

    return (
        <JukeboxContext.Provider
            value={{
                socket,
                session,
                isConnected,
                joinSession,
                createSession,
                addToQueue,
                voteSong,
                leaveSession,
                playSong,
                pauseSong,
                resumeSong,
                seekSong
            }}
        >
            {children}
        </JukeboxContext.Provider>
    );
}

export function useJukebox() {
    const context = useContext(JukeboxContext);
    if (!context) {
        throw new Error('useJukebox must be used within JukeboxProvider');
    }
    return context;
}
