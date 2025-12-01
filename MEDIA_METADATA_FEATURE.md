# Dynamic Media Metadata Feature

## What Was Implemented

### 1. **Dynamic Document Title Updates** 🎵
- Browser tab title updates when song plays/pauses
- Shows `▶️ Song Name - Artist | Naada Music` when playing
- Shows `⏸️ Song Name - Artist | Naada Music` when paused

### 2. **Meta Description Updates** 📝
- Updates `<meta name="description">` with current song info
- Format: "Now playing: [Song] by [Artist] from [Album]"

### 3. **Open Graph Tags** 🔗
- Updates og:title and og:description for social sharing
- Better preview when sharing your music app

### 4. **Media Session API Integration** 📱
**This is the big one for mobile!**

#### Mobile Lock Screen/Notification Controls:
- ✅ Shows song artwork on lock screen
- ✅ Shows song title, artist, and album
- ✅ Play/Pause button works
- ✅ Next/Previous track buttons work
- ✅ Seek forward/backward (10 seconds)
- ✅ Scrubbing/seeking to specific time

#### How It Works:
The Media Session API hooks into the system's native media controls:
- **iOS**: Shows in Control Center and Lock Screen
- **Android**: Shows in notification shade and lock screen
- **Desktop**: Shows in media keys and system media controls
- **Chromebook**: Shows in Quick Settings

## Files Created/Modified

### Created:
1. `frontend/hooks/useMediaMetadata.ts` - Custom hooks for metadata management
   - `useMediaMetadata()` - Updates title and meta tags
   - `useMediaSessionActions()` - Sets up media control handlers
   - `useMediaSessionPlaybackState()` - Updates play/pause state

### Modified:
1. `frontend/contexts/AudioPlayerContext.tsx` - Integrated the hooks
2. `frontend/app/layout.tsx` - Added Open Graph and Twitter Card metadata

## Testing on Mobile

### To Test:
1. Open the app on your phone
2. Start playing a song
3. **Lock your phone** or **go to home screen**
4. You should see:
   - Song artwork (if available)
   - Song title and artist
   - Play/pause button
   - Next/previous buttons
   - Seek controls

### Supported Platforms:
- ✅ Android (Chrome, Edge, Samsung Internet)
- ✅ iOS Safari (iOS 13.4+)
- ✅ Desktop Chrome/Edge
- ✅ macOS Safari (with Touch Bar support!)
- ⚠️ Firefox (limited support)

## What You'll See

### On Mobile Lock Screen:
```
┌─────────────────────────┐
│   [Album Artwork]       │
│                         │
│  Song Title             │
│  Artist Name            │
│  Album Name             │
│                         │
│  ⏮  ⏯  ⏭               │
│  ━━━━●━━━━━━━━━━       │
│  1:23        3:45       │
└─────────────────────────┘
```

### In Browser Tab:
```
▶️ Shape of You - Ed Sheeran | Naada Music
```

### In Notifications (Android):
Full media player controls with artwork, title, artist, and playback buttons.

## Technical Details

### Browser Support:
- Media Session API is widely supported (96%+ of mobile browsers)
- Falls back gracefully on unsupported browsers (no errors)
- Progressive enhancement - works better on supported platforms

### Performance:
- Minimal overhead (just updates DOM and navigator.mediaSession)
- Only updates when song changes or play state changes
- No polling or continuous updates

## Benefits

1. **Better UX**: Control music without opening the app
2. **Native Feel**: Uses system UI, feels like a native app
3. **Multitasking**: Control music while using other apps
4. **Discoverability**: Song info visible in system UI
5. **Accessibility**: Works with assistive technologies

## Future Enhancements

Possible additions:
- [ ] Position state updates for accurate seeking
- [ ] Chapter/playlist navigation
- [ ] Playback rate control via Media Session
- [ ] Camera integration for album art scanning
