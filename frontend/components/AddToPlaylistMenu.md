# AddToPlaylistMenu Component

A Mantine-based component that provides a menu for adding songs to playlists.

## Features

- Displays a list of user's playlists in a dropdown menu
- Allows adding a song to multiple playlists
- Provides "Create Playlist" option with modal
- Enforces 25 playlist limit per user
- Shows success/error notifications
- Loading states for async operations

## Usage

The component is designed to be used within a Mantine Menu component:

```tsx
import { Menu, ActionIcon } from '@mantine/core';
import { IconDots } from '@tabler/icons-react';
import AddToPlaylistMenu from '@/components/AddToPlaylistMenu';

function SongItem({ song }) {
  return (
    <Menu>
      <Menu.Target>
        <ActionIcon>
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>
      
      <Menu.Dropdown>
        <Menu.Item>Play</Menu.Item>
        
        <Menu.Label>Add to Playlist</Menu.Label>
        <AddToPlaylistMenu 
          songId={song.id} 
          onSuccess={() => console.log('Song added!')}
        />
        
        <Menu.Item>Song Details</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
```

## Props

### `songId` (required)
- Type: `string`
- The ID of the song to add to playlists

### `onSuccess` (optional)
- Type: `() => void`
- Callback function called after successfully adding a song to a playlist or creating a new playlist

## Requirements

This component requires:
- `@mantine/core` v7.x or higher
- `@mantine/notifications` v7.x or higher
- `@tabler/icons-react` v3.x or higher
- Mantine Notifications provider configured in the app layout

## API Integration

The component uses the following API functions from `@/lib/api`:
- `getPlaylists()` - Fetches all user playlists
- `addSongToPlaylist(playlistId, songId)` - Adds a song to a playlist
- `createPlaylist(name)` - Creates a new playlist

## Notifications

The component shows notifications for:
- Success: When a song is added to a playlist
- Success: When a new playlist is created and song is added
- Error: When playlist loading fails
- Error: When adding to playlist fails
- Warning: When playlist limit (25) is reached
