# Offline Mode & PWA - Design Document

## Architecture Overview

### PWA Components

```
music-player/
├── frontend/
│   ├── public/
│   │   ├── manifest.json
│   │   ├── icons/
│   │   │   ├── icon-192x192.png
│   │   │   ├── icon-512x512.png
│   │   │   └── icon-maskable.png
│   │   └── sw.js (Service Worker)
│   ├── app/
│   │   ├── offline/
│   │   │   └── page.tsx (Offline management)
│   │   └── layout.tsx (SW registration)
│   └── lib/
│       ├── sw/
│       │   ├── register.ts
│       │   ├── cache-strategies.ts
│       │   └── sync-manager.ts
│       └── offline/
│           ├── storage.ts (IndexedDB wrapper)
│           └── download-manager.ts
```

## Web App Manifest

```json
{
  "name": "Music Player",
  "short_name": "Music",
  "description": "Stream and manage your music collection",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ede0d4",
  "theme_color": "#b08968",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["music", "entertainment"],
  "shortcuts": [
    {
      "name": "Library",
      "url": "/library",
      "description": "View your music library"
    },
    {
      "name": "Playlists",
      "url": "/playlists",
      "description": "Manage your playlists"
    }
  ]
}
```

## Service Worker Design

### Cache Strategy

```typescript
// Cache names
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;

// Cache strategies
enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  NETWORK_ONLY = 'network-only',
  CACHE_ONLY = 'cache-only',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
}

// Route-based caching
const CACHE_ROUTES = {
  // Static assets - Cache First
  '/_next/static/': CacheStrategy.CACHE_FIRST,
  '/icons/': CacheStrategy.CACHE_FIRST,
  '/fonts/': CacheStrategy.CACHE_FIRST,
  
  // API calls - Network First
  '/api/': CacheStrategy.NETWORK_FIRST,
  
  // Audio files - Cache First (if marked for offline)
  '/songs/': CacheStrategy.CACHE_FIRST,
};
```

### Service Worker Lifecycle

```typescript
// Install event - Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/offline',
        '/_next/static/...',
        '/icons/...',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== AUDIO_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Apply caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const strategy = getCacheStrategy(request.url);
  
  event.respondWith(
    handleFetch(request, strategy)
  );
});
```

### Background Sync

```typescript
// Register sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  } else if (event.tag === 'sync-playlists') {
    event.waitUntil(syncPlaylists());
  }
});

// Sync implementation
async function syncFavorites() {
  const pendingActions = await getPendingFavoriteActions();
  
  for (const action of pendingActions) {
    try {
      await fetch('/api/favorites', {
        method: action.method,
        body: JSON.stringify(action.data),
      });
      await removePendingAction(action.id);
    } catch (error) {
      console.error('Sync failed:', error);
      // Will retry on next sync
    }
  }
}
```

## IndexedDB Schema

```typescript
// Database schema
const DB_NAME = 'music-player-db';
const DB_VERSION = 1;

const STORES = {
  SONGS: 'songs',
  PLAYLISTS: 'playlists',
  FAVORITES: 'favorites',
  OFFLINE_QUEUE: 'offline-queue',
  SYNC_QUEUE: 'sync-queue',
};

// Song store
interface OfflineSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  mimeType: string;
  cachedAt: Date;
  size: number;
  url: string;
}

// Sync queue store
interface SyncAction {
  id: string;
  type: 'favorite' | 'playlist' | 'upload';
  action: 'add' | 'remove' | 'update';
  data: any;
  timestamp: Date;
  retries: number;
}
```

## Offline Storage Manager

```typescript
class OfflineStorageManager {
  private db: IDBDatabase;
  private maxStorage: number = 500 * 1024 * 1024; // 500MB
  
  async downloadSong(songId: string): Promise<void> {
    // Check storage quota
    const available = await this.getAvailableStorage();
    if (available < 10 * 1024 * 1024) { // 10MB minimum
      throw new Error('Insufficient storage');
    }
    
    // Fetch song
    const response = await fetch(`/api/songs/${songId}`);
    const blob = await response.blob();
    
    // Cache audio file
    const cache = await caches.open(AUDIO_CACHE);
    await cache.put(`/songs/${songId}`, new Response(blob));
    
    // Store metadata in IndexedDB
    await this.storeSongMetadata(songId, blob.size);
  }
  
  async getOfflineSongs(): Promise<OfflineSong[]> {
    return await this.getAllFromStore(STORES.SONGS);
  }
  
  async removeSong(songId: string): Promise<void> {
    // Remove from cache
    const cache = await caches.open(AUDIO_CACHE);
    await cache.delete(`/songs/${songId}`);
    
    // Remove from IndexedDB
    await this.deleteFromStore(STORES.SONGS, songId);
  }
  
  async getStorageUsage(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
      };
    }
    return { used: 0, available: 0 };
  }
}
```

## UI Components

### Install Prompt Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button, Modal, Stack, Text } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };
  
  return (
    <Modal opened={showPrompt} onClose={() => setShowPrompt(false)}>
      <Stack>
        <Text>Install Music Player for quick access and offline features</Text>
        <Button leftSection={<IconDownload />} onClick={handleInstall}>
          Install App
        </Button>
      </Stack>
    </Modal>
  );
}
```

### Offline Indicator Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@mantine/core';
import { IconWifi, IconWifiOff } from '@tabler/icons-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (isOnline) return null;
  
  return (
    <Badge
      leftSection={<IconWifiOff size={14} />}
      color="yellow"
      variant="filled"
    >
      Offline Mode
    </Badge>
  );
}
```

### Download Button Component

```typescript
'use client';

import { useState } from 'react';
import { ActionIcon, Progress, Tooltip } from '@mantine/core';
import { IconDownload, IconCheck, IconX } from '@tabler/icons-react';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

interface DownloadButtonProps {
  songId: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function DownloadButton({ songId, size = 'md' }: DownloadButtonProps) {
  const { downloadSong, isDownloaded, isDownloading, progress } = useOfflineStorage();
  const [error, setError] = useState(false);
  
  const handleDownload = async () => {
    try {
      setError(false);
      await downloadSong(songId);
    } catch (err) {
      setError(true);
    }
  };
  
  if (isDownloaded(songId)) {
    return (
      <Tooltip label="Available offline">
        <ActionIcon color="green" variant="subtle" size={size}>
          <IconCheck />
        </ActionIcon>
      </Tooltip>
    );
  }
  
  if (isDownloading(songId)) {
    return (
      <Progress value={progress(songId)} size="sm" />
    );
  }
  
  if (error) {
    return (
      <Tooltip label="Download failed">
        <ActionIcon color="red" variant="subtle" size={size}>
          <IconX />
        </ActionIcon>
      </Tooltip>
    );
  }
  
  return (
    <Tooltip label="Download for offline">
      <ActionIcon onClick={handleDownload} variant="subtle" size={size}>
        <IconDownload />
      </ActionIcon>
    </Tooltip>
  );
}
```

## Update Mechanism

```typescript
// Check for updates
function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
}

// Listen for updates
navigator.serviceWorker.addEventListener('controllerchange', () => {
  // Show update notification
  showUpdateNotification();
});

function showUpdateNotification() {
  notifications.show({
    title: 'Update Available',
    message: 'A new version is available. Reload to update.',
    color: 'blue',
    autoClose: false,
    onClose: () => window.location.reload(),
  });
}
```

## Performance Considerations

1. **Lazy Loading**
   - Load service worker after initial page load
   - Defer non-critical cache operations

2. **Cache Size Management**
   - Implement LRU eviction for audio cache
   - Monitor storage quota
   - Warn users when approaching limit

3. **Network Optimization**
   - Use compression for cached responses
   - Implement request deduplication
   - Batch sync operations

## Testing Strategy

1. **Service Worker Testing**
   - Test install/activate lifecycle
   - Test caching strategies
   - Test offline functionality
   - Test background sync

2. **Storage Testing**
   - Test IndexedDB operations
   - Test cache management
   - Test quota handling

3. **Cross-Browser Testing**
   - Test on Chrome, Firefox, Safari, Edge
   - Test on iOS and Android
   - Test install flow on different platforms

4. **Offline Testing**
   - Test app functionality offline
   - Test sync when reconnecting
   - Test error handling
