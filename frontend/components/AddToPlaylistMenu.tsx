'use client';

import { useState, useEffect } from 'react';
import { Menu, Modal, TextInput, Button, Text, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlaylistAdd, IconPlus } from '@tabler/icons-react';
import { getPlaylists, addSongToPlaylist, createPlaylist, Playlist } from '@/lib/api';

interface AddToPlaylistMenuProps {
  songId: string;
  onSuccess?: () => void;
}

const MAX_PLAYLISTS = 25;

export default function AddToPlaylistMenu({ songId, onSuccess }: AddToPlaylistMenuProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const data = await getPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load playlists',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    setAddingToPlaylist(playlistId);
    try {
      await addSongToPlaylist(playlistId, songId);
      notifications.show({
        title: 'Success',
        message: `Added to "${playlistName}"`,
        color: 'green',
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to add song to playlist',
        color: 'red',
      });
    } finally {
      setAddingToPlaylist(null);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    if (playlists.length >= MAX_PLAYLISTS) {
      notifications.show({
        title: 'Limit Reached',
        message: `You can only create up to ${MAX_PLAYLISTS} playlists`,
        color: 'orange',
      });
      return;
    }

    setCreating(true);
    try {
      const newPlaylist = await createPlaylist(newPlaylistName.trim());
      await addSongToPlaylist(newPlaylist.id, songId);
      
      notifications.show({
        title: 'Success',
        message: `Created "${newPlaylistName}" and added song`,
        color: 'green',
      });
      
      setNewPlaylistName('');
      setShowCreateModal(false);
      await fetchPlaylists();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating playlist:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create playlist',
        color: 'red',
      });
    } finally {
      setCreating(false);
    }
  };

  const canCreatePlaylist = playlists.length < MAX_PLAYLISTS;

  return (
    <>
      <Menu.Dropdown p={4}>
        {loading ? (
          <Menu.Item>
            <Loader size="sm" />
          </Menu.Item>
        ) : playlists.length === 0 ? (
          <Menu.Item disabled>
            <Text size="sm" c="dimmed">No playlists yet</Text>
          </Menu.Item>
        ) : (
          playlists.map((playlist) => (
            <Menu.Item
              key={playlist.id}
              onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
              disabled={addingToPlaylist === playlist.id}
              leftSection={addingToPlaylist === playlist.id ? <Loader size="xs" /> : <IconPlaylistAdd size={16} />}
            >
              {playlist.name}
            </Menu.Item>
          ))
        )}
        
        <Menu.Divider />
        
        <Menu.Item
          onClick={() => setShowCreateModal(true)}
          leftSection={<IconPlus size={16} />}
          disabled={!canCreatePlaylist}
        >
          {canCreatePlaylist ? 'Create Playlist' : `Limit reached (${MAX_PLAYLISTS} max)`}
        </Menu.Item>
      </Menu.Dropdown>

      <Modal
        opened={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewPlaylistName('');
        }}
        title="Create New Playlist"
        centered
        size="md"
      >
        <TextInput
          label="Playlist Name"
          placeholder="Enter playlist name"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          disabled={creating}
          data-autofocus
          size="md"
        />
        
        <Button
          fullWidth
          mt="md"
          onClick={handleCreatePlaylist}
          disabled={creating || !newPlaylistName.trim()}
          loading={creating}
          size="md"
        >
          Create and Add Song
        </Button>
      </Modal>
    </>
  );
}
