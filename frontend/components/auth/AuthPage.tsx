'use client';

import { Loader } from '@mantine/core';
import { Suspense } from 'react';
import { AuthForm } from './AuthForm';
import { AuthLayout } from './AuthLayout';

interface AuthPageProps {
  readonly mode: 'login' | 'register';
}

const PAGE_CONFIG = {
  login: {
    title: 'Welcome Back',
    subtitle: 'Sign in to your music library',
  },
  register: {
    title: 'Create Account',
    subtitle: 'Sign up to start building your music library',
  },
};

function AuthPageContent({ mode }: AuthPageProps) {
  const currentConfig = PAGE_CONFIG[mode];

  return (
    <AuthLayout title={currentConfig.title} subtitle={currentConfig.subtitle}>
      <AuthForm mode={mode} />
    </AuthLayout>
  );
}

export function AuthPage({ mode }: AuthPageProps) {
  return (
    <Suspense fallback={<Loader />}>
      <AuthPageContent mode={mode} />
    </Suspense>
  );
}
