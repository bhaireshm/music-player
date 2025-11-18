/**
 * Service Worker Registration
 * Handles registration, updates, and lifecycle management
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
  onWaiting?: (registration: ServiceWorkerRegistration) => void;
}

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(
  config: ServiceWorkerConfig = {}
): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.log('[SW] Service workers not supported');
    return null;
  }

  try {
    console.log('[SW] Registering service worker...');
    
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] Service worker registered:', registration.scope);

    // Handle initial registration
    if (registration.installing) {
      console.log('[SW] Service worker installing');
      trackInstalling(registration.installing, config);
    } else if (registration.waiting) {
      console.log('[SW] Service worker waiting');
      if (config.onWaiting) {
        config.onWaiting(registration);
      }
    } else if (registration.active) {
      console.log('[SW] Service worker active');
      if (config.onSuccess) {
        config.onSuccess(registration);
      }
    }

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      console.log('[SW] Update found');
      const newWorker = registration.installing;
      
      if (newWorker) {
        trackInstalling(newWorker, config);
      }
    });

    // Check for updates periodically (every hour)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    if (config.onError) {
      config.onError(error as Error);
    }
    return null;
  }
}

/**
 * Track service worker installation
 */
function trackInstalling(worker: ServiceWorker, config: ServiceWorkerConfig) {
  worker.addEventListener('statechange', () => {
    console.log('[SW] State changed:', worker.state);
    
    if (worker.state === 'installed') {
      if (navigator.serviceWorker.controller) {
        // New service worker available
        console.log('[SW] New service worker available');
        if (config.onUpdate) {
          navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
              config.onUpdate!(registration);
            }
          });
        }
      } else {
        // First time installation
        console.log('[SW] Service worker installed for the first time');
        if (config.onSuccess) {
          navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
              config.onSuccess!(registration);
            }
          });
        }
      }
    } else if (worker.state === 'activated') {
      console.log('[SW] Service worker activated');
    }
  });
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('[SW] Service worker unregistered:', result);
      return result;
    }
    return false;
  } catch (error) {
    console.error('[SW] Unregistration failed:', error);
    return false;
  }
}

/**
 * Get service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration || null;
  } catch (error) {
    console.error('[SW] Failed to get registration:', error);
    return null;
  }
}

/**
 * Check if service worker is active
 */
export async function isServiceWorkerActive(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();
  return registration?.active !== null;
}

/**
 * Update service worker
 */
export async function updateServiceWorker(): Promise<void> {
  const registration = await getServiceWorkerRegistration();
  if (registration) {
    await registration.update();
    console.log('[SW] Update check triggered');
  }
}

/**
 * Skip waiting and activate new service worker
 */
export async function skipWaiting(): Promise<void> {
  const registration = await getServiceWorkerRegistration();
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    console.log('[SW] Skip waiting message sent');
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}

/**
 * Send message to service worker
 */
export async function sendMessageToSW(message: Record<string, unknown>): Promise<void> {
  const registration = await getServiceWorkerRegistration();
  if (registration?.active) {
    registration.active.postMessage(message);
  }
}

/**
 * Request background sync
 */
export async function requestBackgroundSync(tag: string): Promise<void> {
  const registration = await getServiceWorkerRegistration();
  
  if (registration && 'sync' in registration) {
    try {
      // TypeScript doesn't have types for Background Sync API yet
      const syncManager = (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync;
      await syncManager.register(tag);
      console.log('[SW] Background sync registered:', tag);
    } catch (error) {
      console.error('[SW] Background sync registration failed:', error);
      throw error;
    }
  } else {
    console.warn('[SW] Background sync not supported');
  }
}

/**
 * Check if app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for iOS standalone mode
  const isIOSStandalone = 'standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    isIOSStandalone ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if app can be installed
 */
export function canInstall(): boolean {
  return typeof window !== 'undefined' && 'BeforeInstallPromptEvent' in window;
}

/**
 * Get cache storage estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
} | null> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0;

    return { usage, quota, percentUsed };
  } catch (error) {
    console.error('[SW] Failed to get storage estimate:', error);
    return null;
  }
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator && 'persist' in navigator.storage)) {
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persist();
    console.log('[SW] Persistent storage:', isPersisted);
    return isPersisted;
  } catch (error) {
    console.error('[SW] Failed to request persistent storage:', error);
    return false;
  }
}

/**
 * Check if storage is persisted
 */
export async function isStoragePersisted(): Promise<boolean> {
  if (!('storage' in navigator && 'persisted' in navigator.storage)) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (error) {
    console.error('[SW] Failed to check storage persistence:', error);
    return false;
  }
}
