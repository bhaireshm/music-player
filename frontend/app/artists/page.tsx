'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getArtists, Artist } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Text,
  Stack,
  Alert,
  Box,
  Skeleton,
  useMantineTheme,
  useMantineColorScheme,
  Group,
  Avatar,
} from '@mantine/core';
import { IconAlertCircle, IconUser, IconMusic } from '@tabler/icons-react';
import InfiniteScroll from '@/components/InfiniteScroll';
import { getGradient, getTextGradient, getCardBackground, getCardBorder, getTransition } from '@/lib/themeColors';

function ArtistsPageContent() {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getArtists();
      setArtists(data);
    } catch (err) {
      setError('Failed to load artists. Please try again.');
      console.error('Error fetching artists:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayedArtists = artists.slice(0, displayCount);
  const hasMore = displayCount < artists.length;

  const loadMore = () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + 20, artists.length));
      setIsLoadingMore(false);
    }, 300);
  };

  const handleArtistClick = (artist: Artist) => {
    router.push(`/artists/${encodeURIComponent(artist.name)}`);
  };

  return (
    <Box pb={90}>
      <Container size="xl" py="xl">
        {/* Header */}
        <Box
          mb="xl"
          p="xl"
          style={{
            background: getGradient(theme, 'secondary'),
            borderRadius: theme.radius.md,
            boxShadow: theme.shadows.md,
          }}
        >
          <Stack gap="xs">
            <Title order={1} style={{ ...getTextGradient(theme), fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
              Artists
            </Title>
            <Text c="dimmed" size="sm">
              {artists.length} {artists.length === 1 ? 'artist' : 'artists'}
            </Text>
          </Stack>
        </Box>

        {/* Loading State */}
        {loading && (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={theme.spacing.md}>
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} height={200} radius={theme.radius.md} />
            ))}
          </SimpleGrid>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert icon={<IconAlertCircle size={18} />} title="Error" color="red" variant="light">
            <Text size="sm">{error}</Text>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && artists.length === 0 && (
          <Box
            p="xl"
            style={{
              background: getGradient(theme, 'secondary'),
              borderRadius: theme.radius.md,
            }}
          >
            <Stack align="center" gap={theme.spacing.md} py={60}>
              <Box
                style={{
                  background: getGradient(theme, 'accent'),
                  borderRadius: '50%',
                  padding: theme.spacing.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconUser size={48} stroke={1.5} color={theme.colors.primary[0]} />
              </Box>
              <Title order={3}>No artists yet</Title>
              <Text c="dimmed" size="sm" ta="center" maw={400}>
                Upload songs to see your artists organized here.
              </Text>
            </Stack>
          </Box>
        )}

        {/* Artists Grid */}
        {!loading && !error && artists.length > 0 && (
          <InfiniteScroll hasMore={hasMore} loading={isLoadingMore} onLoadMore={loadMore}>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={theme.spacing.md}>
              {displayedArtists.map((artist) => (
                <Card
                  key={artist.name}
                  shadow="sm"
                  padding="md"
                  radius={theme.radius.md}
                  style={{
                    cursor: 'pointer',
                    transition: getTransition(theme),
                    background: getCardBackground(theme, colorScheme),
                    border: `1px solid ${getCardBorder(theme, colorScheme)}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = theme.shadows.md;
                    e.currentTarget.style.borderColor = theme.colors.accent1[6];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = theme.shadows.sm;
                    e.currentTarget.style.borderColor = getCardBorder(theme, colorScheme);
                  }}
                  onClick={() => handleArtistClick(artist)}
                >
                  <Stack align="center" gap="md">
                    <Avatar
                      size={120}
                      radius="50%"
                      style={{
                        background: getGradient(theme, 'accent'),
                      }}
                    >
                      <IconUser size={60} color={theme.colors.primary[0]} />
                    </Avatar>
                    <Stack gap="xs" align="center" style={{ width: '100%' }}>
                      <Text size="sm" fw={600} lineClamp={2} ta="center" style={{ minHeight: 40 }}>
                        {artist.name}
                      </Text>
                      <Group gap="xs" justify="center">
                        <IconMusic size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                        <Text size="xs" c="dimmed">
                          {artist.songCount} {artist.songCount === 1 ? 'song' : 'songs'}
                        </Text>
                      </Group>
                      {artist.albums.length > 0 && (
                        <Text size="xs" c="dimmed">
                          {artist.albums.length} {artist.albums.length === 1 ? 'album' : 'albums'}
                        </Text>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </InfiniteScroll>
        )}
      </Container>
    </Box>
  );
}

export default function ArtistsPage() {
  return (
    <ProtectedRoute>
      <ArtistsPageContent />
    </ProtectedRoute>
  );
}
