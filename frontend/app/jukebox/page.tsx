'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Paper,
    Text,
    TextInput,
    Button,
    Stack,
    Group,
    Title,
    Avatar,
    ActionIcon,
    Modal,
    Badge,
    Card,
    Image,
    Progress,
    Loader,
    Center
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
    IconMusic,
    IconPlayerPlay,
    IconPlayerPause,
    IconPlayerSkipForward,
    IconThumbUp,
    IconPlus,
    IconUsers,
    IconLogout,
    IconSearch,
    IconDeviceSpeaker
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
// Hooks
import { useJukebox } from '@/context/JukeboxContext';
import { useSearch } from '@/contexts/SearchContext';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { useAuth } from '@/hooks/useAuth';
// Components
import SearchResultItem from '@/components/SearchResultItem';
// Types
import { Song } from '@/lib/api';

// --- Sub-components ---

function JukeboxLanding() {
    const { joinSession, createSession, session } = useJukebox();
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            passcode: '',
            username: '',
        },
        validate: {
            passcode: (value) => (value.length === 4 ? null : 'Code must be 4 digits'),
            username: (value) => (value.length < 2 ? 'Name too short' : null),
        },
    });

    const handleJoin = async (values: { passcode: string; username: string }) => {
        setLoading(true);
        // Use user UID if available, otherwise fallback to guest ID
        const guestId = user?.uid || `guest_${Math.random().toString(36).substring(2, 9)}`;
        joinSession(values.passcode, { id: guestId, name: values.username });
        // Navigate to session URL
        router.push(`/jukebox/${values.passcode}`);
        setLoading(false);
    };

    const handleCreate = () => {
        if (!user) {
            notifications.show({
                message: 'You must be logged in to create a party',
                color: 'red'
            });
            return;
        }
        setLoading(true);
        createSession(user.uid);
        setLoading(false);
    };

    // When session is created, navigate to its URL
    useEffect(() => {
        if (session && session.passcode) {
            router.push(`/jukebox/${session.passcode}`);
        }
    }, [session, router]);

    return (
        <Container size="xs" py={80}>
            <Paper p="xl" radius="md" withBorder>
                <Stack align="center" gap="lg">
                    <Avatar color="blue" radius="xl" size="lg">
                        <IconDeviceSpeaker size={30} />
                    </Avatar>
                    <Title order={2}>Join the Party</Title>
                    <Text c="dimmed" ta="center">
                        Enter the 4-digit code to join an existing session or start your own party box.
                    </Text>

                    <form onSubmit={form.onSubmit(handleJoin)} style={{ width: '100%' }}>
                        <Stack>
                            <TextInput
                                placeholder="Your Name"
                                {...form.getInputProps('username')}
                            />
                            <TextInput
                                placeholder="0000"
                                maxLength={4}
                                size="xl"
                                styles={{ input: { textAlign: 'center', letterSpacing: '0.5em', fontSize: '24px' } }}
                                {...form.getInputProps('passcode')}
                            />
                            <Button type="submit" size="lg" loading={loading}>
                                Join Session
                            </Button>
                        </Stack>
                    </form>

                    <Text size="sm">or</Text>

                    <Button variant="light" onClick={handleCreate} loading={loading}>
                        Create New Party
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}

function JukeboxSearchModal({ opened, onClose, passcode }: { opened: boolean; onClose: () => void; passcode: string }) {
    const { query, setQuery, results, isLoading, performSearch } = useSearch();
    const { addToQueue } = useJukebox();

    const handleSearch = (val: string) => {
        setQuery(val);
        performSearch(val);
    };

    const handleAdd = (songResult: any) => {
        // Cast or map SongResult to Song
        // We need: id, title, artist, coverUrl
        // SongResult has: id, title, artist, album
        // We might be missing coverUrl in SongResult if it's not mapped there.
        // Assuming SongResult has what we need or we accept basic info.
        const song: Song = {
            id: songResult.id,
            title: songResult.title,
            artist: songResult.artist,
            albumArt: songResult.coverUrl || songResult.albumArt || '', // Fallback
            // Mongoose/Song fields
            album: songResult.album || '',
            duration: 0,
            mimeType: 'audio/mpeg',
            createdAt: new Date().toISOString(),
        };

        // Use guest ID if we don't have user tracked in context yet
        const userId = localStorage.getItem('jukebox_user_id') || 'guest';
        const userName = 'Guest';

        addToQueue(passcode, song, { id: userId, name: userName });
        notifications.show({ message: `Added ${song.title} to queue`, color: 'green' });
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Add Songs" size="lg">
            <TextInput
                placeholder="Search songs..."
                leftSection={<IconSearch size={16} />}
                value={query}
                onChange={(e) => handleSearch(e.currentTarget.value)}
                mb="md"
            />
            {isLoading && <Center><Loader /></Center>}
            {results?.results.songs.map((song) => (
                <SearchResultItem
                    key={song.id}
                    result={song}
                    type="song"
                    onClick={() => handleAdd(song)}
                />
            ))}
        </Modal>
    );
}

function JukeboxParty() {
    const { session, leaveSession, voteSong, playSong, pauseSong, resumeSong } = useJukebox();
    const { currentSong, isPlaying, duration, currentTime } = useAudioPlayerContext(); // Local player state
    const [searchOpened, setSearchOpened] = useState(false);

    if (!session) return null;

    const handleVote = (songId: string) => {
        const userId = localStorage.getItem('jukebox_user_id') || `user_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('jukebox_user_id', userId);
        voteSong(session.passcode, songId, userId);
    };

    const formatTime = (seconds: number) => {
        if (!seconds || Number.isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Container size="md" py="xl">
            <Stack gap="xl">
                {/* Header */}
                <Paper p="md" withBorder radius="md">
                    <Group justify="space-between">
                        <Group>
                            <IconMusic size={24} color="var(--mantine-color-blue-6)" />
                            <Title order={3}>Party Box</Title>
                            <Badge size="xl" variant="light" color="blue" styles={{ root: { fontSize: '1.2rem', padding: '1rem' } }}>
                                {session.passcode}
                            </Badge>
                        </Group>
                        <Group>
                            <Badge leftSection={<IconUsers size={14} />}>{session.participants.length} Active</Badge>
                            <Button variant="subtle" color="red" leftSection={<IconLogout size={16} />} onClick={leaveSession}>
                                Leave
                            </Button>
                        </Group>
                    </Group>
                </Paper>

                {/* Now Playing */}
                <Card padding="lg" radius="md" withBorder>
                    <Group align="flex-start">
                        <Image
                            src={currentSong?.albumArt || '/placeholder-art.png'}
                            w={150}
                            h={150}
                            radius="md"
                            fallbackSrc="https://placehold.co/150?text=Music"
                        />
                        <Stack style={{ flex: 1 }} gap="xs">
                            <Text size="sm" c="dimmed" tt="uppercase" fw={700}>Now Playing</Text>
                            <Title order={3}>{currentSong?.title || 'Nothing Playing'}</Title>
                            <Text size="lg" c="dimmed">{currentSong?.artist || 'Add songs to queue'}</Text>

                            {/* Progress */}
                            <Group align="center" style={{ width: '100%' }}>
                                <Text size="xs">{formatTime(currentTime)}</Text>
                                <Progress value={(currentTime / (duration || 1)) * 100} size="sm" style={{ flex: 1 }} />
                                <Text size="xs">{formatTime(duration)}</Text>
                            </Group>

                            {/* Controls */}
                            <Group justify="center">
                                {isPlaying ? (
                                    <ActionIcon size="xl" variant="filled" radius="xl" onClick={() => pauseSong(session.passcode)}>
                                        <IconPlayerPause />
                                    </ActionIcon>
                                ) : (
                                    <ActionIcon size="xl" variant="filled" radius="xl" onClick={() => {
                                        if (currentSong) resumeSong(session.passcode);
                                        else if (session.queue.length > 0) {
                                            // If nothing playing but queue has songs, play first in queue
                                            // Need a mock song object to restart? OR backend should handle 'play_next'
                                        }
                                    }}>
                                        <IconPlayerPlay />
                                    </ActionIcon>
                                )}
                                <ActionIcon
                                    size="lg"
                                    variant="subtle"
                                    radius="xl"
                                    onClick={() => {
                                        if (session.queue.length > 0) {
                                            const nextSong = session.queue[0];
                                            const song: Song = {
                                                id: nextSong.songId,
                                                title: nextSong.title || 'Unknown',
                                                artist: nextSong.artist || 'Unknown',
                                                albumArt: nextSong.coverUrl,
                                                mimeType: 'audio/mpeg',
                                                createdAt: new Date().toISOString()
                                            };
                                            playSong(session.passcode, song);
                                        }
                                    }}
                                    disabled={session.queue.length === 0}
                                >
                                    <IconPlayerSkipForward />
                                </ActionIcon>
                            </Group>
                        </Stack>
                    </Group>
                </Card>

                {/* Search Button */}
                <Button
                    size="lg"
                    fullWidth
                    leftSection={<IconPlus />}
                    onClick={() => setSearchOpened(true)}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                >
                    Add Song to Queue
                </Button>

                {/* Queue */}
                <Stack gap="md">
                    <Title order={4}>Up Next</Title>
                    {session.queue.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">Queue is empty. Add some songs!</Text>
                    ) : (
                        session.queue.map((item: any, index) => (
                            <Paper key={`${item.songId}-${index}`} p="sm" withBorder radius="sm">
                                <Group justify="space-between">
                                    <Group>
                                        <Avatar src={item.coverUrl} radius="sm"><IconMusic /></Avatar>
                                        <Stack gap={0}>
                                            <Text fw={500}>{item.title || 'Unknown Song'}</Text>
                                            <Text size="xs" c="dimmed">Added by {item.addedByName || item.addedBy || 'Unknown'}</Text>
                                        </Stack>
                                    </Group>
                                    <Group>
                                        <Button
                                            leftSection={<IconThumbUp size={16} />}
                                            variant={item.votes?.includes(localStorage.getItem('jukebox_user_id')) ? 'filled' : 'light'}
                                            size="xs"
                                            onClick={() => handleVote(item.songId)}
                                        >
                                            {item.votes?.length || 0}
                                        </Button>
                                    </Group>
                                </Group>
                            </Paper>
                        ))
                    )}
                </Stack>

                <JukeboxSearchModal
                    opened={searchOpened}
                    onClose={() => setSearchOpened(false)}
                    passcode={session.passcode}
                />
            </Stack>
        </Container>
    );
}

export default function JukeboxPage() {
    const { session } = useJukebox();
    return session ? <JukeboxParty /> : <JukeboxLanding />;
}
