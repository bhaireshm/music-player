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
  useMantineTheme,
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
  const theme = useMantineTheme();

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
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
        padding: theme.spacing.md,
      }}
    >
      <Container size="lg">
        <Stack align="center" gap="xl">
          <Stack align="center" gap="md">
            <Title
              order={1}
              size="3.5rem"
              ta="center"
              c="tertiary.0"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                textShadow: `0 ${theme.spacing.xs} ${theme.spacing.sm} rgba(0, 0, 0, 0.3)`,
              }}
            >
              Welcome to Music Player
            </Title>
            <Text 
              size="xl" 
              c="tertiary.1" 
              ta="center" 
              maw={600}
            >
              Upload, organize, and stream your music collection from anywhere
            </Text>
          </Stack>

          <Card
            shadow="xl"
            padding="xl"
            radius="md"
            style={{
              width: '100%',
              background: `rgba(${parseInt(theme.colors.primary[9].slice(1, 3), 16)}, ${parseInt(theme.colors.primary[9].slice(3, 5), 16)}, ${parseInt(theme.colors.primary[9].slice(5, 7), 16)}, 0.95)`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Stack gap="xl">
              <SimpleGrid
                cols={{ base: 1, sm: 3 }}
                spacing="lg"
              >
                <Card 
                  padding="lg" 
                  radius="sm"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.accent1[6]} 0%, ${theme.colors.accent1[8]} 100%)`,
                    border: 'none',
                  }}
                >
                  <Stack align="center" gap="md">
                    <ThemeIcon
                      size={64}
                      radius="xl"
                      variant="light"
                      color="tertiary"
                    >
                      <IconUpload size={32} />
                    </ThemeIcon>
                    <Title order={3} size="h4" ta="center" c="tertiary.0">
                      Upload Your Music
                    </Title>
                    <Text size="sm" c="tertiary.1" ta="center">
                      Upload your favorite songs with automatic duplicate detection
                    </Text>
                  </Stack>
                </Card>

                <Card 
                  padding="lg" 
                  radius="sm"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.accent2[5]} 0%, ${theme.colors.accent2[7]} 100%)`,
                    border: 'none',
                  }}
                >
                  <Stack align="center" gap="md">
                    <ThemeIcon
                      size={64}
                      radius="xl"
                      variant="light"
                      color="tertiary"
                    >
                      <IconPlaylist size={32} />
                    </ThemeIcon>
                    <Title order={3} size="h4" ta="center" c="tertiary.0">
                      Create Playlists
                    </Title>
                    <Text size="sm" c="tertiary.1" ta="center">
                      Organize your music into custom playlists
                    </Text>
                  </Stack>
                </Card>

                <Card 
                  padding="lg" 
                  radius="sm"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.accent1[7]} 0%, ${theme.colors.secondary[6]} 100%)`,
                    border: 'none',
                  }}
                >
                  <Stack align="center" gap="md">
                    <ThemeIcon
                      size={64}
                      radius="xl"
                      variant="light"
                      color="tertiary"
                    >
                      <IconMusic size={32} />
                    </ThemeIcon>
                    <Title order={3} size="h4" ta="center" c="tertiary.0">
                      Stream Anywhere
                    </Title>
                    <Text size="sm" c="tertiary.1" ta="center">
                      Listen to your music from any device
                    </Text>
                  </Stack>
                </Card>
              </SimpleGrid>

              <Group justify="center" gap="md" wrap="wrap">
                <Button
                  component={Link}
                  href="/register"
                  size="lg"
                  radius="sm"
                  color="accent1"
                  variant="gradient"
                  gradient={{ from: 'accent1.6', to: 'accent1.8', deg: 135 }}
                  style={{
                    minWidth: 140,
                    touchAction: 'manipulation',
                  }}
                >
                  Get Started
                </Button>
                <Button
                  component={Link}
                  href="/login"
                  size="lg"
                  radius="sm"
                  variant="outline"
                  color="accent1"
                  style={{
                    minWidth: 140,
                    touchAction: 'manipulation',
                  }}
                >
                  Sign In
                </Button>
              </Group>
            </Stack>
          </Card>

          <Text size="sm" c="tertiary.2">
            Secure authentication powered by Firebase
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
