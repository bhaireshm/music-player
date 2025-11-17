'use client';

import { useState, useEffect } from 'react';
import { getUserProfile, getPlaylists, UserProfile, Playlist } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import EditProfileModal from '@/components/EditProfileModal';
import UserAvatar from '@/components/UserAvatar';
import {
  Container,
  Title,
  Text,
  Stack,
  Box,
  Group,
  Button,
  SimpleGrid,
  Card,
  Skeleton,
  useMantineTheme,
} from '@mantine/core';
import { IconEdit, IconPlaylist, IconMusic } from '@tabler/icons-react';

function ProfilePageContent() {
  const theme = useMantineTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileData, playlistsData] = await Promise.all([
        getUserProfile(),
        getPlaylists(),
      ]);
      setProfile(profileData);
      setPlaylists(playlistsData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const publicPlaylists = playlists.filter(p => p.visibility === 'public');

  return (
    <Box pb={90}>
      <Container size="lg" py="xl">
        {loading ? (
          <Stack gap="md">
            <Skeleton height={200} radius="md" />
            <Skeleton height={100} radius="md" />
          </Stack>
        ) : (
          <>
            {/* Profile Header */}
            <Card shadow="sm" padding="xl" radius="md" mb="xl">
              <Group align="flex-start">
                <UserAvatar
                  avatarUrl={profile?.avatarUrl}
                  displayName={profile?.displayName}
                  size="lg"
                />
                <Box style={{ flex: 1 }}>
                  <Group justify="space-between" mb="xs">
                    <div>
                      <Title order={2}>
                        {profile?.displayName || 'User'}
                      </Title>
                      <Text c="dimmed" size="sm">
                        {profile?.email}
                      </Text>
                    </div>
                    <Button
                      leftSection={<IconEdit size={16} />}
                      onClick={() => setShowEditModal(true)}
                      variant="light"
                    >
                      Edit Profile
                    </Button>
                  </Group>
                  {profile?.bio && (
                    <Text size="sm" mt="md">
                      {profile.bio}
                    </Text>
                  )}
                </Box>
              </Group>
            </Card>

            {/* Statistics */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mb="xl">
              <Card shadow="sm" padding="md" radius="md">
                <Group>
                  <IconPlaylist size={32} />
                  <div>
                    <Text size="xl" fw={700}>
                      {playlists.length}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Playlists
                    </Text>
                  </div>
                </Group>
              </Card>
              <Card shadow="sm" padding="md" radius="md">
                <Group>
                  <IconMusic size={32} />
                  <div>
                    <Text size="xl" fw={700}>
                      {publicPlaylists.length}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Public Playlists
                    </Text>
                  </div>
                </Group>
              </Card>
            </SimpleGrid>

            {/* Public Playlists */}
            {publicPlaylists.length > 0 && (
              <Box>
                <Title order={3} mb="md">
                  Public Playlists
                </Title>
                <Stack gap="xs">
                  {publicPlaylists.map((playlist) => (
                    <Card key={playlist.id} shadow="sm" padding="md" radius="md">
                      <Group justify="space-between">
                        <div>
                          <Text fw={500}>{playlist.name}</Text>
                          <Text size="sm" c="dimmed">
                            {Array.isArray(playlist.songIds) ? playlist.songIds.length : 0} songs
                          </Text>
                        </div>
                        <Text size="sm" c="dimmed">
                          {playlist.followerCount} followers
                        </Text>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}
          </>
        )}

        {/* Edit Profile Modal */}
        {profile && (
          <EditProfileModal
            opened={showEditModal}
            onClose={() => setShowEditModal(false)}
            profile={profile}
            onUpdate={(updated) => {
              setProfile(updated);
              setShowEditModal(false);
            }}
          />
        )}
      </Container>
    </Box>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
