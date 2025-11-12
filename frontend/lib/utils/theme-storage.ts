import { ThemeId, ColorSchemeType, ThemeStorage } from '../theme/types';

const STORAGE_KEY = 'music-player-theme-preference';

/**
 * Default theme preferences
 */
const DEFAULT_PREFERENCES: ThemeStorage = {
  theme: 'theme1',
  colorScheme: 'auto',
  lastUpdated: Date.now(),
};

/**
 * Validates theme storage data
 */
function isValidThemeStorage(data: unknown): data is ThemeStorage {
  if (!data || typeof data !== 'object') return false;
  
  const storage = data as Partial<ThemeStorage>;
  
  const validThemes: ThemeId[] = ['theme1'];
  const validColorSchemes: ColorSchemeType[] = ['light', 'dark', 'auto'];
  
  return (
    typeof storage.theme === 'string' &&
    validThemes.includes(storage.theme as ThemeId) &&
    typeof storage.colorScheme === 'string' &&
    validColorSchemes.includes(storage.colorScheme as ColorSchemeType) &&
    typeof storage.lastUpdated === 'number'
  );
}

/**
 * Reads theme preferences from localStorage
 * Returns default preferences if storage is empty or invalid
 */
export function readThemePreferences(): ThemeStorage {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(stored);
    
    if (isValidThemeStorage(parsed)) {
      return parsed;
    }

    console.warn('Invalid theme storage data, using defaults');
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error reading theme preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Writes theme preferences to localStorage
 */
export function writeThemePreferences(preferences: Partial<ThemeStorage>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = readThemePreferences();
    const updated: ThemeStorage = {
      ...current,
      ...preferences,
      lastUpdated: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error writing theme preferences:', error);
  }
}

/**
 * Clears theme preferences from localStorage
 */
export function clearThemePreferences(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing theme preferences:', error);
  }
}

/**
 * Gets the current theme ID from storage
 */
export function getCurrentTheme(): ThemeId {
  return readThemePreferences().theme;
}

/**
 * Gets the current color scheme from storage
 */
export function getCurrentColorScheme(): ColorSchemeType {
  return readThemePreferences().colorScheme;
}

/**
 * Sets the theme ID in storage
 */
export function setTheme(theme: ThemeId): void {
  writeThemePreferences({ theme });
}

/**
 * Sets the color scheme in storage
 */
export function setColorScheme(colorScheme: ColorSchemeType): void {
  writeThemePreferences({ colorScheme });
}
