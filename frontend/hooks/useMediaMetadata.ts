import { useEffect } from 'react';
import { Song } from '@/lib/api';

interface MediaMetadata {
    title: string;
    artist: string;
    album?: string;
    artwork?: Array<{
        src: string;
        sizes: string;
        type: string;
    }>;
}

/**
 * Hook to update document title and media session metadata when song changes
 */
export function useMediaMetadata(currentSong: Song | null, isPlaying: boolean) {
    useEffect(() => {
        if (currentSong) {
            // Update document title
            const songInfo = `${currentSong.title} - ${currentSong.artist}`;
            document.title = isPlaying
                ? `▶️ ${songInfo} | Naada Music`
                : `⏸️ ${songInfo} | Naada Music`;

            // Update meta description
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute(
                    'content',
                    `Now playing: ${currentSong.title} by ${currentSong.artist}${currentSong.album ? ` from ${currentSong.album}` : ''}`
                );
            }

            // Update Open Graph tags for social sharing
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) {
                ogTitle.setAttribute('content', songInfo);
            }

            const ogDescription = document.querySelector('meta[property="og:description"]');
            if (ogDescription) {
                ogDescription.setAttribute(
                    'content',
                    `Listening to ${currentSong.title} by ${currentSong.artist} on Naada Music`
                );
            }

            // Update Media Session API for system media controls (mobile notification, lock screen, etc.)
            if ('mediaSession' in navigator) {
                const metadata: MediaMetadata = {
                    title: currentSong.title,
                    artist: currentSong.artist,
                    album: currentSong.album || 'Unknown Album',
                };

                // Add artwork if available
                if (currentSong.albumArt) {
                    metadata.artwork = [
                        {
                            src: currentSong.albumArt,
                            sizes: '512x512',
                            type: 'image/jpeg',
                        },
                        {
                            src: currentSong.albumArt,
                            sizes: '256x256',
                            type: 'image/jpeg',
                        },
                        {
                            src: currentSong.albumArt,
                            sizes: '128x128',
                            type: 'image/jpeg',
                        },
                    ];
                }

                navigator.mediaSession.metadata = new window.MediaMetadata(metadata);
            }
        } else {
            // Reset to default when no song is playing
            document.title = 'Naada Music - Your Personal Music Library';

            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute(
                    'content',
                    'Stream your personal music library with Naada Music'
                );
            }
        }
    }, [currentSong, isPlaying]);
}

/**
 * Hook to set up Media Session API action handlers
 */
export function useMediaSessionActions(
    play: () => void,
    pause: () => void,
    next: () => void,
    previous: () => void,
    seek: (time: number) => void
) {
    useEffect(() => {
        if ('mediaSession' in navigator) {
            // Play/Pause handlers
            navigator.mediaSession.setActionHandler('play', () => {
                play();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                pause();
            });

            // Next/Previous handlers
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                next();
            });

            navigator.mediaSession.setActionHandler('previoustrack', () => {
                previous();
            });

            // Seek handlers (if supported)
            try {
                navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                    const skipTime = details.seekOffset || 10;
                    const audio = document.querySelector('audio');
                    if (audio) {
                        seek(Math.max(0, audio.currentTime - skipTime));
                    }
                });

                navigator.mediaSession.setActionHandler('seekforward', (details) => {
                    const skipTime = details.seekOffset || 10;
                    const audio = document.querySelector('audio');
                    if (audio) {
                        seek(Math.min(audio.duration, audio.currentTime + skipTime));
                    }
                });

                navigator.mediaSession.setActionHandler('seekto', (details) => {
                    if (details.seekTime !== null && details.seekTime !== undefined) {
                        seek(details.seekTime);
                    }
                });
            } catch (error) {
                // Seek actions not supported, ignore
                console.log('Media Session seek actions not supported');
            }

            // Cleanup on unmount
            return () => {
                navigator.mediaSession.setActionHandler('play', null);
                navigator.mediaSession.setActionHandler('pause', null);
                navigator.mediaSession.setActionHandler('nexttrack', null);
                navigator.mediaSession.setActionHandler('previoustrack', null);
                try {
                    navigator.mediaSession.setActionHandler('seekbackward', null);
                    navigator.mediaSession.setActionHandler('seekforward', null);
                    navigator.mediaSession.setActionHandler('seekto', null);
                } catch (error) {
                    // Ignore if not supported
                }
            };
        }
    }, [play, pause, next, previous, seek]);
}

/**
 * Hook to update Media Session playback state
 */
export function useMediaSessionPlaybackState(isPlaying: boolean) {
    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        }
    }, [isPlaying]);
}
