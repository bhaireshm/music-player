# Third-Party Music Integration (JioSaavn)

## Goal
Enable users to search and play "free and third-party music" (specifically Indian + English songs) alongside their uploaded library. We will use the **JioSaavn** (unofficial) API as the source, as it perfectly matches the "Indian + English" requirement.

## User Review Required
> [!IMPORTANT]
> This implementation relies on an **unofficial** JioSaavn API. If the external API changes or goes down, this feature may break.
> We are not saving external songs to the database initially; they will be "stream-only" from search results.

## Proposed Changes

### Backend

#### [NEW] [saavnService.ts](file:///d:/My_Codes/music-player/backend/src/services/saavnService.ts)
- Implement `SaavnService` to fetch data from JioSaavn.
- Methods: `searchSongs(query)`, `getStreamUrl(id)`.
- Will use a public unofficial API endpoint (e.g., `https://saavn.dev` or similar, or implement the logic directly if simple). *Decision: Use a direct fetch to a known public API wrapper or implement the scraping logic if robust.*
- **Note**: For stability, we will use a known public API wrapper for Saavn.

#### [MODIFY] [searchService.ts](file:///d:/My_Codes/music-player/backend/src/services/searchService.ts)
- Update `search` method to call `SaavnService.searchSongs` when filter is `all` or `songs`.
- Merge external results with local DB results.
- Mark external results with `isExternal: true`.

#### [MODIFY] [songController.ts](file:///d:/My_Codes/music-player/backend/src/controllers/songController.ts)
- Update `streamSong` or add a new endpoint to handle external streams if we need to proxy them (to avoid CORS or hide the source).
- *Alternative*: If the frontend can play the URL directly, we might not need this. However, Saavn streams often expire or need specific headers. A proxy is safer.

### Frontend

#### [MODIFY] [api.ts](file:///d:/My_Codes/music-player/frontend/lib/api.ts)
- Update `Song` interface:
  ```typescript
  export interface Song {
    // ... existing fields
    isExternal?: boolean;
    streamUrl?: string; // Direct URL for external songs
    externalId?: string;
    image?: string; // Saavn returns 'image' instead of 'albumArt' sometimes, need to map
  }
  ```

#### [MODIFY] [useAudioPlayer.ts](file:///d:/My_Codes/music-player/frontend/hooks/useAudioPlayer.ts)
- Update `loadSong` to check for `song.streamUrl`.
- If `song.isExternal` is true, use the `streamUrl` directly (or call a backend endpoint to get it if it's dynamic).

#### [MODIFY] [SearchOverlay.tsx](file:///d:/My_Codes/music-player/frontend/components/SearchOverlay.tsx)
- Update to render external results.
- Ensure clicking an external result plays it immediately.

## Verification Plan

### Automated Tests
- Unit tests for `SaavnService` (mocking the external API).

### Manual Verification
1.  **Search**: Search for a popular Indian song (e.g., "Kesariya").
2.  **Verify Results**: Ensure results appear in the search dropdown mixed with local songs.
3.  **Play**: Click a result and verify it plays.
4.  **Controls**: Verify pause/play/seek work for external tracks.
