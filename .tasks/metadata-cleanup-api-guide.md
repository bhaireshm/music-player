# How to Perform Metadata Cleanup for Existing Songs

## Available APIs

### 1. **Single Song Cleanup** - `POST /songs/:id/cleanup`
Clean metadata for a specific song by ID.

**Endpoint:** `POST /api/songs/{songId}/cleanup`

**Example Request:**
```bash
curl -X POST "http://localhost:5000/api/songs/650a1b2c3d4e5f6789abcdef/cleanup" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**
```json
{
  "message": "Metadata cleaned successfully",
  "changes": [
    "Swapped title/artist (confidence: 90%): \"Anirudh Nadisha Thomas\" ↔ \"05 Come On Girls\"",
    "Cleaned title: \"05 Come On Girls\" → \"Come On Girls\"",
    "Cleaned artist: \"Anirudh_Nadisha_Thomas\" → \"Anirudh Nadisha Thomas\""
  ],
  "song": {
    "id": "650a1b2c3d4e5f6789abcdef",
    "title": "Come On Girls",
    "artist": "Anirudh Nadisha Thomas Maalavika Manoj",
    ...
  }
}
```

---

### 2. **Batch Cleanup (All Songs)** - `POST /songs/batch-cleanup` ⭐ RECOMMENDED

Clean metadata for all your songs in one request.

**Endpoint:** `POST /api/songs/batch-cleanup`

**Request Body:**
```json
{
  "processAll": true
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:5000/api/songs/batch-cleanup" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"processAll": true}'
```

**Example Response:**
```json
{
  "message": "Batch metadata cleanup completed",
  "total": 232,
  "processed": 45,
  "skipped": 187,
  "failed": 0,
  "results": [
    {
      "id": "650a1b2c3d4e5f6789abcdef",
      "title": "Come On Girls",
      "status": "success",
      "changes": [
        "Swapped (90%): \"Anirudh Nadisha Thomas\" ↔ \"05 Come On Girls\"",
        "Title: \"05 Come On Girls\" → \"Come On Girls\"",
        "Artist: \"Anirudh_Nadisha_Thomas\" → \"Anirudh Nadisha Thomas\""
      ]
    },
    {
      "id": "650a1b2c3d4e5f6789abcd00",
      "title": "Adadaa Ithuyenna",
      "status": "success",
      "changes": [
        "Title: \"Adadaa Ithuyenna [Starmusiq.xyz]\" → \"Adadaa Ithuyenna\""
      ]
    },
    {
      "id": "650a1b2c3d4e5f6789abcd01",
      "title": "Perfect Song Title",
      "status": "skipped"
    }
  ]
}
```

---

### 3. **Batch Cleanup (Specific Songs)** - `POST /songs/batch-cleanup`

Clean metadata for specific songs by providing their IDs.

**Request Body:**
```json
{
  "songIds": [
    "650a1b2c3d4e5f6789abcdef",
    "650a1b2c3d4e5f6789abcd00",
    "650a1b2c3d4e5f6789abcd01"
  ]
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:5000/api/songs/batch-cleanup" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "songIds": ["650a1b2c3d4e5f6789abcdef", "650a1b2c3d4e5f6789abcd00"]
  }'
```

---

## What Gets Cleaned?

### 1. **Swapped Title/Artist Detection** (AI-Enhanced)
- Detects when title and artist fields are reversed
- Uses 6 heuristic indicators + AI validation
- Minimum 75% confidence to swap
- Examples fixed:
  - `Title: "Anirudh Nadisha Thomas"` + `Artist: "05 Song Name"` → SWAPPED!

### 2. **Comprehensive Text Cleaning**
- ✅ Website names: `[Starmusiq.xyz]`, `[IndiaMusiQ.In]`
- ✅ Bitrate info: `(320Kbps)`, `128kbps`
- ✅ Quality tags: `Video Song`, `Official Audio`, `HD`
- ✅ Underscores to spaces: `Song_Name` → `Song Name`
- ✅ Plus signs to commas: `Artist1+Artist2` → `Artist1, Artist2`
- ✅ Track numbers: `01 Song Name` → `Song Name`
- ✅ Special characters, emojis, control characters
- ✅ Trailing junk: `Song_2` → `Song`

---

## How to Use (Frontend Integration)

### Option 1: Using Fetch API

```typescript
// Clean all songs
async function cleanAllSongs() {
  try {
    const response = await fetch('/api/songs/batch-cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${yourAuthToken}`
      },
      body: JSON.stringify({ processAll: true })
    });
    
    const result = await response.json();
    console.log(`Cleaned ${result.processed} of ${result.total} songs`);
    console.log('Results:', result.results);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// Clean specific song
async function cleanSong(songId: string) {
  try {
    const response = await fetch(`/api/songs/${songId}/cleanup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${yourAuthToken}`
      }
    });
    
    const result = await response.json();
    console.log('Changes:', result.changes);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}
```

### Option 2: Create a Cleanup Button in Your App

**Add to your frontend** (e.g., in Settings or Library page):

```typescript
import { useState } from 'react';
import { Button, Progress, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

function MetadataCleanupButton() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleCleanup = async () => {
    setLoading(true);
    setProgress(0);

    try {
      const response = await fetch('/api/songs/batch-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ processAll: true })
      });

      const result = await response.json();

      notifications.show({
        title: 'Cleanup Complete!',
        message: `Processed: ${result.processed}, Skipped: ${result.skipped}, Failed: ${result.failed}`,
        color: 'green'
      });

      // Show detailed results
      result.results
        .filter((r: any) => r.status === 'success')
        .forEach((r: any) => {
          console.log(`✓ ${r.title}:`, r.changes);
        });

    } catch (error) {
      notifications.show({
        title: 'Cleanup Failed',
        message: 'An error occurred during cleanup',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button 
        onClick={handleCleanup} 
        loading={loading}
        color="blue"
      >
        Clean All Metadata
      </Button>
      {loading && <Progress value={progress} mt="md" />}
    </div>
  );
}
```

---

## Testing/Verification

### 1. Check what will be cleaned (dry run)
First, query your songs to see which ones have problematic metadata:

```bash
curl -X GET "http://localhost:5000/api/songs" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Look for songs with:
- Bracket patterns: `[...]`
- Track numbers in artist field: `01 Song Name`
- Multiple artist names in title
- Underscores: `Song_Name`

### 2. Run cleanup on a single song first
Test with one problematic song:

```bash
curl -X POST "http://localhost:5000/api/songs/SONG_ID/cleanup" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Run batch cleanup on all songs
When confident, process all:

```bash
curl -X POST "http://localhost:5000/api/songs/batch-cleanup" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"processAll": true}'
```

---

## Response Status Codes

- `200` - Success (cleanup completed or already clean)
- `400` - Bad request (missing songIds or processAll)
- `403` - Forbidden (trying to clean someone else's song)
- `404` - Song not found
- `500` - Server error

---

## Security & Permissions

- ✅ Only song owners can clean their metadata
- ✅ Authentication required (Bearer token)
- ✅ Batch cleanup only processes your own songs
- ✅ Read-only operations don't modify data without explicit request

---

## Performance Considerations

- **Single song:** Near instant (~100-500ms)
- **Batch (100 songs):** ~10-30 seconds
- **Batch (1000 songs):** ~2-5 minutes

For large libraries (>500 songs), the response includes detailed results so you can track progress.

---

## Monitoring & Logs

Check backend console for detailed logs:

```
Starting batch metadata cleanup (processAll: true)
AI-enhanced cleanup for: Anirudh Nadisha Thomas - 05 Come On Girls
✓ Swapped fields (Heuristic detection confirmed by AI analysis)
Batch metadata cleanup completed
```

---

## Summary

**For your existing 232 songs with problems:**

```bash
# Clean ALL songs at once (RECOMMENDED)
POST /api/songs/batch-cleanup
Body: { "processAll": true }
```

This will:
1. ✅ Fix all swapped title/artist fields
2. ✅ Remove all website names and junk
3. ✅ Clean special characters
4. ✅ Format everything properly
5. ✅ Give you a detailed report of all changes

**Result:** Your problematic songs will all be fixed automatically!
