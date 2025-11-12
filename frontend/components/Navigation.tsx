'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Burger,
  Button,
  Drawer,
  Group,
  Menu,
  ActionIcon,
  Text,
  NavLink,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSun,
  IconMoon,
  IconUser,
  IconLogout,
  IconMusic,
  IconPlaylist,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Navigation component with links to main pages and user authentication display
 * Shows current user email and logout button when authenticated
 * Includes responsive mobile menu with Burger and Drawer
 * Includes dark mode toggle button
 */
export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      closeDrawer();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <Group h="100%" px="md" justify="space-between">
        {/* Logo and Burger Menu */}
        <Group>
          {user && (
            <Burger
              opened={drawerOpened}
              onClick={toggleDrawer}
              hiddenFrom="md"
              size="sm"
            />
          )}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Text size="xl" fw={700} c="blue">
              Music Player
            </Text>
          </Link>
        </Group>

        {/* Desktop Navigation Links */}
        {user && (
          <Group gap="xs" visibleFrom="md">
            <Button
              variant={isActive('/library') ? 'filled' : 'subtle'}
              leftSection={<IconMusic size={16} />}
              onClick={() => router.push('/library')}
            >
              Library
            </Button>
            <Button
              variant={isActive('/playlists') ? 'filled' : 'subtle'}
              leftSection={<IconPlaylist size={16} />}
              onClick={() => router.push('/playlists')}
            >
              Playlists
            </Button>
          </Group>
        )}

        {/* Right Side: Dark Mode Toggle and User Menu */}
        <Group gap="xs">
          {/* Dark Mode Toggle */}
          <ActionIcon
            onClick={() => toggleColorScheme()}
            variant="default"
            size="lg"
            aria-label="Toggle color scheme"
          >
            {mounted && (colorScheme === 'dark' ? (
              <IconSun size={18} />
            ) : (
              <IconMoon size={18} />
            ))}
          </ActionIcon>

          {/* User Menu or Auth Buttons */}
          {user ? (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="default" size="lg" aria-label="User menu">
                  <IconUser size={18} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>{user.email}</Menu.Label>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={handleSignOut}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Group gap="xs">
              <Button variant="subtle" onClick={() => router.push('/login')}>
                Login
              </Button>
              <Button variant="filled" onClick={() => router.push('/register')}>
                Sign Up
              </Button>
            </Group>
          )}
        </Group>
      </Group>

      {/* Mobile Drawer Navigation */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="xs"
        padding="md"
        title="Menu"
        hiddenFrom="md"
      >
        <NavLink
          label="Library"
          leftSection={<IconMusic size={16} />}
          active={isActive('/library')}
          onClick={() => {
            router.push('/library');
            closeDrawer();
          }}
        />
        <NavLink
          label="Playlists"
          leftSection={<IconPlaylist size={16} />}
          active={isActive('/playlists')}
          onClick={() => {
            router.push('/playlists');
            closeDrawer();
          }}
        />
      </Drawer>
    </>
  );
}
