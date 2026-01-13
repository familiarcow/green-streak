/**
 * Glass Morphism Theme
 * 
 * Provides reusable glass effect styles for components.
 * Uses semi-transparent backgrounds and borders to create
 * a glass-like appearance that works across React Native platforms.
 */

import { ViewStyle, Platform } from 'react-native';
import { colors } from './colors';
import { shadows } from './spacing';

// Helper function to create glass colors with proper opacity
const getGlassColor = (opacity: number): string => {
  // Use white on dark backgrounds, slightly tinted
  return `rgba(255, 255, 255, ${opacity})`;
};

export const glassStyles = {
  // Main glass card with prominent effect
  card: {
    backgroundColor: getGlassColor(0.08),
    borderWidth: 1,
    borderColor: getGlassColor(0.15),
    overflow: 'hidden',
    ...shadows.md,
    // Platform-specific enhancements
    ...(Platform.OS === 'ios' && {
      shadowColor: 'rgba(255, 255, 255, 0.2)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    }),
  } as ViewStyle,
  
  // Subtle glass effect for nested elements
  cardSubtle: {
    backgroundColor: getGlassColor(0.05),
    borderWidth: 1,
    borderColor: getGlassColor(0.1),
    overflow: 'hidden',
  } as ViewStyle,
  
  // Glass effect for buttons and interactive elements
  button: {
    backgroundColor: getGlassColor(0.1),
    borderWidth: 1,
    borderColor: getGlassColor(0.2),
    overflow: 'hidden',
  } as ViewStyle,
  
  // Active/selected state for glass buttons
  buttonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    opacity: 0.95,
  } as ViewStyle,
  
  // Glass overlay for modal backgrounds
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    ...(Platform.OS === 'ios' && {
      // iOS can use blur view for better effect
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    }),
  } as ViewStyle,
  
  // Shimmer effect for loading states
  shimmer: {
    backgroundColor: getGlassColor(0.05),
    borderWidth: 1,
    borderColor: getGlassColor(0.08),
  } as ViewStyle,
};

// Utility function to merge glass styles with component styles
export const withGlassEffect = (
  variant: keyof typeof glassStyles,
  additionalStyles?: ViewStyle
): ViewStyle => {
  return {
    ...glassStyles[variant],
    ...additionalStyles,
  } as ViewStyle;
};

// Animation configurations for glass transitions
export const glassAnimations = {
  fadeIn: {
    duration: 300,
    opacity: { from: 0, to: 1 },
  },
  slideUp: {
    duration: 400,
    translateY: { from: 20, to: 0 },
    opacity: { from: 0, to: 1 },
  },
  scale: {
    duration: 250,
    scale: { from: 0.95, to: 1 },
    opacity: { from: 0.8, to: 1 },
  },
};