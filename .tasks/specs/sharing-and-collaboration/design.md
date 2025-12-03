# Sharing & Collaboration - Design Document

## Architecture Overview

### Data Model

```typescript
// Updated Playlist Model
interface Playlist {
  id: string;
  name: string;
  ownerId: string; // User who created the playlist
  visibility: 'private' | 'shared' | 'public';
  collaborators: string[]; // User IDs who can edit
  followers: string[]; // User IDs who follow this playlist
  songIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// New FollowedPlaylist Model (for user's followed playlists)
interface FollowedPlaylist {
  userId: string;
  playlistId: string;
  followedAt: Date;
}
```

### API Design

#### Update Playlist Visibility
```
PUT /playlists/:id/visibility
Authorization: Bearer <token>
Body: { visibility: 'private' | 'shared' | 'public' }
Response: { playlist: Playlist }
```

#### Add Collaborator
```
POST /playlists/:id/collaborators
Authorization: Bearer <token>
Body: { userId: string }
Response: { playlist: Playlist }
```

#### Remove Collaborator
```
DELETE /playlists/:id/collaborators/:userId
Authorization: Bearer <token>
Response: { success: boolean }
```

#### Follow Playlist
```
POST /playlists/:id/follow
Authorization: Bearer <token>
Response: { success: boolean }
```

#### Unfollow Playlist
```
DELETE /playlists/:id/follow
Authorization: Bearer <token>
Response: { success: boolean }
```

#### Get Public Playlists
```
GET /playlists/public?limit=20&offset=0&search=query
Authorization: Bearer <token>
Response: { playlists: Playlist[], total: number }
```

#### Get Discover Playlists
```
GET /playlists/discover?limit=20
Authorization: Bearer <token>
Response: { playlists: Playlist[] }
```

#### Generate Share Link
```
GET /playlists/:id/share-link
Authorization: Bearer <token>
Response: { shareLink: string }
```

### Permission System

```typescript
enum PlaylistPermission {
  OWNER = 'owner',       // Full control
  COLLABORATOR = 'collaborator', // Can edit songs
  FOLLOWER = 'follower', // Read-only
  NONE = 'none'          // No access
}

function getPlaylistPermission(playlist: Playlist, userId: string): PlaylistPermission {
  if (playlist.ownerId === userId) return PlaylistPermission.OWNER;
  if (playlist.collaborators.includes(userId)) return PlaylistPermission.COLLABORATOR;
  if (playlist.visibility === 'public') return PlaylistPermission.FOLLOWER;
  if (playlist.visibility === 'shared' && playlist.collaborators.includes(userId)) {
    return PlaylistPermission.COLLABORATOR;
  }
  return PlaylistPermission.NONE;
}
```

## UI/UX Design

### Playlist Detail Page Updates

1. **Share Button**
   - Located in playlist header next to "Play All"
   - Opens share modal when clicked
   - Shows current visibility status

2. **Share Modal**
   - Visibility toggle (Private/Shared/Public)
   - Collaborator management section
   - Copy shareable link button
   - Save/Cancel buttons

3. **Playlist Indicators**
   - Badge showing visibility status
   - Owner name display
   - Collaborator count (if applicable)
   - Follower count (for public playlists)

### Discover Page

1. **Layout**
   - Search bar at top
   - Filter options (Most Popular, Recently Created, Most Followed)
   - Grid of playlist cards
   - Pagination controls

2. **Playlist Card**
   - Playlist name
   - Owner name
   - Song count
   - Follower count
   - Preview button
   - Follow/Unfollow button

3. **Playlist Preview Modal**
   - Full playlist details
   - Song list (first 10 songs)
   - Follow button
   - "View Full Playlist" button

### Navigation Updates

- Add "Discover" link to main navigation
- Add "Followed Playlists" section in playlists page

## Component Structure

```
frontend/
├── app/
│   ├── discover/
│   │   └── page.tsx (Discover page)
│   └── playlists/
│       └── [id]/
│           └── page.tsx (Updated with sharing)
├── components/
│   ├── SharePlaylistModal.tsx
│   ├── PlaylistCard.tsx
│   ├── PlaylistPreviewModal.tsx
│   ├── CollaboratorManager.tsx
│   └── VisibilityToggle.tsx
└── contexts/
    └── PlaylistSharingContext.tsx (Optional)
```

## State Management

### Playlist Sharing State
```typescript
interface PlaylistSharingState {
  visibility: 'private' | 'shared' | 'public';
  collaborators: User[];
  followers: User[];
  isOwner: boolean;
  canEdit: boolean;
  shareLink: string;
}
```

## Security Considerations

1. **Authorization Checks**
   - Verify user permissions on every playlist operation
   - Prevent unauthorized access to private playlists
   - Validate collaborator additions

2. **Data Validation**
   - Validate playlist IDs
   - Validate user IDs for collaborators
   - Sanitize search queries

3. **Rate Limiting**
   - Limit follow/unfollow actions per user
   - Limit collaborator additions per playlist

## Performance Optimization

1. **Database Indexes**
   - Index on `visibility` field
   - Compound index on `visibility` and `createdAt`
   - Index on `followers` array

2. **Caching**
   - Cache public playlists list
   - Cache user's followed playlists
   - Invalidate cache on playlist updates

3. **Pagination**
   - Implement cursor-based pagination for public playlists
   - Limit results to 20 per page

## Error Handling

1. **Permission Errors**
   - 403 Forbidden for unauthorized access
   - Clear error messages for users

2. **Not Found Errors**
   - 404 for non-existent playlists
   - Graceful handling in UI

3. **Validation Errors**
   - 400 Bad Request for invalid inputs
   - Display validation errors in forms

## Testing Strategy

1. **Unit Tests**
   - Permission checking logic
   - API endpoint handlers
   - Component rendering

2. **Integration Tests**
   - Playlist sharing flow
   - Follow/unfollow flow
   - Collaborator management

3. **E2E Tests**
   - Complete sharing workflow
   - Discover page functionality
   - Permission enforcement
