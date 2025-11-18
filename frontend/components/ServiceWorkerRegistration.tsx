'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/sw/register';
import { notifications } from '@mantine/notifications';

/**
 * Service Worker Registration Component
 * Handles SW registration and lifecycle events
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register in production or when explicitly enabled
    const isDev = process.env.NODE_ENV === 'development';
    const enableSWInDev = process.env.NEXT_PUBLIC_ENABLE_SW_DEV === 'true';

    if (isDev && !enableSWInDev) {
      console.log('[SW] Service worker disabled in development');
      return;
    }

    // Register service worker
    registerServiceWorker({
      onSuccess: () => {
        console.log('[SW] Service worker registered successfully');
        
        // Show success notification (only once)
        const hasShownNotification = sessionStorage.getItem('sw-registered');
        if (!hasShownNotification) {
          notifications.show({
            title: 'App Ready for Offline Use',
            message: 'You can now use this app offline!',
            color: 'green',
            autoClose: 5000,
          });
          sessionStorage.setItem('sw-registered', 'true');
        }
      },

      onUpdate: (registration) => {
        console.log('[SW] New version available');
        
        // Show update notification
        notifications.show({
          id: 'sw-update',
          title: 'Update Available',
          message: 'A new version is available. Refresh to update.',
          color: 'blue',
          autoClose: false,
          withCloseButton: true,
          onClick: () => {
            // Skip waiting and reload
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          },
        });
      },

      onWaiting: (registration) => {
        console.log('[SW] Service worker waiting');
        
        // Show update prompt
        notifications.show({
          id: 'sw-waiting',
          title: 'Update Ready',
          message: 'Click to activate the new version.',
          color: 'blue',
          autoClose: false,
          withCloseButton: true,
          onClick: () => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          },
        });
      },

      onError: (error) => {
        console.error('[SW] Registration failed:', error);
        
        // Only show error in production
        if (!isDev) {
          notifications.show({
            title: 'Offline Mode Unavailable',
            message: 'Could not enable offline features.',
            color: 'red',
            autoClose: 5000,
          });
        }
      },
    });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed, reloading...');
      window.location.reload();
    });

    // Cleanup
    return () => {
      // Remove event listeners if needed
    };
  }, []);

  return null; // This component doesn't render anything
}
