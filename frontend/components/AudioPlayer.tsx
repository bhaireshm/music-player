'use client';

import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { Song } from '@/lib/api';
import { useEffect, useState } from 'react';
import {
  Group,
  Stack,
  ActionIcon,
  Slider,
  Text,
  Image,
  Box,
  Collapse,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipForward,
  IconPlayerSkipBack,
  IconVolume,
  IconVolume2,
  IconVolume3,
  IconVolumeOff,
} from '@tabler/icons-react';

interface AudioPlayerProps {
  song: Song | null;
  onSongChange?: (song: Song | null) => void;
}

export default function AudioPlayer({ song, onSongChange }: AudioPlayerProps) {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    loading,
    error,
    queue,
    currentIndex,
    play,
    pause,
    seek,
    setVolume,
    loadSong,
    next,
    previous,
  } = useAudioPlayerContext();

  const [volumeOpen, setVolumeOpen] = useState(false);

  // Load song when prop changes
  useEffect(() => {
    if (song && song.id !== currentSong?.id) {
      loadSong(song);
    }
  }, [song, currentSong, loadSong]);

  // Notify parent of song changes
  useEffect(() => {
    if (onSongChange) {
      onSongChange(currentSong);
    }
  }, [currentSong, onSongChange]);

  const formatTime = (timeInSeconds: number): string => {
    if (!isFinite(timeInSeconds)) return '0:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const renderVolumeIcon = (size: number) => {
    if (volume === 0) return <IconVolumeOff size={size} />;
    if (volume < 0.33) return <IconVolume3 size={size} />;
    if (volume < 0.66) return <IconVolume2 size={size} />;
    return <IconVolume size={size} />;
  };

  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;
  const hasPrevious = currentIndex > 0;

  if (!currentSong) {
    return (
      <Box
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          backgroundColor: 'var(--mantine-color-dark-7)',
          borderTop: '1px solid var(--mantine-color-dark-5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
      >
        <Text c="dimmed" size="sm">
          No song selected
        </Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: 'var(--mantine-color-dark-7)',
        borderTop: '1px solid var(--mantine-color-dark-5)',
        padding: '12px 16px',
        zIndex: 100,
      }}
    >
      {/* Error message */}
      {error && (
        <Text c="red" size="xs" ta="center" mb="xs">
          {error}
        </Text>
      )}

      {/* Desktop Layout */}
      <Group
        justify="space-between"
        align="center"
        h="100%"
        visibleFrom="md"
        wrap="nowrap"
      >
        {/* Left: Album Art and Song Info */}
        <Group gap="md" style={{ minWidth: 0, flex: '0 0 300px' }}>
          <Image
            src={currentSong.albumArt || null}
            alt={currentSong.title}
            w={60}
            h={60}
            radius="md"
            fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23374151'/%3E%3Cpath d='M20 15v30l20-15z' fill='%239CA3AF'/%3E%3C/svg%3E"
          />
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text size="sm" fw={600} truncate c="white">
              {currentSong.title}
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {currentSong.artist}
            </Text>
          </Box>
        </Group>

        {/* Center: Playback Controls */}
        <Stack gap="xs" style={{ flex: '1 1 auto', maxWidth: 600 }}>
          <Group justify="center" gap="xs">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={previous}
              disabled={!hasPrevious}
              aria-label="Previous song"
            >
              <IconPlayerSkipBack size={20} />
            </ActionIcon>

            <ActionIcon
              variant="filled"
              color="blue"
              size="xl"
              radius="xl"
              onClick={togglePlayPause}
              disabled={loading}
              loading={loading}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <IconPlayerPause size={24} />
              ) : (
                <IconPlayerPlay size={24} />
              )}
            </ActionIcon>

            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={next}
              disabled={!hasNext}
              aria-label="Next song"
            >
              <IconPlayerSkipForward size={20} />
            </ActionIcon>
          </Group>

          <Group gap="xs" align="center">
            <Text size="xs" c="dimmed" style={{ minWidth: 40, textAlign: 'right' }}>
              {formatTime(currentTime)}
            </Text>
            <Slider
              value={currentTime}
              onChange={seek}
              max={duration || 0}
              min={0}
              disabled={loading || !duration}
              style={{ flex: 1 }}
              size="sm"
              color="blue"
            />
            <Text size="xs" c="dimmed" style={{ minWidth: 40 }}>
              {formatTime(duration)}
            </Text>
          </Group>
        </Stack>

        {/* Right: Volume Control */}
        <Group gap="xs" style={{ flex: '0 0 150px' }} justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            onClick={() => setVolume(volume === 0 ? 1 : 0)}
            aria-label="Toggle mute"
          >
            {renderVolumeIcon(20)}
          </ActionIcon>
          <Slider
            value={volume}
            onChange={setVolume}
            max={1}
            min={0}
            step={0.01}
            style={{ width: 100 }}
            size="sm"
            color="blue"
            aria-label="Volume"
          />
        </Group>
      </Group>

      {/* Mobile Layout */}
      <Stack gap="xs" hiddenFrom="md" h="100%">
        <Group justify="space-between" align="center" wrap="nowrap">
          {/* Album Art and Song Info */}
          <Group gap="sm" style={{ minWidth: 0, flex: 1 }}>
            <Image
              src={currentSong.albumArt || null}
              alt={currentSong.title}
              w={48}
              h={48}
              radius="md"
              fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23374151'/%3E%3Cpath d='M16 12v24l16-12z' fill='%239CA3AF'/%3E%3C/svg%3E"
            />
            <Box style={{ minWidth: 0, flex: 1 }}>
              <Text size="sm" fw={600} truncate c="white">
                {currentSong.title}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {currentSong.artist}
              </Text>
            </Box>
          </Group>

          {/* Playback Controls */}
          <Group gap={4}>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="md"
              onClick={previous}
              disabled={!hasPrevious}
              aria-label="Previous song"
            >
              <IconPlayerSkipBack size={18} />
            </ActionIcon>

            <ActionIcon
              variant="filled"
              color="blue"
              size="lg"
              radius="xl"
              onClick={togglePlayPause}
              disabled={loading}
              loading={loading}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <IconPlayerPause size={20} />
              ) : (
                <IconPlayerPlay size={20} />
              )}
            </ActionIcon>

            <ActionIcon
              variant="subtle"
              color="gray"
              size="md"
              onClick={next}
              disabled={!hasNext}
              aria-label="Next song"
            >
              <IconPlayerSkipForward size={18} />
            </ActionIcon>

            <ActionIcon
              variant="subtle"
              color="gray"
              size="md"
              onClick={() => setVolumeOpen(!volumeOpen)}
              aria-label="Toggle volume"
            >
              {renderVolumeIcon(18)}
            </ActionIcon>
          </Group>
        </Group>

        {/* Seek bar */}
        <Group gap="xs" align="center">
          <Text size="xs" c="dimmed" style={{ minWidth: 35, textAlign: 'right' }}>
            {formatTime(currentTime)}
          </Text>
          <Slider
            value={currentTime}
            onChange={seek}
            max={duration || 0}
            min={0}
            disabled={loading || !duration}
            style={{ flex: 1 }}
            size="xs"
            color="blue"
          />
          <Text size="xs" c="dimmed" style={{ minWidth: 35 }}>
            {formatTime(duration)}
          </Text>
        </Group>

        {/* Collapsible Volume Control */}
        <Collapse in={volumeOpen}>
          <Group gap="xs" align="center" mt={4}>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => setVolume(volume === 0 ? 1 : 0)}
              aria-label="Toggle mute"
            >
              {renderVolumeIcon(16)}
            </ActionIcon>
            <Slider
              value={volume}
              onChange={setVolume}
              max={1}
              min={0}
              step={0.01}
              style={{ flex: 1 }}
              size="xs"
              color="blue"
              aria-label="Volume"
            />
          </Group>
        </Collapse>
      </Stack>
    </Box>
  );
}
