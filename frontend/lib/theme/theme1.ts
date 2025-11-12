import { ThemePalette, ThemeConfig } from './types';
import { generateColorScale } from './color-utils';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { animations } from './animations';

/**
 * Theme 1 - Light Mode
 * Primary: Near white (#fffefe)
 * Secondary: Light purple-gray (#dbd8e0)
 * Tertiary: Dark brown-black (#181413)
 * Accent 1: Dark blue-gray (#36444f)
 * Accent 2: Bright pink (#f966b8)
 * Accent 3: Light blue (#aadcf1)
 */
export const theme1LightPalette: ThemePalette = {
  id: 'theme1',
  name: 'Theme 1',
  colors: {
    primary: '#fffefe',
    secondary: '#dbd8e0',
    tertiary: '#181413',
    accent1: '#36444f',
    accent2: '#f966b8',
    accent3: '#aadcf1',
  },
  mantineColors: {
    primary: generateColorScale('#fffefe'),
    secondary: generateColorScale('#dbd8e0'),
    tertiary: generateColorScale('#181413'),
    accent1: generateColorScale('#36444f'),
    accent2: generateColorScale('#f966b8'),
    accent3: generateColorScale('#aadcf1'),
  },
};

/**
 * Theme 1 - Dark Mode
 * Inverted colors for dark mode with appropriate adjustments
 */
export const theme1DarkPalette: ThemePalette = {
  id: 'theme1',
  name: 'Theme 1 Dark',
  colors: {
    primary: '#181413',    // Inverted from tertiary
    secondary: '#36444f',  // Darker variant
    tertiary: '#fffefe',   // Inverted from primary
    accent1: '#aadcf1',    // Lighter for dark background
    accent2: '#f966b8',    // Keep vibrant
    accent3: '#dbd8e0',    // Lighter variant
  },
  mantineColors: {
    primary: generateColorScale('#181413'),
    secondary: generateColorScale('#36444f'),
    tertiary: generateColorScale('#fffefe'),
    accent1: generateColorScale('#aadcf1'),
    accent2: generateColorScale('#f966b8'),
    accent3: generateColorScale('#dbd8e0'),
  },
};

/**
 * Theme 1 Light Mode Configuration
 */
export const theme1Light: ThemeConfig = {
  palette: theme1LightPalette,
  colors: {
    primary: theme1LightPalette.mantineColors.primary,
    secondary: theme1LightPalette.mantineColors.secondary,
    tertiary: theme1LightPalette.mantineColors.tertiary,
    accent1: theme1LightPalette.mantineColors.accent1,
    accent2: theme1LightPalette.mantineColors.accent2,
    accent3: theme1LightPalette.mantineColors.accent3,
  },
  primaryColor: 'primary',
  ...typography,
  ...spacing,
  defaultRadius: radius.defaultRadius,
  ...shadows,
  other: animations.other,
};

/**
 * Theme 1 Dark Mode Configuration
 */
export const theme1Dark: ThemeConfig = {
  palette: theme1DarkPalette,
  colors: {
    primary: theme1DarkPalette.mantineColors.primary,
    secondary: theme1DarkPalette.mantineColors.secondary,
    tertiary: theme1DarkPalette.mantineColors.tertiary,
    accent1: theme1DarkPalette.mantineColors.accent1,
    accent2: theme1DarkPalette.mantineColors.accent2,
    accent3: theme1DarkPalette.mantineColors.accent3,
  },
  primaryColor: 'primary',
  ...typography,
  ...spacing,
  defaultRadius: radius.defaultRadius,
  ...shadows,
  other: animations.other,
};

/**
 * Get Theme 1 configuration based on color scheme
 */
export function getTheme1Config(colorScheme: 'light' | 'dark'): ThemeConfig {
  return colorScheme === 'dark' ? theme1Dark : theme1Light;
}
