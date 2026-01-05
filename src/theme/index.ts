import colors from './colors';
import typography, { textStyles } from './typography';
import spacing, { borderRadius, shadows } from './spacing';
import themeUtils from './utils';

export const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  borderRadius,
  shadows,
  utils: themeUtils,
};

export type Theme = typeof theme;

export { colors, typography, textStyles, spacing, borderRadius, shadows, themeUtils };
export * from './colors';
export * from './utils';

export default theme;