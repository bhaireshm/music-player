'use client';

import { ReactNode } from 'react';
import { MantineProvider, useMantineColorScheme } from '@mantine/core';
import { getTheme1Config } from '@/lib/theme';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Inner component that uses the color scheme
 */
function ThemeContent({ children }: { children: ReactNode }) {
  const { colorScheme } = useMantineColorScheme();
  const themeConfig = getTheme1Config(colorScheme === 'dark' ? 'dark' : 'light');

  return (
    <MantineProvider theme={themeConfig}>
      {children}
    </MantineProvider>
  );
}

/**
 * Client-side theme provider using theme1 configuration
 * Wraps MantineProvider with dynamic theme based on color scheme
 */
export default function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize with default light theme
  const defaultTheme = getTheme1Config('light');

  return (
    <MantineProvider theme={defaultTheme} defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}
