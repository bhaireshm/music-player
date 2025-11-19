/**
 * Centralized theme colors and gradients
 * Use these throughout the app for consistency
 */

import { MantineTheme } from '@mantine/core';

export const getGradient = (theme: MantineTheme, type: 'primary' | 'secondary' | 'accent' = 'primary') => {
  const gradients = {
    primary: `linear-gradient(135deg, ${theme.colors.accent1[7]} 0%, ${theme.colors.tertiary[6]} 100%)`,
    secondary: `linear-gradient(135deg, ${theme.colors.secondary[1]} 0%, ${theme.colors.accent2[1]} 100%)`,
    accent: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
  };
  return gradients[type];
};

export const getCardBackground = (theme: MantineTheme, colorScheme: string) => {
  return colorScheme === 'dark' ? theme.colors.primary[9] : theme.colors.primary[0];
};

export const getCardBorder = (theme: MantineTheme, colorScheme: string) => {
  return colorScheme === 'dark' ? theme.colors.secondary[8] : theme.colors.secondary[3];
};

export const getActiveBackground = (theme: MantineTheme, colorScheme: string) => {
  return `linear-gradient(135deg, ${theme.colors.accent1[1]} 0%, ${theme.colors.secondary[1]} 100%)`;
};

export const getTextGradient = (theme: MantineTheme) => {
  return {
    backgroundImage: `linear-gradient(135deg, ${theme.colors.accent1[8]} 0%, ${theme.colors.secondary[7]} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };
};

export const getHoverStyles = (theme: MantineTheme) => {
  return {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows.md,
  };
};

export const getTransition = (theme: MantineTheme) => {
  return `all ${theme.other.transitionDuration.normal} ${theme.other.easingFunctions.easeInOut}`;
};
