'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Navigation from '@/components/Navigation';
import Sidebar from '@/components/Sidebar';
import { GlobalAudioPlayerProvider, useGlobalAudioPlayer } from '@/components/GlobalAudioPlayer';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import SearchOverlay from '@/components/SearchOverlay';
import { GlobalKeyboardShortcuts } from '@/components/GlobalKeyboardShortcuts';
import AudioPlayer from '@/components/AudioPlayer';

interface ClientLayoutProps {
  children: ReactNode;
}

function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [opened, { toggle, close }] = useDisclosure();
  const { currentSong } = useGlobalAudioPlayer();

  // Auth pages should not have the AppShell layout
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
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
            paddingBottom: 80, // Ensure content doesn't get hidden behind footer
          },
          footer: {
            zIndex: 200, // Ensure footer is above sidebar if needed, or sidebar pushes it
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

        <AppShell.Footer p={0} style={{ borderTop: 'none' }}>
          <AudioPlayer song={currentSong} />
        </AppShell.Footer>
      </AppShell>
      <SearchOverlay />
    </>
  );
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AudioPlayerProvider>
      <FavoritesProvider>
        <SearchProvider>
          <GlobalAudioPlayerProvider>
            <MainLayout>{children}</MainLayout>
          </GlobalAudioPlayerProvider>
        </SearchProvider>
      </FavoritesProvider>
    </AudioPlayerProvider>
  );
}
