'use client';

import { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { getTheme1Config } from '@/lib/theme';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Client-side theme provider using theme1 configuration
 * Wraps MantineProvider with theme1 light mode
 */
export default function ThemeProvider({ children }: ThemeProviderProps) {
  const themeConfig = getTheme1Config('light');

  return (
    <MantineProvider theme={themeConfig}>
      {children}
    </MantineProvider>
  );
}
