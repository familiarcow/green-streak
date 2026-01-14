/**
 * Color Utility Functions
 *
 * Provides conversion between HSV, RGB, and Hex color formats.
 */

export interface HSV {
  h: number; // 0-360
  s: number; // 0-1
  v: number; // 0-1
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * Convert HSV to RGB
 */
export const hsvToRgb = (h: number, s: number, v: number): RGB => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

/**
 * Convert RGB to HSV
 */
export const rgbToHsv = (r: number, g: number, b: number): HSV => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2);
    } else {
      h = 60 * ((rNorm - gNorm) / delta + 4);
    }
  }

  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
};

/**
 * Convert RGB to Hex string
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

/**
 * Convert Hex string to RGB
 */
export const hexToRgb = (hex: string): RGB | null => {
  const cleaned = hex.replace('#', '');

  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b };
};

/**
 * Convert Hex string to HSV
 */
export const hexToHsv = (hex: string): HSV | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
};

/**
 * Convert HSV to Hex string
 */
export const hsvToHex = (h: number, s: number, v: number): string => {
  const rgb = hsvToRgb(h, s, v);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
};

/**
 * Validate a hex color string
 */
export const isValidHex = (hex: string): boolean => {
  const cleaned = hex.replace('#', '');
  const hexRegex = /^[0-9A-Fa-f]{6}$|^[0-9A-Fa-f]{3}$/;
  return hexRegex.test(cleaned);
};

/**
 * Normalize a hex color to 6-digit format with # prefix
 */
export const normalizeHex = (hex: string): string => {
  const cleaned = hex.replace('#', '').toUpperCase();

  if (cleaned.length === 3) {
    return `#${cleaned[0]}${cleaned[0]}${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}`;
  }

  return `#${cleaned}`;
};

// ============================================
// Contribution Graph Color System
// ============================================

/**
 * Color palette for contribution graph intensity levels
 */
export interface ContributionColorPalette {
  empty: string;   // No activity (gray)
  level1: string;  // 1-25% intensity (lightest)
  level2: string;  // 26-50% intensity
  level3: string;  // 51-75% intensity
  level4: string;  // 76-100% intensity (darkest/full color)
}

/**
 * Default green contribution palette (GitHub-style)
 */
export const DEFAULT_CONTRIBUTION_PALETTE: ContributionColorPalette = {
  empty: '#EBEDF0',
  level1: '#9BE9A8',
  level2: '#40C463',
  level3: '#30A14E',
  level4: '#216E39',
};

/**
 * Get contribution color based on count and intensity
 * @param count - Number of completions for the day
 * @param maxCount - Maximum completions in the dataset (for normalization)
 * @param palette - Color palette to use (defaults to green)
 */
export const getContributionColor = (
  count: number,
  maxCount: number,
  palette: ContributionColorPalette = DEFAULT_CONTRIBUTION_PALETTE
): string => {
  if (count === 0) return palette.empty;

  const intensity = Math.min(count / Math.max(maxCount, 1), 1);

  if (intensity <= 0.25) return palette.level1;
  if (intensity <= 0.5) return palette.level2;
  if (intensity <= 0.75) return palette.level3;
  return palette.level4;
};

/**
 * Generate a contribution color palette from a base color
 * Creates 4 intensity levels by varying saturation and value in HSV space
 * @param baseColor - The full-intensity color (level4)
 */
export const generateContributionPalette = (baseColor: string): ContributionColorPalette => {
  const hsv = hexToHsv(baseColor);

  if (!hsv) {
    // Fallback to default if invalid color
    return DEFAULT_CONTRIBUTION_PALETTE;
  }

  const { h } = hsv;

  // Generate 4 levels with varying saturation and value
  // Level 4 is the base color, levels 1-3 are progressively lighter
  return {
    empty: '#EBEDF0', // Always gray for empty
    level1: hsvToHex(h, 0.3, 0.95),  // Very light, low saturation
    level2: hsvToHex(h, 0.5, 0.85),  // Light-medium
    level3: hsvToHex(h, 0.7, 0.70),  // Medium-dark
    level4: hsvToHex(h, 0.85, 0.55), // Full intensity (darker for visibility)
  };
};
