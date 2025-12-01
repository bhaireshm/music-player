'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Navigation from '@/components/Navigation';
import Sidebar from '@/components/Sidebar';
import { GlobalAudioPlayerProvider } from '@/components/GlobalAudioPlayer';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import SearchOverlay from '@/components/SearchOverlay';
import { GlobalKeyboardShortcuts } from '@/components/GlobalKeyboardShortcuts';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const [opened, { toggle, close }] = useDisclosure();

  // Auth pages should not have the AppShell layout
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <AudioPlayerProvider>
      <FavoritesProvider>
        <SearchProvider>
          <GlobalAudioPlayerProvider>
            <GlobalKeyboardShortcuts />
            <AppShell
              header={{ height: 60 }}
              navbar={{
                width: 250,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
              }}
              footer={{ height: 80 }}
              padding="md"
              styles={{
                header: {
                  zIndex: 100,
                },
                main: {
                  backgroundColor: 'var(--mantine-color-body)',
                }
              }}
            >
              <AppShell.Header>
                <Navigation opened={opened} toggle={toggle} />
              </AppShell.Header>

              <AppShell.Navbar p={0}>
                <Sidebar onClose={close} />
              </AppShell.Navbar>

              <AppShell.Main>{children}</AppShell.Main>
            </AppShell>
            <SearchOverlay />
          </GlobalAudioPlayerProvider>
        </SearchProvider>
      </FavoritesProvider>
    </AudioPlayerProvider>
  );
}
