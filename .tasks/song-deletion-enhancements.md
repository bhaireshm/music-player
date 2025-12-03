# Song Deletion & Metadata Cleanup Enhancements

## Summary of Changes

This document outlines the enhancements made to the music player application to improve song deletion functionality and metadata cleaning.

## 1. Enhanced Metadata Cleanup

### Location: `backend/src/utils/metadataCleaner.ts`

#### New Features:
- **Special Character Cleaning**: Added comprehensive removal of control characters, emojis, and excessive special characters
- **Extended Domain Detection**: Expanded TLD list to include more domains (.de, .fr, .es, .it, .nl, .au, .ca, .jp, .cn, .br, .ru)
- **Enhanced Promo Phrase Detection**: Added more promotional phrases (powered by, brought to you by, courtesy of)
- **Year Validation**: Validates year values to ensure they're between 1900 and current year + 1
- **Comprehensive Field Cleaning**: Now cleans all metadata fields including:
  - Title
  - Artist
  - Album
  - Album Artist
  - Composer
  - Comment
  - Lyrics
  - Genre
  - Year
  - Any other string fields (except protected fields like fileKey, mimeType, id, _id, uploadedBy)

#### New Functions:
```typescript
cleanSpecialCharacters(text: string): string
```
- Removes control characters
- Removes emojis
- Removes multiple special characters in a row
- Cleans up excessive punctuation

#### Enhanced Functions:
- `cleanMetadataString()`: Now calls `cleanSpecialCharacters()` for more thorough cleaning
- `cleanMetadata()`: Expanded to handle all metadata fields with appropriate cleaning strategies

## 2. Delete Button in EditSongModal

### Location: `frontend/components/EditSongModal.tsx`

#### Changes:
- Added `onDelete` optional callback prop
- Integrated `useSongActions` hook for permission checking and delete functionality
- Added delete button in modal footer on the left side
- Delete button features:
  - Styled with red color to indicate destructive action
  - Only shown if user has permission to delete (canDelete check)
  - Triggers confirmation modal before deletion
  - Automatically closes the edit modal after successful deletion

#### Layout:
```
[Delete Song]              [Cancel] [Save Changes]
```

## 3. Delete Option Already in Song List

### Location: `frontend/components/SongListItem.tsx`

The delete option was already implemented in the song list menu (lines 228-240) using the `useSongActions` hook.

## 4. R2 Storage Deletion

### Location: `backend/src/controllers/songController.ts`

The R2 deletion was already properly implemented in the `deleteSong` function:
- Deletes file from R2 using `DeleteObjectCommand`
- Handles deletion errors gracefully
- Continues with database deletion even if R2 deletion fails
- Logs all deletion operations

## Testing Recommendations

### 1. Metadata Cleanup Testing
Test with songs that have metadata containing:
- URLs: `http://example.com`, `www.site.com`
- Domains: `song.mp3`, `artist.com`
- Special characters: emojis, control characters
- Promotional text: "downloaded from xyz", "powered by abc"
- Invalid years: "abcd", "1800", "3000"
- Track numbers in titles: "01 Song Name", "Song Name - 01"

### 2. Delete Functionality Testing
1. **From Song List**:
   - Open three-dot menu on any song
   - Verify delete option appears only for songs you own
   - Click delete and verify confirmation modal appears
   - Confirm deletion and verify song is removed

2. **From Edit Modal**:
   - Click edit icon in audio player or song details
   - Verify delete button appears on left side of modal
   - Click delete and verify confirmation modal appears
   - Confirm deletion and verify modal closes and song is removed

3. **R2 Deletion**:
   - Delete a song and check backend logs
   - Verify file deletion from R2 is logged
   - Verify database deletion is logged
   - Try to access the deleted song's stream URL (should fail)

### 3. Permission Testing
- Try to delete a song uploaded by another user
- Verify delete button/option doesn't appear
- If accessed via API directly, verify 403 Forbidden response

## Files Modified

1. `backend/src/utils/metadataCleaner.ts`
   - Enhanced with comprehensive metadata cleaning
   - Added special character removal
   - Added year validation
   - Extended field coverage

2. `frontend/components/EditSongModal.tsx`
   - Added delete button
   - Integrated useSongActions hook
   - Added onDelete callback prop

## Integration Points

### Frontend → Backend
- Delete button calls the API via `deleteSong()` from `lib/api.ts`
- API endpoint: `DELETE /songs/:id`
- Requires authentication token
- Returns success message or error

### Backend Flow
1. Verify song exists
2. Check user permissions
3. Delete from R2 storage
4. Delete from database
5. Return success response

## Error Handling

### Frontend
- Shows error notification if deletion fails
- Keeps modal open on error
- Logs errors to console

### Backend
- Validates song exists (404 if not found)
- Validates user permissions (403 if forbidden)
- Handles R2 deletion errors gracefully
- Continues with DB deletion even if R2 fails
- Returns appropriate error codes and messages

## Backward Compatibility

All changes are backward compatible:
- Optional `onDelete` prop in EditSongModal
- Enhanced metadata cleaning is more thorough but doesn't break existing functionality
- Delete functionality was already present in song list
