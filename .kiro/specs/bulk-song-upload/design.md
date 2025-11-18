# Design Document

## Overview

This design implements a robust bulk upload system that allows users to upload multiple audio files simultaneously with progress tracking, error handling, and metadata editing. The system uses a queue-based architecture with concurrent uploads and automatic retry logic.

## Architecture

The bulk upload system consists of:

1. **Upload Queue Manager**: Manages the queue of files to upload
2. **Upload Worker**: Handles individual file uploads with progress tracking
3. **Metadata Editor**: Allows editing file metadata before upload
4. **Progress UI**: Displays upload status and progress
5. **State Persistence**: Saves upload state for browser refresh recovery

## Components and Interfaces

### Upload Queue Manager

```typescript
interface UploadFile {
  id: string;
  file: File;
  title: string;
  artist: string;
  album?: string;
  status: 'pending' | 'uploading' | 'complete' | 'failed' | 'paused';
  progress: number;
  error?: string;
}

interface UploadQueue {
  files: UploadFile[];
  activeUploads: number;
  maxConcurrent: number;
  isPaused: boolean;
}
```

### Upload Worker

- Handles XMLHttpRequest for progress tracking
- Implements retry logic with exponential backoff
- Manages concurrent upload limit
- Emits progress events

### Components

**BulkUploadModal**
- File selection interface
- Metadata editing grid
- Upload progress display
- Pause/resume/cancel controls

**UploadProgressItem**
- Individual file progress bar
- Status indicators
- Retry button for failed uploads

## Data Models

No database schema changes required. Uses existing Song model.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do.*

### Property 1: Concurrent upload limit
*For any* upload queue, the number of simultaneously uploading files should never exceed the maximum concurrent limit
**Validates: Requirements 6.1**

### Property 2: Progress accuracy
*For any* uploading file, the progress percentage should be between 0 and 100 and should never decrease
**Validates: Requirements 2.2**

### Property 3: Status consistency
*For any* file in the queue, its status should accurately reflect its current state
**Validates: Requirements 2.1, 2.3, 2.4**

### Property 4: Metadata preservation
*For any* file being retried, its edited metadata should be preserved from the original upload attempt
**Validates: Requirements 4.4**

### Property 5: File validation
*For any* selected file, if it's not a valid audio format, it should be rejected before being added to the queue
**Validates: Requirements 1.2, 1.4**

## Error Handling

### Network Errors
- Automatic retry with exponential backoff (1s, 2s, 4s, 8s)
- Maximum 3 retry attempts per file
- Clear error messages for permanent failures

### File Validation Errors
- Check file type against allowed audio formats
- Validate file size (max 100MB per file)
- Display validation errors immediately

### Server Errors
- Handle 413 (file too large) gracefully
- Handle 500 errors with retry option
- Display server error messages to user

## Testing Strategy

### Unit Testing

- Test upload queue management
- Test concurrent upload limiting
- Test retry logic
- Test metadata extraction and editing
- Test progress calculation

### Integration Testing

- Test complete upload flow
- Test pause/resume functionality
- Test error handling and retry
- Test state persistence across page refresh

### Manual Testing

- Test with various file formats
- Test with large batches (50+ files)
- Test network interruption scenarios
- Test browser refresh during upload
