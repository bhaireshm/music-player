'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Text,
  Group,
  Button,
  Stack,
  Box,
  useMantineTheme,
} from '@mantine/core';
import { IconPlaylist, IconUsers, IconMusic, IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { followPlaylist, unfollowPlaylist, Playlist } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface PlaylistCardProps {
  playlist: Playlist;
  onRefresh?: () => void;
}

export default function PlaylistCard({ playlist, onRefresh }: PlaylistCardProps) {
  const router = useRouter();
  const theme = useMantineTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(
    playlist.followers.includes(user?.uid || '')
  );

  const songCount = Array.isArray(playlist.songIds) ? playlist.songIds.length : 0;

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);

    try {
      if (isFollowing) {
        await unfollowPlaylist(playlist.id);
        setIsFollowing(false);
        notifications.show({
          title: 'Success',
          message: 'Playlist unfollowed',
          color: 'green',
        });
      } else {
        await followPlaylist(playlist.id);
        setIsFollowing(true);
        notifications.show({
          title: 'Success',
          message: 'Playlist followed',
          color: 'green',
        });
      }
      onRefresh?.();
    } catch (error) {
      console.error('Error following/unfollowing playlist:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update follow status',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlaylist = () => {
    router.push(`/playlists/${playlist.id}`);
  };

  return (
    <Card
      shadow="sm"
      padding="md"
      radius={theme.radius.md}
      style={{
        cursor: 'pointer',
        transition: `all ${theme.other.transitionDuration.normal} ${theme.other.easingFunctions.easeInOut}`,
        background: theme.colors.primary[9],
        border: `1px solid ${theme.colors.secondary[8]}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = theme.shadows.md;
        e.currentTarget.style.borderColor = theme.colors.accent1[6];
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = theme.shadows.sm;
        e.currentTarget.style.borderColor = theme.colors.secondary[8];
      }}
      onClick={handleViewPlaylist}
    >
      <Stack gap="sm">
        <Box
          style={{
            background: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
            borderRadius: theme.radius.sm,
            padding: theme.spacing.xl,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio: '1',
          }}
        >
          <IconPlaylist size={48} stroke={1.5} color={theme.colors.primary[0]} />
        </Box>

        <Stack gap="xs">
          <Text size="md" fw={600} lineClamp={1}>
            {playlist.name}
          </Text>
          
          <Group gap="xs">
            <IconMusic size={14} />
            <Text size="xs" c="dimmed">
              {songCount} {songCount === 1 ? 'song' : 'songs'}
            </Text>
          </Group>

          <Group gap="xs">
            <IconUsers size={14} />
            <Text size="xs" c="dimmed">
              {playlist.followerCount} {playlist.followerCount === 1 ? 'follower' : 'followers'}
            </Text>
          </Group>
        </Stack>

        <Button
          fullWidth
          variant={isFollowing ? 'light' : 'gradient'}
          gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
          color={isFollowing ? 'red' : undefined}
          leftSection={isFollowing ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
          onClick={handleFollow}
          loading={loading}
          size="sm"
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
      </Stack>
    </Card>
  );
}
