'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcut';
import { KEYBOARD_SHORTCUTS } from '@/lib/keyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';

/**
 * Component that registers global keyboard shortcuts for navigation
 */
export function GlobalKeyboardShortcuts() {
  const router = useRouter();
  const [helpModalOpened, setHelpModalOpened] = useState(false);

  useKeyboardShortcuts([
    {
      shortcut: KEYBOARD_SHORTCUTS.goHome,
      callback: () => router.push('/'),
    },
    {
      shortcut: KEYBOARD_SHORTCUTS.goLibrary,
      callback: () => router.push('/library'),
    },
    {
      shortcut: KEYBOARD_SHORTCUTS.goPlaylists,
      callback: () => router.push('/playlists'),
    },
    {
      shortcut: KEYBOARD_SHORTCUTS.focusSearch,
      callback: () => {
        // Focus the search input if it exists
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Search" i]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
    },
    {
      shortcut: KEYBOARD_SHORTCUTS.showHelp,
      callback: () => setHelpModalOpened(true),
    },
  ], !helpModalOpened); // Disable shortcuts when modal is open

  return (
    <KeyboardShortcutsModal
      opened={helpModalOpened}
      onClose={() => setHelpModalOpened(false)}
    />
  );
}
