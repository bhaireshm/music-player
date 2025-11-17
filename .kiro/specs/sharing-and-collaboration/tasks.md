# Implementation Plan

## Backend Implementation

### Playlist Sharing & Collaboration

- [x] 1. Update Playlist model with sharing fields

  - Add `visibility` field (enum: 'private', 'shared', 'public', default: 'private')
  - Add `ownerId` field (String, required)
  - Add `collaborators` array field (array of user IDs)
  - Add `followers` array field (array of user IDs)
  - Add indexes on visibility and ownerId fields
  - Migrate existing playlists to set ownerId = userId
  - _Requirements: 1, 5_

- [x] 2. Create playlist sharing controller

  - Create `backend/src/controllers/playlistSharingController.ts`
  - Implement `updateVisibility` function
  - Implement `addCollaborator` function
  - Implement `removeCollaborator` function
  - Implement `followPlaylist` function
  - Implement `unfollowPlaylist` function
  - Implement `getPublicPlaylists` function with pagination
  - Implement `getDiscoverPlaylists` function
  - Implement `generateShareLink` function
  - _Requirements: 1, 2, 3, 4, 5_

- [x] 3. Create permission checking middleware

  - Create `backend/src/middleware/playlistPermissions.ts`
  - Implement `checkPlaylistOwner` middleware
  - Implement `checkPlaylistCollaborator` middleware
  - Implement `checkPlaylistAccess` middleware
  - Export permission checking functions
  - _Requirements: 5_

- [x] 4. Create playlist sharing routes

  - Create `backend/src/routes/playlistSharing.ts`
  - Add `PUT /playlists/:id/visibility` route
  - Add `POST /playlists/:id/collaborators` route
  - Add `DELETE /playlists/:id/collaborators/:userId` route
  - Add `POST /playlists/:id/follow` route
  - Add `DELETE /playlists/:id/follow` route
  - Add `GET /playlists/public` route
  - Add `GET /playlists/discover` route
  - Add `GET /playlists/:id/share-link` route
  - Apply authentication and permission middlewares
  - _Requirements: 1, 2, 3, 4, 5_

- [x] 5. Update existing playlist routes with permissions

  - Update `getPlaylist` to check visibility and permissions
  - Update `updatePlaylist` to check owner/collaborator permissions
  - Update `deletePlaylist` to check owner permission only
  - Return permission level in playlist responses
  - _Requirements: 5_

- [x] 6. Integrate sharing routes into application

  - Import sharing routes in `backend/src/index.ts`
  - Mount routes at appropriate paths
  - Test all endpoints with API client
  - _Requirements: 1, 2, 3, 4, 5_

### User Profile & Settings

- [x] 7. Update User model with profile fields

  - Add `displayName` field (String, optional)
  - Add `bio` field (String, optional, max 500 chars)
  - Add `avatarUrl` field (String, optional)
  - Add `preferences` object field (theme, language, notifications)
  - Add `updatedAt` field (Date)
  - _Requirements: User Profile_

- [x] 8. Create user profile controller

  - Create `backend/src/controllers/userController.ts`
  - Implement `getUserProfile` function (get current user profile)
  - Implement `updateUserProfile` function (update display name, bio, avatar)
  - Implement `getUserById` function (get public user info by ID)
  - Implement `searchUsers` function (search users by email/name for collaborators)
  - _Requirements: User Profile_

- [x] 9. Create user settings controller

  - Create `backend/src/controllers/userSettingsController.ts`
  - Implement `getUserSettings` function
  - Implement `updateUserSettings` function (theme, notifications, privacy)
  - _Requirements: Settings_

- [x] 10. Create user routes

  - Create `backend/src/routes/users.ts`
  - Add `GET /users/me` route (get current user profile)
  - Add `PUT /users/me` route (update current user profile)
  - Add `GET /users/:id` route (get public user info)
  - Add `GET /users/search` route (search users)
  - Add `GET /users/me/settings` route (get user settings)
  - Add `PUT /users/me/settings` route (update user settings)
  - Apply authentication middleware
  - _Requirements: User Profile, Settings_

- [x] 11. Integrate user routes into application

  - Import user routes in `backend/src/index.ts`
  - Mount routes at `/users` path
  - _Requirements: User Profile, Settings_

## Frontend Implementation

### Playlist Sharing & Collaboration

- [x] 12. Create playlist sharing context

  - Create `frontend/contexts/PlaylistSharingContext.tsx`
  - Implement state for visibility, collaborators, followers
  - Create functions for updating visibility
  - Create functions for managing collaborators
  - Create functions for following/unfollowing
  - _Requirements: 1, 3, 4_

- [x] 13. Extend API client with sharing endpoints

  - Add sharing functions to `frontend/lib/api.ts`
  - Implement `updatePlaylistVisibility(playlistId, visibility)`
  - Implement `addCollaborator(playlistId, userId)`
  - Implement `removeCollaborator(playlistId, userId)`
  - Implement `followPlaylist(playlistId)`
  - Implement `unfollowPlaylist(playlistId)`
  - Implement `getPublicPlaylists(limit, offset, search)`
  - Implement `getDiscoverPlaylists(limit)`
  - Implement `getShareLink(playlistId)`
  - _Requirements: 1, 2, 3, 4_

- [x] 14. Create SharePlaylistModal component

  - Create `frontend/components/SharePlaylistModal.tsx`
  - Add visibility toggle (Private/Shared/Public)
  - Add collaborator management section
  - Add copy share link button
  - Add save/cancel buttons
  - Integrate with PlaylistSharingContext
  - _Requirements: 1, 4, 5_

- [x] 15. Create VisibilityBadge component

  - Create `frontend/components/VisibilityBadge.tsx`
  - Display badge for Private/Shared/Public status
  - Use appropriate colors and icons
  - Make component reusable
  - _Requirements: 1, 5_

- [x] 16. Create CollaboratorManager component

  - Create `frontend/components/CollaboratorManager.tsx`
  - Display list of current collaborators
  - Add input to add new collaborators by email/ID
  - Add remove button for each collaborator
  - Show owner information
  - _Requirements: 4_

- [x] 17. Update playlist detail page with sharing

  - Update `frontend/app/playlists/[id]/page.tsx`
  - Add "Share" button in header
  - Add VisibilityBadge display
  - Show owner and collaborator information
  - Show follower count for public playlists
  - Disable edit actions for non-owners/collaborators
  - Open SharePlaylistModal on share button click
  - _Requirements: 1, 4, 5_

- [x] 18. Create Discover page

  - Create `frontend/app/discover/page.tsx`
  - Add search bar for public playlists
  - Add filter options (Most Popular, Recent, Most Followed)
  - Display grid of public playlist cards
  - Implement pagination
  - _Requirements: 2_

- [x] 19. Create PlaylistCard component

  - Create `frontend/components/PlaylistCard.tsx`
  - Display playlist name, owner, song count
  - Display follower count
  - Add preview button
  - Add follow/unfollow button
  - Use theme colors for styling
  - _Requirements: 2, 3_

- [x] 20. Create PlaylistPreviewModal component

  - Create `frontend/components/PlaylistPreviewModal.tsx`
  - Display full playlist details
  - Show first 10 songs
  - Add follow button
  - Add "View Full Playlist" button
  - _Requirements: 2, 3_

- [x] 21. Update playlists page with followed section

  - Update `frontend/app/playlists/page.tsx`
  - Add "My Playlists" and "Followed Playlists" tabs
  - Display followed playlists with "Followed" badge
  - Add unfollow option for followed playlists
  - _Requirements: 3_

- [x] 22. Add Discover link to navigation

  - Update `frontend/components/Navigation.tsx`
  - Add "Discover" navigation item
  - Use appropriate icon (IconCompass or IconWorld)
  - Highlight active state
  - _Requirements: 2_

- [x] 23. Implement notifications for sharing actions

  - Add success notifications for visibility changes
  - Add success notifications for collaborator actions
  - Add success notifications for follow/unfollow
  - Add error notifications for failed operations
  - _Requirements: 1, 3, 4_

- [x] 24. Add loading and error states

  - Add loading skeletons for discover page
  - Add loading states for sharing operations
  - Add error alerts for permission issues
  - Add empty states for no public playlists
  - _Requirements: 2_

- [x] 25. Implement responsive design for sharing features

  - Ensure sharing modal works on mobile
  - Make discover page responsive
  - Ensure playlist cards work on small screens
  - Test touch interactions
  - _Requirements: 1, 2_

### User Profile & Settings

- [x] 26. Extend API client with user endpoints

  - Add user functions to `frontend/lib/api.ts`
  - Implement `getUserProfile()` function
  - Implement `updateUserProfile(displayName, bio, avatarUrl)` function
  - Implement `getUserById(userId)` function
  - Implement `searchUsers(query)` function
  - Implement `getUserSettings()` function
  - Implement `updateUserSettings(settings)` function
  - _Requirements: User Profile, Settings_

- [x] 27. Create user profile page

  - Create `frontend/app/profile/page.tsx`
  - Display user avatar, display name, email, bio
  - Add edit profile button
  - Show user statistics (playlists count, songs count, followers)
  - Display user's public playlists
  - _Requirements: User Profile_

- [x] 28. Create EditProfileModal component

  - Create `frontend/components/EditProfileModal.tsx`
  - Add form fields for display name and bio
  - Add avatar upload/change functionality
  - Add save/cancel buttons
  - Show validation errors
  - _Requirements: User Profile_

- [x] 29. Update settings page with user preferences

  - Update `frontend/app/settings/page.tsx`
  - Add theme preference section (Light/Dark/System)
  - Add notification preferences section
  - Add privacy settings section (profile visibility)
  - Add account information section
  - Add save button for settings
  - _Requirements: Settings_

- [x] 30. Create UserAvatar component

  - Create `frontend/components/UserAvatar.tsx`
  - Display user avatar or initials fallback
  - Support different sizes (sm, md, lg)
  - Make component reusable across app
  - _Requirements: User Profile_

- [x] 31. Add profile link to navigation

  - Update `frontend/components/Navigation.tsx`
  - Add "Profile" navigation item or user menu
  - Show user avatar in navigation
  - Add dropdown with Profile and Settings links
  - _Requirements: User Profile_

- [x] 32. Update CollaboratorManager to use user search

  - Update `frontend/components/CollaboratorManager.tsx`
  - Integrate user search API for adding collaborators
  - Display user avatars and display names
  - Show user email as secondary info
  - _Requirements: User Profile, 4_

## Testing

- [ ]* 33. Write backend tests
  - Test permission checking logic
  - Test visibility update endpoint
  - Test collaborator management endpoints
  - Test follow/unfollow endpoints
  - Test public playlist queries
  - Test user profile endpoints
  - Test user settings endpoints
  - _Requirements: All_

- [ ]* 34. Write frontend tests
  - Test SharePlaylistModal component
  - Test PlaylistCard component
  - Test discover page functionality
  - Test permission-based UI rendering
  - Test profile page functionality
  - Test settings page functionality
  - _Requirements: All_

- [ ]* 35. Perform integration testing
  - Test complete sharing workflow
  - Test follow/unfollow flow
  - Test collaborator workflow
  - Test permission enforcement
  - Test user profile update flow
  - Test settings update flow
  - _Requirements: All_
