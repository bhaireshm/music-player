'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { 
  Container, 
  Paper, 
  Title, 
  Text, 
  TextInput, 
  PasswordInput, 
  Button, 
  Alert, 
  Anchor, 
  Stack, 
  Box, 
  Divider,
  rgba
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState, Suspense } from 'react';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/library';

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value: string) => (value.length > 0 ? null : 'Password is required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setError(null);

    try {
      await signIn(values.email, values.password);
      router.push(redirectUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      router.push(redirectUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Box
      style={(theme) => ({
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        pointerEvents: 'auto',
        touchAction: 'manipulation',
      })}
    >
      <Container size={420} w="100%" style={{ pointerEvents: 'auto' }}>
        <Paper 
          shadow="xl" 
          p={30} 
          radius="md"
          style={(theme) => ({
            background: rgba(theme.colors.primary[0], 0.95),
            pointerEvents: 'auto',
          })}
        >
          <Stack gap="md">
            <div>
              <Title 
                order={1} 
                ta="center" 
                mb={8}
                style={(theme) => ({
                  backgroundImage: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.accent2[7]} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                })}
              >
                Welcome Back
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Sign in to your music library
              </Text>
            </div>

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {error}
              </Alert>
            )}

            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              loading={googleLoading}
              variant="signin"
            />

            <Divider label="OR" labelPosition="center" />

            <form onSubmit={form.onSubmit(handleSubmit)} style={{ pointerEvents: 'auto' }}>
              <Stack gap="md" style={{ pointerEvents: 'auto' }}>
                <TextInput
                  label="Email Address"
                  placeholder="you@example.com"
                  required
                  disabled={loading || googleLoading}
                  size="md"
                  styles={{ input: { pointerEvents: 'auto', touchAction: 'manipulation' } }}
                  {...form.getInputProps('email')}
                />

                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  required
                  disabled={loading || googleLoading}
                  size="md"
                  styles={{ input: { pointerEvents: 'auto', touchAction: 'manipulation' } }}
                  {...form.getInputProps('password')}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  disabled={googleLoading}
                  variant="gradient"
                  gradient={{ from: 'accent1.7', to: 'accent2.7', deg: 135 }}
                  style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                >
                  Sign In
                </Button>
              </Stack>
            </form>

            <Text c="dimmed" size="sm" ta="center">
              Don&apos;t have an account?{' '}
              <Anchor component={Link} href="/register" size="sm" c="accent1.7">
                Sign up
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default function LoginPage(): React.ReactElement {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}