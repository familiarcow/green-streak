export const typography = {
  // Cross-platform font families with proper fallbacks
  fontFamily: {
    system: {
      ios: '-apple-system',
      android: 'Roboto',
      default: 'system-ui',
    },
    mono: {
      ios: 'Menlo',
      android: 'monospace', 
      default: 'monospace',
    },
  },
  
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  lineHeights: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 42,
    '4xl': 48,
    '5xl': 64,
  },
  
  fontWeights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  
  letterSpacing: {
    tighter: -1,
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 1.5,
  },
};

// Helper function to get platform-appropriate font family
const getSystemFont = () => {
  return typography.fontFamily.system.default;
};

export const textStyles = {
  h1: {
    fontSize: typography.fontSizes['3xl'],
    lineHeight: typography.lineHeights['3xl'],
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.tight,
    fontFamily: getSystemFont(),
  },
  
  h2: {
    fontSize: typography.fontSizes['2xl'],
    lineHeight: typography.lineHeights['2xl'],
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.tight,
    fontFamily: getSystemFont(),
  },
  
  h3: {
    fontSize: typography.fontSizes.xl,
    lineHeight: typography.lineHeights.xl,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: typography.letterSpacing.normal,
    fontFamily: getSystemFont(),
  },
  
  h4: {
    fontSize: typography.fontSizes.lg,
    lineHeight: typography.lineHeights.lg,
    fontWeight: typography.fontWeights.semibold,
    letterSpacing: typography.letterSpacing.normal,
    fontFamily: getSystemFont(),
  },
  
  body: {
    fontSize: typography.fontSizes.base,
    lineHeight: typography.lineHeights.base,
    fontWeight: typography.fontWeights.normal,
    letterSpacing: typography.letterSpacing.normal,
    fontFamily: getSystemFont(),
  },
  
  bodySmall: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.fontWeights.normal,
    letterSpacing: typography.letterSpacing.normal,
    fontFamily: getSystemFont(),
  },
  
  caption: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.lineHeights.xs,
    fontWeight: typography.fontWeights.normal,
    letterSpacing: typography.letterSpacing.wide,
    fontFamily: getSystemFont(),
  },
  
  button: {
    fontSize: typography.fontSizes.base,
    lineHeight: typography.lineHeights.base,
    fontWeight: typography.fontWeights.medium,
    letterSpacing: typography.letterSpacing.wide,
    fontFamily: getSystemFont(),
  },
  
  buttonSmall: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm,
    fontWeight: typography.fontWeights.medium,
    letterSpacing: typography.letterSpacing.wide,
    fontFamily: getSystemFont(),
  },
};

export default typography;