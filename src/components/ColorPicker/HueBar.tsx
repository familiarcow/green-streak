/**
 * HueBar Component
 *
 * A horizontal slider for selecting hue (0-360 degrees).
 * Displays a rainbow gradient and allows dragging to select.
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
import { colors, shadows, spacing } from '../../theme';

interface HueBarProps {
  hue: number;
  onHueChange: (hue: number) => void;
  width?: number;
  height?: number;
  testID?: string;
}

const THUMB_SIZE = 24;

export const HueBar: React.FC<HueBarProps> = ({
  hue,
  onHueChange,
  width = 280,
  height = 32,
  testID,
}) => {
  const thumbPosition = useSharedValue((hue / 360) * width);

  // Update thumb when hue prop changes externally
  // Note: thumbPosition is a stable Reanimated shared value ref, not a dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    thumbPosition.value = (hue / 360) * width;
  }, [hue, width]);

  const updateHue = (x: number) => {
    const clampedX = Math.max(0, Math.min(width, x));
    const newHue = (clampedX / width) * 360;
    onHueChange(newHue);
  };

  const gesture = Gesture.Pan()
    .onBegin((event) => {
      'worklet';
      const newX = Math.max(0, Math.min(width, event.x));
      thumbPosition.value = newX;
      runOnJS(updateHue)(event.x);
    })
    .onUpdate((event) => {
      'worklet';
      const newX = Math.max(0, Math.min(width, event.x));
      thumbPosition.value = newX;
      runOnJS(updateHue)(event.x);
    });

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbPosition.value - THUMB_SIZE / 2 }],
  }));

  return (
    <View style={[styles.container, { width, height }]} testID={testID}>
      <GestureDetector gesture={gesture}>
        <View style={styles.touchArea}>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="hueGradient" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FF0000" />
                <Stop offset="0.17" stopColor="#FFFF00" />
                <Stop offset="0.33" stopColor="#00FF00" />
                <Stop offset="0.5" stopColor="#00FFFF" />
                <Stop offset="0.67" stopColor="#0000FF" />
                <Stop offset="0.83" stopColor="#FF00FF" />
                <Stop offset="1" stopColor="#FF0000" />
              </LinearGradient>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              rx={height / 2}
              ry={height / 2}
              fill="url(#hueGradient)"
            />
          </Svg>
          <Animated.View style={[styles.thumb, thumbAnimatedStyle]}>
            <View style={styles.thumbInner} />
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  touchArea: {
    position: 'relative',
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.surface,
    ...shadows.md,
    alignItems: 'center',
    justifyContent: 'center',
    top: 4,
  },
  thumbInner: {
    width: THUMB_SIZE - 6,
    height: THUMB_SIZE - 6,
    borderRadius: (THUMB_SIZE - 6) / 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
});

export default HueBar;
