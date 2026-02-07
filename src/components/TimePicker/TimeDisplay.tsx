import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues } from '../../theme/utils';

interface TimeDisplayProps {
  hours: number; // 1-12 in 12h mode, 0-23 in 24h mode
  minutes: number; // 0-59
  isPM: boolean; // Only used in 12h mode
  onToggleAMPM: () => void;
  use24HourFormat?: boolean;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  hours,
  minutes,
  isPM,
  onToggleAMPM,
  use24HourFormat = false,
}) => {
  // In 24h mode, hours is already 0-23
  // In 12h mode, hours is 1-12 and we display as-is
  const displayHours = use24HourFormat ? hours : hours;

  return (
    <View style={styles.container}>
      {/* Hours */}
      <View style={styles.timeBox}>
        <Text style={styles.timeText}>
          {displayHours.toString().padStart(2, '0')}
        </Text>
      </View>

      {/* Separator */}
      <Text style={styles.separator}>:</Text>

      {/* Minutes */}
      <View style={styles.timeBox}>
        <Text style={styles.timeText}>
          {minutes.toString().padStart(2, '0')}
        </Text>
      </View>

      {/* AM/PM Toggle - only show in 12h mode */}
      {!use24HourFormat && (
        <View style={styles.ampmContainer}>
          <TouchableOpacity
            style={[styles.ampmButton, !isPM && styles.ampmButtonActive]}
            onPress={() => isPM && onToggleAMPM()}
            accessibilityRole="button"
            accessibilityLabel="Select AM"
            accessibilityState={{ selected: !isPM }}
          >
            <Text style={[styles.ampmText, !isPM && styles.ampmTextActive]}>
              AM
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ampmButton, isPM && styles.ampmButtonActive]}
            onPress={() => !isPM && onToggleAMPM()}
            accessibilityRole="button"
            accessibilityLabel="Select PM"
            accessibilityState={{ selected: isPM }}
          >
            <Text style={[styles.ampmText, isPM && styles.ampmTextActive]}>
              PM
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  timeBox: {
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    minWidth: 64,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  timeText: {
    ...textStyles.h1,
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 32,
    fontVariant: ['tabular-nums'],
  },
  separator: {
    ...textStyles.h1,
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 32,
  },
  ampmContainer: {
    flexDirection: 'column',
    marginLeft: spacing[2],
    gap: spacing[1],
  },
  ampmButton: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: radiusValues.box,
    backgroundColor: colors.interactive.default,
    minWidth: 44,
    alignItems: 'center',
  },
  ampmButtonActive: {
    backgroundColor: colors.primary,
  },
  ampmText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  ampmTextActive: {
    color: colors.text.inverse,
  },
});

export default TimeDisplay;
