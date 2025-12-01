'use client';

import { useState, useEffect, useCallback } from 'react';

import { getDiscoverPlaylists, getPublicPlaylists, Playlist } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import PlaylistCard from '@/components/PlaylistCard';
import {
  Container,
  Title,
  Text,
  Stack,
  SimpleGrid,
  TextInput,
  SegmentedControl,
  Box,
  Skeleton,
  Alert,
  useMantineTheme,
} from '@mantine/core';
import { IconSearch, IconAlertCircle } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';

function DiscoverPageContent() {

  const theme = useMantineTheme();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 500);
  const [filter, setFilter] = useState<'discover' | 'search'>('discover');

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (filter === 'discover' && !debouncedSearch) {
        const data = await getDiscoverPlaylists(20);
        setPlaylists(data.playlists);
      } else {
        const data = await getPublicPlaylists(20, 0, debouncedSearch);
        setPlaylists(data.playlists);
      }
    } catch (err) {
      setError('Failed to load playlists. Please try again.');
      console.error('Error fetching playlists:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  return (
    <Box pb={90}>
      <Container size="xl" py="xl">
        {/* Header */}
        <Stack gap="xs" mb="xl">
          <Title
            order={1}
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            }}
          >
            Discover Playlists
          </Title>
          <Text c="dimmed" size="sm">
            Explore public playlists from the community
          </Text>
        </Stack>

        {/* Search and Filter */}
        <Stack gap="md" mb="xl">
          <TextInput
            placeholder="Search public playlists..."
            leftSection={<IconSearch size={18} />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setFilter('search');
            }}
            size="md"
          />

          <SegmentedControl
            value={filter}
            onChange={(value) => setFilter(value as 'discover' | 'search')}
            data={[
              { label: 'Most Popular', value: 'discover' },
              { label: 'Search Results', value: 'search' },
            ]}
          />
        </Stack>

        {/* Loading State */}
        {loading && (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={`skeleton-${i}`} height={200} radius="md" />
            ))}
          </SimpleGrid>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            title="Error"
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && playlists.length === 0 && (
          <Box ta="center" py="xl">
            <Text c="dimmed">No public playlists found</Text>
          </Box>
        )}

        {/* Playlist Grid */}
        {!loading && !error && playlists.length > 0 && (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onRefresh={fetchPlaylists}
              />
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}

export default function DiscoverPage() {
  return (
    <ProtectedRoute>
      <DiscoverPageContent />
    </ProtectedRoute>
  );
}
