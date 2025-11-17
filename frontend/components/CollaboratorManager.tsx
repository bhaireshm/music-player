'use client';

import { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  TextInput,
  Button,
  Text,
  ActionIcon,
  Box,
  Loader,
} from '@mantine/core';
import { IconTrash, IconCrown, IconSearch } from '@tabler/icons-react';
import { searchUsers, UserProfile } from '@/lib/api';
import { useDebouncedValue } from '@mantine/hooks';
import UserAvatar from './UserAvatar';

interface CollaboratorManagerProps {
  ownerId: string;
  collaborators: string[];
  onAddCollaborator: (collaboratorId: string) => Promise<void>;
  onRemoveCollaborator: (collaboratorId: string) => Promise<void>;
  loading?: boolean;
}

export default function CollaboratorManager({
  ownerId,
  collaborators,
  onAddCollaborator,
  onRemoveCollaborator,
  loading = false,
}: CollaboratorManagerProps) {
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [searchResults, setSearchResults] = useState<Partial<UserProfile>[]>([]);
  const [searching, setSearching] = useState(false);
  const [debouncedSearch] = useDebouncedValue(collaboratorInput, 500);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const results = await searchUsers(debouncedSearch);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (debouncedSearch.trim().length > 0) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleAdd = async (userId: string) => {
    await onAddCollaborator(userId);
    setCollaboratorInput('');
    setSearchResults([]);
  };

  return (
    <Stack gap="md">
      <Box>
        <Text size="sm" fw={500} mb="xs">
          Owner
        </Text>
        <Group gap="xs">
          <IconCrown size={16} />
          <Text size="sm">{ownerId}</Text>
        </Group>
      </Box>

      <Box>
        <Text size="sm" fw={500} mb="xs">
          Add Collaborator
        </Text>
        <TextInput
          placeholder="Search by email or name"
          value={collaboratorInput}
          onChange={(e) => setCollaboratorInput(e.target.value)}
          leftSection={<IconSearch size={16} />}
          rightSection={searching ? <Loader size="xs" /> : null}
          size="sm"
        />
        
        {searchResults.length > 0 && (
          <Stack gap="xs" mt="xs">
            {searchResults.map((user) => (
              <Group key={user.uid} justify="space-between" p="xs" style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                <Group gap="xs">
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    displayName={user.displayName}
                    email={user.email}
                    size="sm"
                  />
                  <Box>
                    <Text size="sm" fw={500}>{user.displayName || 'User'}</Text>
                    <Text size="xs" c="dimmed">{user.email}</Text>
                  </Box>
                </Group>
                <Button
                  onClick={() => handleAdd(user.uid!)}
                  disabled={loading}
                  size="xs"
                >
                  Add
                </Button>
              </Group>
            ))}
          </Stack>
        )}
      </Box>

      {collaborators.length > 0 && (
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Collaborators ({collaborators.length})
          </Text>
          <Stack gap="xs">
            {collaborators.map((collaboratorId) => (
              <Group key={collaboratorId} justify="space-between">
                <Text size="sm">{collaboratorId}</Text>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => onRemoveCollaborator(collaboratorId)}
                  disabled={loading}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
