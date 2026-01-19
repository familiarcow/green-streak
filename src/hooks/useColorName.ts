import { useMemo } from 'react';
import { useAccentColor } from './useAccentColor';
import { getColorName } from '../utils/colorUtils';

export const useColorName = (): string => {
  const accentColor = useAccentColor();
  return useMemo(() => getColorName(accentColor), [accentColor]);
};
