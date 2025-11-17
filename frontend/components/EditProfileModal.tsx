'use client';

import { useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { updateUserProfile, UserProfile } from '@/lib/api';

interface EditProfileModalProps {
  opened: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

export default function EditProfileModal({
  opened,
  onClose,
  profile,
  onUpdate,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await updateUserProfile(displayName, bio, avatarUrl);
      onUpdate(updated);
      
      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green',
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update profile',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>Edit Profile</Text>}
      centered
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Display Name"
          placeholder="Enter your display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <Textarea
          label="Bio"
          placeholder="Tell us about yourself"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
        />

        <TextInput
          label="Avatar URL"
          placeholder="https://example.com/avatar.jpg"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />

        <Group justify="flex-end" gap="xs">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            variant="gradient"
            gradient={{ from: 'accent1.7', to: 'secondary.7', deg: 135 }}
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
