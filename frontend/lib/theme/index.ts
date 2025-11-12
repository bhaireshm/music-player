export { typography } from './typography';
export { spacing } from './spacing';
export { radius } from './radius';
export { shadows } from './shadows';
export { animations, reducedMotionStyles } from './animations';
export { generateColorScale, adjustForContrast } from './color-utils';
export { theme1Light, theme1Dark, theme1LightPalette, theme1DarkPalette, getTheme1Config } from './theme1';
export type { ThemeId, ColorSchemeType, ThemePalette, ThemeConfig, ThemeStorage } from './types';

// Re-export consolidated theme constants for convenience
export * from '../theme-constants';
