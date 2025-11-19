'use client';

import { Song } from '@/lib/api';
import { Box, Group, Text, ActionIcon, Menu, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { IconPlayerPlay, IconDots, IconPlaylistAdd, IconInfoCircle } from '@tabler/icons-react';
import PlayingAnimation from '@/components/PlayingAnimation';
import FavoriteButton from '@/components/FavoriteButton';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';
import { getCardBackground, getCardBorder, getActiveBackground, getTransition } from '@/lib/themeColors';

interface SongListItemProps {
  song: Song;
  index: number;
  isPlaying: boolean;
  isCurrentSong: boolean;
  onPlay: (song: Song, index: number) => void;
  onViewDetails: (songId: string) => void;
  onRefresh?: () => void;
  showFavoriteInMenu?: boolean;
}

export default function SongListItem({
  song,
  index,
  isPlaying,
  isCurrentSong,
  onPlay,
  onViewDetails,
  onRefresh,
  showFavoriteInMenu = false,
}: SongListItemProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  return (
    <Box
      p="md"
      style={{
        background: isCurrentSong
          ? getActiveBackground(theme, colorScheme)
          : getCardBackground(theme, colorScheme),
        borderRadius: theme.radius.md,
        border: `1px solid ${isCurrentSong ? theme.colors.accent1[4] : getCardBorder(theme, colorScheme)}`,
        transition: getTransition(theme),
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text fw={isCurrentSong ? 600 : 400} truncate>
            {song.title}
          </Text>
          <Text c="dimmed" size="sm" truncate>
            {song.artist}
          </Text>
          {song.album && (
            <Text c="dimmed" size="xs" truncate>
              {song.album}
            </Text>
          )}
        </Box>
        <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
          <ActionIcon
            variant={isCurrentSong ? 'filled' : 'subtle'}
            color="accent1"
            size={44}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(song, index);
            }}
            aria-label={`Play ${song.title}`}
            style={{ minWidth: 44, minHeight: 44 }}
          >
            {isCurrentSong && isPlaying ? (
              <PlayingAnimation size={22} color="white" />
            ) : (
              <IconPlayerPlay size={22} />
            )}
          </ActionIcon>
          <Menu position="bottom-end" shadow="md" width={180} zIndex={500}>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size={44}
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label="More options"
              >
                <IconDots size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown p={4}>
              <Menu.Item
                leftSection={<IconPlayerPlay size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(song, index);
                }}
                style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
              >
                Play
              </Menu.Item>
              {showFavoriteInMenu && (
                <Menu.Item
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
                >
                  <FavoriteButton songId={song.id} size="sm" />
                </Menu.Item>
              )}
              <Menu
                trigger="click"
                position="left-start"
                offset={2}
                withArrow
                zIndex={501}
              >
                <Menu.Target>
                  <Menu.Item
                    leftSection={<IconPlaylistAdd size={16} />}
                    style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
                  >
                    Add to Playlist
                  </Menu.Item>
                </Menu.Target>
                <AddToPlaylistMenu songId={song.id} onSuccess={onRefresh} />
              </Menu>
              <Menu.Item
                leftSection={<IconInfoCircle size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(song.id);
                }}
                style={{ fontSize: '14px', padding: `${theme.spacing.sm} ${theme.spacing.md}` }}
              >
                Details
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Box>
  );
}
