'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getArtist, ArtistDetail, deleteArtist } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import SongListItem from '@/components/SongListItem';
import EditArtistModal from '@/components/EditArtistModal';
import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Alert,
  Box,
  Group,
  Skeleton,
  useMantineTheme,
  useMantineColorScheme,
  Avatar,
  Badge,
  Tabs,
  Card,
  SimpleGrid,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconAlertCircle,
  IconArrowLeft,
  IconUser,
  IconEdit,
  IconTrash,
  IconDisc,
} from '@tabler/icons-react';
import { getGradient, getTextGradient, getCardBackground, getCardBorder } from '@/lib/themeColors';
import { notifications } from '@mantine/notifications';

function ArtistDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const [artistInfo, setArtistInfo] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { setQueue, isPlaying, currentSong } = useAudioPlayerContext();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const artistName = decodeURIComponent(params.name as string);

  useEffect(() => {
    fetchArtistInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistName]);

  const fetchArtistInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getArtist(artistName);
      setArtistInfo(data);
    } catch (err) {
      setError('Failed to load artist. Please try again.');
      console.error('Error fetching artist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (artistInfo && artistInfo.songs.length > 0) {
      setQueue(artistInfo.songs, 0);
    }
  };

  const handlePlaySong = (song: ArtistDetail['songs'][0], index: number) => {
    if (artistInfo) {
      setQueue(artistInfo.songs, index);
    }
  };

  const handleViewDetails = (songId: string) => {
    router.push(`/songs/${songId}`);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete all songs by ${artistName}? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteArtist(artistName);
      notifications.show({
        title: 'Success',
        message: `Deleted ${result.deletedSongs} songs by ${artistName}`,
        color: 'green',
      });
      router.push('/artists');
    } catch (error) {
      console.error('Error deleting artist:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete artist. Please try again.',
        color: 'red',
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} hr ${mins} min`;
    }
    return `${mins} min`;
  };

  // Group songs by album
  const songsByAlbum = artistInfo?.songs.reduce((acc, song) => {
    const album = song.album || 'Singles';
    if (!acc[album]) {
      acc[album] = [];
    }
    acc[album].push(song);
    return acc;
  }, {} as Record<string, typeof artistInfo.songs>);

  return (
    <Box pb={90}>
      <Container size="xl" py="xl">
        {/* Back Button */}
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => router.back()}
          mb="md"
          size="sm"
        >
          Back
        </Button>

        {/* Loading State */}
        {loading && (
          <Stack gap={theme.spacing.md}>
            <Skeleton height={300} radius={theme.radius.md} />
            <Skeleton height={50} radius={theme.radius.md} />
          </Stack>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert icon={<IconAlertCircle size={18} />} title="Error" color="red" variant="light">
            <Text size="sm" mb="xs">
              {error}
            </Text>
            <Button size="xs" variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </Alert>
        )}

        {/* Artist Details */}
        {!loading && !error && artistInfo && (
          <>
            {/* Artist Header */}
            <Box
              mb="xl"
              p="xl"
              style={{
                background: getGradient(theme, 'secondary'),
                borderRadius: theme.radius.md,
                boxShadow: theme.shadows.lg,
              }}
            >
              <Group align="flex-start" gap="xl" wrap="nowrap">
                {/* Artist Avatar */}
                <Avatar
                  size={200}
                  radius="50%"
                  style={{
                    background: getGradient(theme, 'accent'),
                    flexShrink: 0,
                  }}
                >
                  <IconUser size={100} color={theme.colors.primary[0]} />
                </Avatar>

                {/* Artist Info */}
                <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
                  <Badge variant="light" color="accent1" size="sm">
                    Artist
                  </Badge>
                  <Title order={1} style={{ ...getTextGradient(theme), fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}>
                    {artistName}
                  </Title>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      {artistInfo.songCount} {artistInfo.songCount === 1 ? 'song' : 'songs'}
                    </Text>
                    <Text size="sm" c="dimmed">
                      •
                    </Text>
                    <Text size="sm" c="dimmed">
                      {artistInfo.albumCount} {artistInfo.albumCount === 1 ? 'album' : 'albums'}
                    </Text>
                    <Text size="sm" c="dimmed">
                      •
                    </Text>
                    <Text size="sm" c="dimmed">
                      {formatDuration(artistInfo.totalDuration)}
                    </Text>
                  </Group>
                  <Group gap="xs" mt="md">
                    <Button
                      leftSection={<IconPlayerPlay size={18} />}
                      onClick={handlePlayAll}
                      variant="gradient"
                      gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
                      size="md"
                    >
                      Play All
                    </Button>
                    <Button
                      leftSection={<IconEdit size={18} />}
                      onClick={() => setShowEditModal(true)}
                      variant="light"
                      color="accent1"
                      size="md"
                    >
                      Edit
                    </Button>
                    <Button
                      leftSection={<IconTrash size={18} />}
                      onClick={handleDelete}
                      loading={deleting}
                      variant="light"
                      color="red"
                      size="md"
                    >
                      Delete
                    </Button>
                  </Group>
                </Stack>
              </Group>
            </Box>

            {/* Tabs for Albums and All Songs */}
            <Tabs defaultValue="albums">
              <Tabs.List>
                <Tabs.Tab value="albums" leftSection={<IconDisc size={16} />}>
                  Albums
                </Tabs.Tab>
                <Tabs.Tab value="all" leftSection={<IconPlayerPlay size={16} />}>
                  All Songs
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="albums" pt="md">
                {artistInfo.albums.length > 0 ? (
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
                    {artistInfo.albums.map((album) => (
                      <Card
                        key={album}
                        shadow="sm"
                        padding="md"
                        radius={theme.radius.md}
                        style={{
                          cursor: 'pointer',
                          background: getCardBackground(theme, colorScheme),
                          border: `1px solid ${getCardBorder(theme, colorScheme)}`,
                        }}
                        onClick={() =>
                          router.push(`/albums/${encodeURIComponent(artistName)}/${encodeURIComponent(album)}`)
                        }
                      >
                        <Stack gap="xs">
                          <Text size="sm" fw={600} lineClamp={2}>
                            {album}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {songsByAlbum?.[album]?.length || 0} songs
                          </Text>
                        </Stack>
                      </Card>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No albums found
                  </Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="all" pt="md">
                <Stack gap="xs">
                  {artistInfo.songs.map((song, index) => (
                    <SongListItem
                      key={song.id}
                      song={song}
                      index={index}
                      isPlaying={isPlaying}
                      isCurrentSong={currentSong?.id === song.id}
                      onPlay={handlePlaySong}
                      onViewDetails={handleViewDetails}
                      onRefresh={fetchArtistInfo}
                    />
                  ))}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </>
        )}
      </Container>

      {/* Edit Artist Modal */}
      {artistInfo && (
        <EditArtistModal
          opened={showEditModal}
          onClose={() => setShowEditModal(false)}
          artistName={artistName}
          onSuccess={() => {
            fetchArtistInfo();
            // If artist name changed, redirect to new URL
            router.refresh();
          }}
        />
      )}
    </Box>
  );
}

export default function ArtistDetailPage() {
  return (
    <ProtectedRoute>
      <ArtistDetailPageContent />
    </ProtectedRoute>
  );
}
