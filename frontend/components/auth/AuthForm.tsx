'use client';

import { GoogleSignInButton } from '@/components/GoogleSignInButton';
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
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface AuthFormProps {
    readonly mode: 'login' | 'register';
}

interface FormValues {
    email: string;
    password: string;
    confirmPassword?: string;
}

// Extracted configuration to avoid re-creation on render
const AUTH_CONFIG = {
    login: {
        title: 'Welcome Back',
        subtitle: 'Sign in to your music library',
        submitText: 'Sign In',
        googleVariant: 'signin' as const,
        linkText: "Don't have an account?",
        linkHref: '/register',
        linkLabel: 'Sign up',
    },
    register: {
        title: 'Create Account',
        subtitle: 'Sign up to start building your music library',
        submitText: 'Sign Up',
        googleVariant: 'signup' as const,
        linkText: 'Already have an account?',
        linkHref: '/login',
        linkLabel: 'Sign in',
    },
};

const INTERACTIVE_STYLE = { pointerEvents: 'auto' } as const;
const BUTTON_STYLE = { pointerEvents: 'auto', touchAction: 'manipulation' } as const;
const INPUT_STYLES = { input: BUTTON_STYLE } as const;

export function AuthForm({ mode }: AuthFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn, signUp, signInWithGoogle, loading } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Ensure the redirect param is a relative path and does not start with // (protocol relative)
    const redirectParam = searchParams.get('redirect');
    const redirectUrl = (redirectParam?.startsWith('/') && !redirectParam.startsWith('//'))
        ? redirectParam
        : '/library';

    const isLogin = mode === 'login';
    const currentConfig = AUTH_CONFIG[mode];

    // Dynamic form configuration based on mode
    const form = useForm({
        initialValues: {
            email: '',
            password: '',
            ...(isLogin ? {} : { confirmPassword: '' }),
        } as FormValues,
        validate: {
            email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            password: (value: string) => {
                if (value.length === 0) return 'Password is required';
                if (!isLogin && value.length < 6) return 'Password must be at least 6 characters';
                return null;
            },
            ...(isLogin ? {} : {
                confirmPassword: (value: string | undefined, values: FormValues) =>
                    value === values.password ? null : 'Passwords do not match',
            }),
        },
    });

    // Helper to centralize error handling logic
    const handleAuthError = (err: unknown, isGoogle: boolean = false) => {
        const actionName = isLogin ? 'sign in' : 'sign up';
        const suffix = isGoogle ? ' with Google' : '';
        const errorMessage = err instanceof Error ? err.message : `Failed to ${actionName}${suffix}`;

        if (isLogin) {
            notifications.show({
                color: 'red',
                title: isGoogle ? 'Google Sign In Failed' : 'Sign In Failed',
                message: errorMessage,
            });
        } else {
            setError(errorMessage);
        }
    };

    const handleSubmit = async (values: FormValues) => {
        setError(null);

        try {
            if (isLogin) {
                await signIn(values.email, values.password);
            } else {
                await signUp(values.email, values.password);
            }
            router.push(redirectUrl);
        } catch (err) {
            handleAuthError(err);
        }
    };

    const handleGoogleAuth = async () => {
        setError(null);
        setGoogleLoading(true);

        try {
            await signInWithGoogle();
            router.push(redirectUrl);
        } catch (err) {
            handleAuthError(err, true);
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <>
            {error && !isLogin && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                    {error}
                </Alert>
            )}

            <GoogleSignInButton
                onClick={handleGoogleAuth}
                loading={googleLoading}
                variant={currentConfig.googleVariant}
            />

            <Divider label="OR" labelPosition="center" />

            <form onSubmit={form.onSubmit(handleSubmit)} style={INTERACTIVE_STYLE}>
                <Stack gap="md" style={INTERACTIVE_STYLE}>
                    <TextInput
                        label="Email Address"
                        placeholder="you@example.com"
                        required
                        disabled={loading || googleLoading}
                        size="md"
                        styles={INPUT_STYLES}
                        {...form.getInputProps('email')}
                    />

                    <PasswordInput
                        label="Password"
                        placeholder="••••••••"
                        required
                        disabled={loading || googleLoading}
                        size="md"
                        styles={INPUT_STYLES}
                        {...form.getInputProps('password')}
                    />

                    {!isLogin && (
                        <PasswordInput
                            label="Confirm Password"
                            placeholder="••••••••"
                            required
                            disabled={loading || googleLoading}
                            size="md"
                            styles={INPUT_STYLES}
                            {...form.getInputProps('confirmPassword')}
                        />
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        disabled={googleLoading}
                        variant="gradient"
                        gradient={{ from: 'accent1.7', to: 'accent2.7', deg: 135 }}
                        style={BUTTON_STYLE}
                    >
                        {currentConfig.submitText}
                    </Button>
                </Stack>
            </form>

            <Text c="dimmed" size="sm" ta="center">
                {currentConfig.linkText}{' '}
                <Anchor component={Link} href={currentConfig.linkHref} size="sm" c="accent1.7">
                    {currentConfig.linkLabel}
                </Anchor>
            </Text>
        </>
    );
}
