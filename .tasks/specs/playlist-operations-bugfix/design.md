# Design Document

## Overview

This design addresses critical bugs in the playlist operations system that are causing 500 Internal Server Errors. The issues stem from improper error handling, missing error logging, and potential race conditions in the backend controllers. The solution involves adding comprehensive error handling, improving logging, and ensuring proper error propagation from backend to frontend.

## Architecture

The playlist operations system follows a three-tier architecture:

1. **Frontend Layer**: React components that trigger playlist operations
2. **API Client Layer**: TypeScript service that makes HTTP requests to the backend
3. **Backend Layer**: Express controllers that handle business logic and database operations

The bug fixes will focus on:
- Enhancing error handling in backend controllers
- Adding comprehensive logging at all layers
- Improving error response parsing in the API client
- Ensuring proper error propagation through the stack

## Components and Interfaces

### Backend Controllers

**playlistController.ts**
- `addSongToPlaylist`: Handles POST /playlists/:id/songs
- `removeSongFromPlaylist`: Handles DELETE /playlists/:id/songs/:songId

**playlistSharingController.ts**
- `updateVisibility`: Handles PUT /playlists/:id/visibility

### API Client

**api.ts**
- `addSongToPlaylist(playlistId, songId)`: Makes POST request to add song
- `removeSongFromPlaylist(playlistId, songId)`: Makes DELETE request to remove song
- `updatePlaylistVisibility(playlistId, visibility)`: Makes PUT request to update visibility
- `parseResponse<T>(response)`: Parses API responses and handles errors

### Error Response Interface

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

## Data Models

No changes to existing data models are required. The Playlist and Song models remain unchanged.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Error response structure consistency
*For any* failed API request, the error response should contain a structured error object with code, message, and optional details fields
**Validates: Requirements 1.5, 2.5, 3.5**

### Property 2: Permission enforcement
*For any* playlist operation requiring edit permissions, the system should verify the user is either the owner or a collaborator before allowing the operation
**Validates: Requirements 1.3, 2.3, 3.2**

### Property 3: Error logging completeness
*For any* failed playlist operation, the system should log the error with complete context including user ID, playlist ID, operation type, and timestamp
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 4: Idempotent song removal
*For any* playlist and song, removing a song that doesn't exist in the playlist should return a 404 error without modifying the playlist
**Validates: Requirements 2.2**

### Property 5: Duplicate song prevention
*For any* playlist and song, attempting to add a song that already exists should return an error without modifying the playlist
**Validates: Requirements 1.2**

## Error Handling

### Backend Error Handling

1. **Try-Catch Blocks**: All controller functions wrap operations in try-catch blocks
2. **Validation Errors**: Return 400 status with specific error codes
3. **Permission Errors**: Return 403 status with access denied messages
4. **Not Found Errors**: Return 404 status when resources don't exist
5. **Database Errors**: Return 500 status with sanitized error details
6. **Error Logging**: Log all errors with context before returning response

### Frontend Error Handling

1. **API Client**: Parse error responses and throw ApiError instances
2. **Component Level**: Catch errors and display user-friendly notifications
3. **Console Logging**: Log detailed error information for debugging
4. **User Feedback**: Show toast notifications with error messages

### Error Logging Strategy

**Backend Logging:**
```typescript
console.error('Error in [operation]:', {
  userId,
  playlistId,
  songId,
  operation: '[operation_name]',
  timestamp: new Date().toISOString(),
  error: errorMessage,
  stack: error.stack,
});
```

**Frontend Logging:**
```typescript
console.error('API Error:', {
  endpoint,
  method,
  status,
  error: apiError,
  timestamp: new Date().toISOString(),
});
```

## Testing Strategy

### Unit Testing

We will use Jest for unit testing the backend controllers and API client functions.

**Backend Tests:**
- Test each controller function with valid inputs
- Test permission validation logic
- Test error handling for invalid inputs
- Test database error scenarios using mocks

**Frontend Tests:**
- Test API client error parsing
- Test error response handling
- Test ApiError instantiation

### Property-Based Testing

We will use fast-check for property-based testing in TypeScript.

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with format: `**Feature: playlist-operations-bugfix, Property {number}: {property_text}**`

**Property Tests:**
1. Error response structure validation across random error scenarios
2. Permission enforcement across random user/playlist combinations
3. Error logging completeness verification
4. Idempotent song removal behavior
5. Duplicate song prevention behavior

### Integration Testing

- Test complete flow from frontend API call through backend to database
- Test error propagation through all layers
- Test concurrent operations to identify race conditions
- Test with real database connections (test database)

### Manual Testing

- Test each operation in the browser with network tab open
- Verify error messages are user-friendly
- Verify console logs contain sufficient debugging information
- Test with different user permission levels
