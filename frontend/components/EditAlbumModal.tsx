'use client';

import { useState } from 'react';
import { Modal, TextInput, Button, Stack, Group, Text, useMantineTheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { updateAlbum } from '@/lib/api';
import { getTextGradient } from '@/lib/themeColors';

interface EditAlbumModalProps {
  opened: boolean;
  onClose: () => void;
  artist: string;
  album: string;
  year?: string;
  genre?: string;
  albumArt?: string;
  onSuccess: () => void;
}

export default function EditAlbumModal({
  opened,
  onClose,
  artist,
  album,
  year,
  genre,
  albumArt,
  onSuccess,
}: EditAlbumModalProps) {
  const theme = useMantineTheme();
  const [newArtist, setNewArtist] = useState(artist);
  const [newAlbum, setNewAlbum] = useState(album);
  const [newYear, setNewYear] = useState(year || '');
  const [newGenre, setNewGenre] = useState(genre || '');
  const [newAlbumArt, setNewAlbumArt] = useState(albumArt || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newArtist.trim() || !newAlbum.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Artist and album name are required',
        color: 'red',
      });
      return;
    }

    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      if (newArtist !== artist) updates.newArtist = newArtist.trim();
      if (newAlbum !== album) updates.newAlbum = newAlbum.trim();
      if (newYear !== year) updates.year = newYear.trim();
      if (newGenre !== genre) updates.genre = newGenre.trim();
      if (newAlbumArt !== albumArt) updates.albumArt = newAlbumArt.trim();

      const result = await updateAlbum(artist, album, updates);

      notifications.show({
        title: 'Success',
        message: `Album updated successfully (${result.updatedSongs} songs updated)`,
        color: 'green',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating album:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update album. Please try again.',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setNewArtist(artist);
      setNewAlbum(album);
      setNewYear(year || '');
      setNewGenre(genre || '');
      setNewAlbumArt(albumArt || '');
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={600} size="md" style={getTextGradient(theme)}>
          Edit Album
        </Text>
      }
      centered
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Artist"
            placeholder="Artist name"
            value={newArtist}
            onChange={(e) => setNewArtist(e.target.value)}
            required
            disabled={saving}
          />
          <TextInput
            label="Album"
            placeholder="Album name"
            value={newAlbum}
            onChange={(e) => setNewAlbum(e.target.value)}
            required
            disabled={saving}
          />
          <TextInput
            label="Year"
            placeholder="2024"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            disabled={saving}
          />
          <TextInput
            label="Genre"
            placeholder="Rock, Pop, etc."
            value={newGenre}
            onChange={(e) => setNewGenre(e.target.value)}
            disabled={saving}
          />
          <TextInput
            label="Album Art URL"
            placeholder="https://example.com/album-art.jpg"
            value={newAlbumArt}
            onChange={(e) => setNewAlbumArt(e.target.value)}
            disabled={saving}
          />
          <Text size="xs" c="dimmed">
            Note: Changes will apply to all songs in this album
          </Text>
          <Group justify="flex-end" gap="xs" mt="md">
            <Button variant="subtle" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={saving}
              variant="gradient"
              gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
