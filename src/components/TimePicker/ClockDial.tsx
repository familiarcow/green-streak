import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, Text, AccessibilityInfo } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { colors, textStyles, spacing } from '../../theme';

interface ClockDialProps {
  value: number; // 1-12 for 12h mode, 0-23 for 24h mode
  onValueChange: (hour: number) => void;
  onDragSound?: () => void; // Throttled sound callback (includes haptics)
  size?: number; // Default 240
  use24HourFormat?: boolean; // Show 0-23 instead of 1-12
}

export const ClockDial: React.FC<ClockDialProps> = ({
  value,
  onValueChange,
  onDragSound,
  size = 240,
  use24HourFormat = false,
}) => {
  const center = size / 2;
  const outerRadius = size / 2 - 8; // Padding from edge
  const numberRadius = use24HourFormat ? outerRadius - 20 : outerRadius - 24; // Tighter for 24h
  const innerNumberRadius = outerRadius - 48; // Inner ring for 13-23/0 in 24h mode

  // Animation values
  const scale = useSharedValue(1);
  const lastSoundTime = useRef(0);
  const lastAnnouncedValue = useRef(value);

  // Get the number of positions on the dial
  const dialPositions = use24HourFormat ? 12 : 12; // Always 12 positions on dial

  // Convert hour to angle in degrees (12/0 at top = -90 degrees)
  const hourToAngle = (hour: number): number => {
    const position = use24HourFormat ? hour % 12 : (hour % 12 || 12);
    return (position / 12) * 360 - 90;
  };

  // Get position on circle from angle
  const getPosition = (angleDegrees: number, radius: number) => {
    const angleRadians = (angleDegrees * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(angleRadians),
      y: center + radius * Math.sin(angleRadians),
    };
  };

  // Convert touch position to hour
  const touchToHour = (x: number, y: number): number => {
    const dx = x - center;
    const dy = y - center;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (use24HourFormat) {
      // Determine if inner or outer ring based on touch distance
      const isInnerRing = distance < (numberRadius + innerNumberRadius) / 2;
      const position = Math.round(angle / 30) % 12;

      if (isInnerRing) {
        // Inner ring: 0, 13-23
        return position === 0 ? 0 : position + 12;
      } else {
        // Outer ring: 1-12
        return position === 0 ? 12 : position;
      }
    } else {
      // 12-hour mode
      const hour = Math.round(angle / 30) % 12 || 12;
      return hour;
    }
  };

  // Announce value change for accessibility
  const announceValue = useCallback((hour: number) => {
    if (hour !== lastAnnouncedValue.current) {
      lastAnnouncedValue.current = hour;
      const hourText = use24HourFormat
        ? `${hour.toString().padStart(2, '0')} hours`
        : `${hour} o'clock`;
      AccessibilityInfo.announceForAccessibility(hourText);
    }
  }, [use24HourFormat]);

  // Throttled sound effect (includes haptics via SoundEffectsService)
  const playDragSound = useCallback(() => {
    const now = Date.now();
    if (now - lastSoundTime.current > 80 && onDragSound) {
      lastSoundTime.current = now;
      onDragSound();
    }
  }, [onDragSound]);

  // Handle touch/drag
  const handleTouch = useCallback(
    (x: number, y: number) => {
      const newHour = touchToHour(x, y);
      if (newHour !== value) {
        runOnJS(onValueChange)(newHour);
        runOnJS(playDragSound)();
        runOnJS(announceValue)(newHour);
      }
    },
    [value, onValueChange, playDragSound, announceValue]
  );

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      scale.value = withSpring(1.02);
      runOnJS(handleTouch)(e.x, e.y);
    })
    .onUpdate((e) => {
      runOnJS(handleTouch)(e.x, e.y);
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  // Tap gesture for direct selection
  const tapGesture = Gesture.Tap().onEnd((e) => {
    runOnJS(handleTouch)(e.x, e.y);
  });

  const combinedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  // Animated container style
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Calculate selected position
  const isInnerRing = use24HourFormat && (value === 0 || value > 12);
  const selectedRadius = isInnerRing ? innerNumberRadius : numberRadius;
  const selectedPosition = getPosition(hourToAngle(value), selectedRadius);

  // Generate hour numbers for the dial
  // Order: 12 at top (index 0), then 1-11 clockwise
  const outerHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const innerHours = use24HourFormat
    ? [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
    : [];

  // Accessibility label
  const accessibilityLabel = use24HourFormat
    ? `Hour selector, current value ${value.toString().padStart(2, '0')}`
    : `Hour selector, current value ${value}`;

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.View
        style={[styles.container, { width: size, height: size }, animatedContainerStyle]}
        accessible={true}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{
          min: use24HourFormat ? 0 : 1,
          max: use24HourFormat ? 23 : 12,
          now: value,
          text: use24HourFormat ? `${value} hours` : `${value} o'clock`,
        }}
        accessibilityHint="Drag or tap to select hour"
      >
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth={1}
          />

          {/* Inner ring circle for 24h mode */}
          {use24HourFormat && (
            <Circle
              cx={center}
              cy={center}
              r={(numberRadius + innerNumberRadius) / 2}
              fill="none"
              stroke={colors.divider}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          )}

          {/* Selection line from center to selected hour */}
          <Line
            x1={center}
            y1={center}
            x2={selectedPosition.x}
            y2={selectedPosition.y}
            stroke={colors.primary}
            strokeWidth={2}
          />

          {/* Center dot */}
          <Circle cx={center} cy={center} r={4} fill={colors.primary} />

          {/* Selected hour circle */}
          <Circle
            cx={selectedPosition.x}
            cy={selectedPosition.y}
            r={use24HourFormat ? 16 : 18}
            fill={colors.primary}
          />
        </Svg>

        {/* Outer hour numbers */}
        <View style={[styles.numbersContainer, { width: size, height: size }]}>
          {outerHours.map((hour, index) => {
            const angle = (index / 12) * 360 - 90;
            const pos = getPosition(angle, numberRadius);
            const isSelected = hour === value;

            return (
              <View
                key={`outer-${hour}`}
                style={[
                  styles.numberWrapper,
                  use24HourFormat && styles.numberWrapper24h,
                  {
                    left: pos.x - (use24HourFormat ? 14 : 18),
                    top: pos.y - (use24HourFormat ? 14 : 18),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.numberText,
                    use24HourFormat && styles.numberText24h,
                    isSelected && styles.numberTextSelected,
                  ]}
                >
                  {use24HourFormat ? hour.toString().padStart(2, '0') : hour}
                </Text>
              </View>
            );
          })}

          {/* Inner hour numbers for 24h mode */}
          {innerHours.map((hour, index) => {
            const angle = (index / 12) * 360 - 90;
            const pos = getPosition(angle, innerNumberRadius);
            const isSelected = hour === value;

            return (
              <View
                key={`inner-${hour}`}
                style={[
                  styles.numberWrapper,
                  styles.numberWrapper24h,
                  {
                    left: pos.x - 14,
                    top: pos.y - 14,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.numberText,
                    styles.numberText24hInner,
                    isSelected && styles.numberTextSelected,
                  ]}
                >
                  {hour.toString().padStart(2, '0')}
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  numbersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  numberWrapper: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberWrapper24h: {
    width: 28,
    height: 28,
  },
  numberText: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '500',
    fontSize: 16,
  },
  numberText24h: {
    fontSize: 13,
    fontWeight: '600',
  },
  numberText24hInner: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  numberTextSelected: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
});

export default ClockDial;
