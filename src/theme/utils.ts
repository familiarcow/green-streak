import spacing, { borderRadius } from './spacing';
import typography from './typography';

/**
 * Theme Utilities
 * 
 * Provides utility functions for consistent theme usage across components.
 * Helps prevent hardcoded values and ensures design system compliance.
 */

/**
 * Get consistent sizing values for common UI elements
 */
export const sizes = {
  // Common button and touch target sizes
  touchTarget: {
    small: 32,
    medium: 44,
    large: 56,
  },
  
  // Icon container sizes
  iconContainer: {
    small: 32,
    medium: 40,
    large: 48,
  },
  
  // Common element heights
  input: 44,
  buttonSmall: 32,
  buttonMedium: 44,
  buttonLarge: 56,
  
  // Progress elements
  progressDot: 6,
  progressBar: 8,
  
  // Badge sizes
  badge: {
    width: 16,
    height: 16,
  },
  
  // Modal handle
  modalHandle: {
    width: 40,
    height: 4,
  },
};

/**
 * Get consistent gap values for layouts
 */
export const gaps = {
  xxs: spacing[1],  // 4px
  xs: spacing[2],   // 8px
  sm: spacing[3],   // 12px
  md: spacing[4],   // 16px
  lg: spacing[6],   // 24px
  xl: spacing[8],   // 32px
  xxl: spacing[12], // 48px
};

/**
 * Get consistent border radius values
 */
export const radiusValues = {
  xs: borderRadius.sm,    // 2px
  box: borderRadius.box,  // 3px - Standard for small UI elements
  sm: borderRadius.base,  // 4px
  md: borderRadius.md,    // 6px
  lg: borderRadius.lg,    // 8px
  xl: borderRadius.xl,    // 12px
  xxl: borderRadius['2xl'], // 16px
  full: borderRadius.full,  // 9999px
};

/**
 * Get consistent font sizes for specific use cases
 */
export const fontSizes = {
  micro: typography.fontSizes.xs,     // 12px
  tiny: typography.fontSizes.sm,      // 14px
  small: typography.fontSizes.base,   // 16px
  medium: typography.fontSizes.lg,    // 18px
  large: typography.fontSizes.xl,     // 20px
  xlarge: typography.fontSizes['2xl'], // 24px
  huge: typography.fontSizes['3xl'],   // 30px
};

/**
 * Get consistent line heights
 */
export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.6,
  loose: 1.8,
};

/**
 * Get consistent z-index values
 */
export const zIndices = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

/**
 * Get consistent opacity values
 */
export const opacities = {
  disabled: 0.4,
  inactive: 0.6,
  subtle: 0.8,
  visible: 1.0,
};

/**
 * Common animation durations
 */
export const durations = {
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
};

/**
 * Helper function to validate theme values usage
 */
export const validateThemeUsage = (value: number, type: 'spacing' | 'fontSize' | 'borderRadius'): boolean => {
  switch (type) {
    case 'spacing':
      return Object.values(spacing).includes(value);
    case 'fontSize':
      return Object.values(typography.fontSizes).includes(value);
    case 'borderRadius':
      return Object.values(borderRadius).includes(value);
    default:
      return false;
  }
};

/**
 * Helper to get the closest theme value for a given number
 */
export const getClosestThemeValue = (value: number, type: 'spacing' | 'fontSize' | 'borderRadius'): number => {
  let themeValues: number[];
  
  switch (type) {
    case 'spacing':
      themeValues = Object.values(spacing);
      break;
    case 'fontSize':
      themeValues = Object.values(typography.fontSizes);
      break;
    case 'borderRadius':
      themeValues = Object.values(borderRadius);
      break;
    default:
      return value;
  }
  
  return themeValues.reduce((closest, current) => 
    Math.abs(current - value) < Math.abs(closest - value) ? current : closest
  );
};

export default {
  sizes,
  gaps,
  radiusValues,
  fontSizes,
  lineHeights,
  zIndices,
  opacities,
  durations,
  validateThemeUsage,
  getClosestThemeValue,
};