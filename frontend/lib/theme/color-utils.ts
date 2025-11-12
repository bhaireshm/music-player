/**
 * Generates a 10-shade color scale from a base color
 * Index 0: Lightest
 * Index 5: Base color
 * Index 9: Darkest
 */
export function generateColorScale(
  baseColor: string
): [string, string, string, string, string, string, string, string, string, string] {
  // Parse hex color
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Helper function to convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
    const toHex = (val: number) => clamp(val).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Helper function to lighten a color
  const lighten = (r: number, g: number, b: number, amount: number): string => {
    const newR = r + (255 - r) * amount;
    const newG = g + (255 - g) * amount;
    const newB = b + (255 - b) * amount;
    return rgbToHex(newR, newG, newB);
  };

  // Helper function to darken a color
  const darken = (r: number, g: number, b: number, amount: number): string => {
    const newR = r * (1 - amount);
    const newG = g * (1 - amount);
    const newB = b * (1 - amount);
    return rgbToHex(newR, newG, newB);
  };

  // Generate the scale
  const scale: [string, string, string, string, string, string, string, string, string, string] = [
    lighten(r, g, b, 0.9),   // 0 - Lightest
    lighten(r, g, b, 0.7),   // 1
    lighten(r, g, b, 0.5),   // 2
    lighten(r, g, b, 0.3),   // 3
    lighten(r, g, b, 0.15),  // 4
    baseColor,               // 5 - Base color
    darken(r, g, b, 0.15),   // 6
    darken(r, g, b, 0.3),    // 7
    darken(r, g, b, 0.5),    // 8
    darken(r, g, b, 0.7),    // 9 - Darkest
  ];

  return scale;
}

/**
 * Adjusts color brightness for better contrast
 */
export function adjustForContrast(color: string, isDark: boolean): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If the color is too dark for dark mode or too light for light mode, adjust it
  if (isDark && luminance < 0.3) {
    // Lighten for dark mode
    const factor = 0.4;
    const newR = r + (255 - r) * factor;
    const newG = g + (255 - g) * factor;
    const newB = b + (255 - b) * factor;
    return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
  } else if (!isDark && luminance > 0.7) {
    // Darken for light mode
    const factor = 0.6;
    const newR = r * factor;
    const newG = g * factor;
    const newB = b * factor;
    return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
  }

  return color;
}
