'use client';

import { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { theme1Dark } from '@/lib/theme';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Client-side theme provider using dark theme only
 */
export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <MantineProvider theme={theme1Dark} forceColorScheme="dark">
      {children}
    </MantineProvider>
  );
}
