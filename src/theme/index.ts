import colors from './colors';
import typography, { textStyles } from './typography';
import spacing, { borderRadius, shadows } from './spacing';
import themeUtils from './utils';
import { glassStyles, withGlassEffect, glassAnimations } from './glass';

export const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  borderRadius,
  shadows,
  glass: glassStyles,
  glassAnimations,
  utils: themeUtils,
};

export type Theme = typeof theme;

export { colors, typography, textStyles, spacing, borderRadius, shadows, themeUtils, glassStyles, withGlassEffect, glassAnimations };
export * from './colors';
export * from './utils';
export * from './glass';
export * from './achievements';

export default theme;