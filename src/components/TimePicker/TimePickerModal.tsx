import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BaseModal } from '../modals/BaseModal';
import { AnimatedButton } from '../AnimatedButton';
import { ClockDial } from './ClockDial';
import { TimeDisplay } from './TimeDisplay';
import { useSettingsStore } from '../../store/settingsStore';
import { useSounds, useAccentColor } from '../../hooks';
import { parse24hTime, convert12hTo24h, formatTimeDisplay } from '../../utils/timeHelpers';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues } from '../../theme/utils';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTime: string; // "HH:MM" format (24h)
  onSelectTime: (time: string) => void;
}

// Minute preset options
const MINUTE_PRESETS = [0, 15, 30, 45];

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  selectedTime,
  onSelectTime,
}) => {
  // Get settings
  const use24HourFormat = useSettingsStore((s) => s.use24HourFormat) ?? false;

  // Parse initial time into components
  const initialParsed = parse24hTime(selectedTime);
  const [hours24] = selectedTime.split(':').map(Number);

  // Local state - use 24h hour directly in 24h mode, otherwise use 12h
  const [tempHours, setTempHours] = useState(use24HourFormat ? hours24 : initialParsed.hour12);
  const [tempMinutes, setTempMinutes] = useState(initialParsed.minutes);
  const [isPM, setIsPM] = useState(initialParsed.isPM);

  // Sounds
  const { playRandomTap, playRandomType, playToggle, playButton } = useSounds();
  const accentColor = useAccentColor();

  // Reset state when modal opens with new time
  useEffect(() => {
    if (visible) {
      const parsed = parse24hTime(selectedTime);
      const [h24] = selectedTime.split(':').map(Number);
      // In 24h mode, use the 24h hour directly; in 12h mode, use the parsed 12h hour
      setTempHours(use24HourFormat ? h24 : parsed.hour12);
      setTempMinutes(parsed.minutes);
      setIsPM(parsed.isPM);
    }
  }, [visible, selectedTime, use24HourFormat]);

  // Handle hour change from clock dial
  const handleHourChange = useCallback((hour: number) => {
    setTempHours(hour);
  }, []);

  // Handle minute selection
  const handleMinuteSelect = useCallback(
    (minute: number) => {
      playRandomTap();
      setTempMinutes(minute);
    },
    [playRandomTap]
  );

  // Handle AM/PM toggle
  const handleToggleAMPM = useCallback(() => {
    playToggle(!isPM);
    setIsPM((prev) => !prev);
  }, [isPM, playToggle]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    playButton();
    const time24h = use24HourFormat
      ? `${tempHours.toString().padStart(2, '0')}:${tempMinutes.toString().padStart(2, '0')}`
      : convert12hTo24h(tempHours, tempMinutes, isPM);
    onSelectTime(time24h);
    onClose();
  }, [tempHours, tempMinutes, isPM, use24HourFormat, onSelectTime, onClose, playButton]);

  // Get preview text
  const previewTime = use24HourFormat
    ? `${tempHours.toString().padStart(2, '0')}:${tempMinutes.toString().padStart(2, '0')}`
    : convert12hTo24h(tempHours, tempMinutes, isPM);

  return (
    <BaseModal
      isVisible={visible}
      onClose={onClose}
      height="auto"
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Time</Text>
        </View>

        {/* Time Display */}
        <TimeDisplay
          hours={tempHours}
          minutes={tempMinutes}
          isPM={isPM}
          onToggleAMPM={handleToggleAMPM}
          use24HourFormat={use24HourFormat}
        />

        {/* Clock Dial */}
        <GestureHandlerRootView style={styles.clockContainer}>
          <ClockDial
            value={tempHours}
            onValueChange={handleHourChange}
            onDragSound={playRandomType}
            size={use24HourFormat ? 260 : 220}
            use24HourFormat={use24HourFormat}
          />
        </GestureHandlerRootView>

        {/* Minute Presets */}
        <View style={styles.minuteRow}>
          {MINUTE_PRESETS.map((minute) => {
            const isSelected = tempMinutes === minute;
            return (
              <TouchableOpacity
                key={minute}
                style={[
                  styles.minuteButton,
                  isSelected && [styles.minuteButtonSelected, { backgroundColor: accentColor, borderColor: accentColor }],
                ]}
                onPress={() => handleMinuteSelect(minute)}
                accessibilityRole="button"
                accessibilityLabel={`${minute} minutes`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.minuteText,
                    isSelected && styles.minuteTextSelected,
                  ]}
                >
                  :{minute.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Confirm Button */}
        <View style={styles.confirmContainer}>
          <AnimatedButton
            title="Select"
            onPress={handleConfirm}
            variant="primary"
            size="large"
          />
        </View>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[5],
    alignItems: 'center',
    gap: spacing[3],
  },
  header: {
    alignItems: 'center',
  },
  title: {
    ...textStyles.h2,
    color: colors.text.primary,
  },
  clockContainer: {
    marginVertical: spacing[1],
  },
  minuteRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  minuteButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radiusValues.box,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  minuteButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  minuteText: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  minuteTextSelected: {
    color: colors.text.inverse,
  },
  confirmContainer: {
    width: '100%',
    marginTop: spacing[1],
  },
});

export default TimePickerModal;
