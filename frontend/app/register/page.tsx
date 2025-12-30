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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/library';

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value: string) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
      confirmPassword: (value: string, values: { password: string }) =>
        value === values.password ? null : 'Passwords do not match',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setError(null);

    try {
      await signUp(values.email, values.password);
      router.push(redirectUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      setError(errorMessage);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      // useAuth.signInWithGoogle handles both sign-in and sign-up with sync
      await signInWithGoogle();
      router.push(redirectUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up with Google';
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up to start building your music library"
    >
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {error}
        </Alert>
      )}

      <GoogleSignInButton
        onClick={handleGoogleSignUp}
        loading={googleLoading}
        variant="signup"
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

          <PasswordInput
            label="Confirm Password"
            placeholder="••••••••"
            required
            disabled={loading || googleLoading}
            size="md"
            styles={{ input: { pointerEvents: 'auto', touchAction: 'manipulation' } }}
            {...form.getInputProps('confirmPassword')}
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
            Sign Up
          </Button>
        </Stack>
      </form>

      <Text c="dimmed" size="sm" ta="center">
        Already have an account?{' '}
        <Anchor component={Link} href="/login" size="sm" c="accent1.7">
          Sign in
        </Anchor>
      </Text>
    </AuthLayout>
  );
}

export default function RegisterPage(): React.ReactElement {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
