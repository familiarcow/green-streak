/**
 * SaturationValuePicker Component
 *
 * A 2D picker for selecting saturation (X-axis) and value/brightness (Y-axis).
 * Shows a gradient from the base hue color.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, shadows } from '../../theme';
import { hsvToHex } from '../../utils/colorUtils';

interface SaturationValuePickerProps {
  hue: number;
  saturation: number;
  value: number;
  onSaturationValueChange: (saturation: number, value: number) => void;
  size?: number;
  testID?: string;
}

const THUMB_SIZE = 28;

export const SaturationValuePicker: React.FC<SaturationValuePickerProps> = ({
  hue,
  saturation,
  value,
  onSaturationValueChange,
  size = 240,
  testID,
}) => {
  const thumbX = useSharedValue(saturation * size);
  const thumbY = useSharedValue((1 - value) * size);

  // Update thumb when props change externally
  // Note: thumbX/thumbY are stable Reanimated shared value refs, not dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    thumbX.value = saturation * size;
    thumbY.value = (1 - value) * size;
  }, [saturation, value, size]);

  const updateSaturationValue = (x: number, y: number) => {
    const clampedX = Math.max(0, Math.min(size, x));
    const clampedY = Math.max(0, Math.min(size, y));
    const newSaturation = clampedX / size;
    const newValue = 1 - clampedY / size;
    onSaturationValueChange(newSaturation, newValue);
  };

  const gesture = Gesture.Pan()
    .onBegin((event) => {
      'worklet';
      const newX = Math.max(0, Math.min(size, event.x));
      const newY = Math.max(0, Math.min(size, event.y));
      thumbX.value = newX;
      thumbY.value = newY;
      runOnJS(updateSaturationValue)(event.x, event.y);
    })
    .onUpdate((event) => {
      'worklet';
      const newX = Math.max(0, Math.min(size, event.x));
      const newY = Math.max(0, Math.min(size, event.y));
      thumbX.value = newX;
      thumbY.value = newY;
      runOnJS(updateSaturationValue)(event.x, event.y);
    });

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: thumbX.value - THUMB_SIZE / 2 },
      { translateY: thumbY.value - THUMB_SIZE / 2 },
    ],
  }));

  // Get the pure hue color (full saturation, full value)
  const baseColor = hsvToHex(hue, 1, 1);

  return (
    <View style={[styles.container, { width: size, height: size }]} testID={testID}>
      <GestureDetector gesture={gesture}>
        <View style={styles.touchArea}>
          <Svg width={size} height={size}>
            <Defs>
              {/* Saturation gradient: white to base color (left to right) */}
              <LinearGradient id="saturationGradient" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFFFFF" />
                <Stop offset="1" stopColor={baseColor} />
              </LinearGradient>
              {/* Value gradient: transparent to black (top to bottom) */}
              <LinearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#000000" stopOpacity="0" />
                <Stop offset="1" stopColor="#000000" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            {/* Base layer with saturation gradient */}
            <Rect
              x={0}
              y={0}
              width={size}
              height={size}
              rx={16}
              ry={16}
              fill="url(#saturationGradient)"
            />
            {/* Overlay with value gradient */}
            <Rect
              x={0}
              y={0}
              width={size}
              height={size}
              rx={16}
              ry={16}
              fill="url(#valueGradient)"
            />
          </Svg>
          <Animated.View style={[styles.thumb, thumbAnimatedStyle]}>
            <View style={styles.thumbOuter}>
              <View style={styles.thumbInner} />
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  touchArea: {
    position: 'relative',
    flex: 1,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  thumbOuter: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.surface,
    ...shadows.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  thumbInner: {
    width: THUMB_SIZE - 10,
    height: THUMB_SIZE - 10,
    borderRadius: (THUMB_SIZE - 10) / 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});

export default SaturationValuePicker;
