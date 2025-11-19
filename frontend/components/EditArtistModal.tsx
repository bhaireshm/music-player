'use client';

import { useState } from 'react';
import { Modal, TextInput, Button, Stack, Group, Text, useMantineTheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { updateArtist } from '@/lib/api';
import { getTextGradient } from '@/lib/themeColors';
import { useRouter } from 'next/navigation';

interface EditArtistModalProps {
  opened: boolean;
  onClose: () => void;
  artistName: string;
  onSuccess: () => void;
}

export default function EditArtistModal({
  opened,
  onClose,
  artistName,
  onSuccess,
}: EditArtistModalProps) {
  const theme = useMantineTheme();
  const router = useRouter();
  const [newArtistName, setNewArtistName] = useState(artistName);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newArtistName.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Artist name is required',
        color: 'red',
      });
      return;
    }

    if (newArtistName.trim() === artistName) {
      notifications.show({
        title: 'No Changes',
        message: 'Artist name is the same',
        color: 'yellow',
      });
      return;
    }

    setSaving(true);
    try {
      const result = await updateArtist(artistName, newArtistName.trim());

      notifications.show({
        title: 'Success',
        message: `Artist updated successfully (${result.updatedSongs} songs updated)`,
        color: 'green',
      });

      onSuccess();
      onClose();
      
      // Redirect to new artist page
      router.push(`/artists/${encodeURIComponent(newArtistName.trim())}`);
    } catch (error) {
      console.error('Error updating artist:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update artist. Please try again.',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setNewArtistName(artistName);
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={600} size="md" style={getTextGradient(theme)}>
          Edit Artist
        </Text>
      }
      centered
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Artist Name"
            placeholder="Artist name"
            value={newArtistName}
            onChange={(e) => setNewArtistName(e.target.value)}
            required
            disabled={saving}
            data-autofocus
          />
          <Text size="xs" c="dimmed">
            Note: This will update the artist name for all their songs
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
