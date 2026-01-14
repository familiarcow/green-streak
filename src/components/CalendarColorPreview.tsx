import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ContributionColorPalette } from '../utils/colorUtils';
import { spacing } from '../theme';

interface CalendarColorPreviewProps {
  palette: ContributionColorPalette;
  size?: number;
  testID?: string;
}

/**
 * Displays a preview of all 4 calendar color intensity levels
 * Shows the gradient that will be used in the contribution graph
 */
export const CalendarColorPreview: React.FC<CalendarColorPreviewProps> = ({
  palette,
  size = 24,
  testID,
}) => {
  const levels = [
    palette.level1,
    palette.level2,
    palette.level3,
    palette.level4,
  ];

  return (
    <View style={styles.container} testID={testID}>
      {levels.map((color, index) => (
        <View
          key={index}
          style={[
            styles.swatch,
            {
              backgroundColor: color,
              width: size,
              height: size,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  swatch: {
    borderRadius: 3,
  },
});

export default CalendarColorPreview;
