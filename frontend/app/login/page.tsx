'use client';

import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  Alert,
  Anchor,
  Button,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

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
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your music library"
    >
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
    </AuthLayout>
  );
}

export default function LoginPage(): React.ReactElement {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}