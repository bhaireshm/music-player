import { MantineThemeOverride } from '@mantine/core';

export type ThemeId = 'theme1';
export type ColorSchemeType = 'light' | 'dark' | 'auto';

export interface ThemePalette {
  id: ThemeId;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent1: string;
    accent2: string;
    accent3?: string;
  };
  mantineColors: {
    primary: [string, string, string, string, string, string, string, string, string, string];
    secondary: [string, string, string, string, string, string, string, string, string, string];
    tertiary: [string, string, string, string, string, string, string, string, string, string];
    accent1: [string, string, string, string, string, string, string, string, string, string];
    accent2: [string, string, string, string, string, string, string, string, string, string];
    accent3?: [string, string, string, string, string, string, string, string, string, string];
  };
}

export interface ThemeConfig extends MantineThemeOverride {
  palette: ThemePalette;
}

export interface ThemeStorage {
  theme: ThemeId;
  colorScheme: ColorSchemeType;
  lastUpdated: number;
}
