'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  SimpleGrid,
  Stack,
  Group,
  Center,
  Loader,
  ThemeIcon,
  Box,
} from '@mantine/core';
import {
  IconUpload,
  IconPlaylist,
  IconMusic,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect authenticated users to library
  useEffect(() => {
    if (!loading && user) {
      router.push('/library');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading...</Text>
        </Stack>
      </Center>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <Box
      style={(theme) => ({
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.other?.gradient || 'linear-gradient(135deg, var(--mantine-color-blue-0) 0%, var(--mantine-color-indigo-1) 100%)',
        padding: 'var(--mantine-spacing-md)',
      })}
    >
      <Container size="lg">
        <Stack align="center" gap="xl">
          <Stack align="center" gap="md">
            <Title
              order={1}
              size="3.5rem"
              ta="center"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
              }}
            >
              Welcome to Music Player
            </Title>
            <Text size="xl" c="dimmed" ta="center" maw={600}>
              Upload, organize, and stream your music collection from anywhere
            </Text>
          </Stack>

          <Card
            shadow="xl"
            padding="xl"
            radius="lg"
            style={{ width: '100%' }}
          >
            <Stack gap="xl">
              <SimpleGrid
                cols={{ base: 1, sm: 3 }}
                spacing="lg"
              >
                <Card padding="lg" radius="md" withBorder>
                  <Stack align="center" gap="md">
                    <ThemeIcon
                      size={64}
                      radius="xl"
                      variant="light"
                      color="blue"
                    >
                      <IconUpload size={32} />
                    </ThemeIcon>
                    <Title order={3} size="h4" ta="center">
                      Upload Your Music
                    </Title>
                    <Text size="sm" c="dimmed" ta="center">
                      Upload your favorite songs with automatic duplicate detection
                    </Text>
                  </Stack>
                </Card>

                <Card padding="lg" radius="md" withBorder>
                  <Stack align="center" gap="md">
                    <ThemeIcon
                      size={64}
                      radius="xl"
                      variant="light"
                      color="violet"
                    >
                      <IconPlaylist size={32} />
                    </ThemeIcon>
                    <Title order={3} size="h4" ta="center">
                      Create Playlists
                    </Title>
                    <Text size="sm" c="dimmed" ta="center">
                      Organize your music into custom playlists
                    </Text>
                  </Stack>
                </Card>

                <Card padding="lg" radius="md" withBorder>
                  <Stack align="center" gap="md">
                    <ThemeIcon
                      size={64}
                      radius="xl"
                      variant="light"
                      color="teal"
                    >
                      <IconMusic size={32} />
                    </ThemeIcon>
                    <Title order={3} size="h4" ta="center">
                      Stream Anywhere
                    </Title>
                    <Text size="sm" c="dimmed" ta="center">
                      Listen to your music from any device
                    </Text>
                  </Stack>
                </Card>
              </SimpleGrid>

              <Group justify="center" gap="md">
                <Button
                  component={Link}
                  href="/register"
                  size="lg"
                  radius="md"
                >
                  Get Started
                </Button>
                <Button
                  component={Link}
                  href="/login"
                  size="lg"
                  radius="md"
                  variant="default"
                >
                  Sign In
                </Button>
              </Group>
            </Stack>
          </Card>

          <Text size="sm" c="dimmed">
            Secure authentication powered by Firebase
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
