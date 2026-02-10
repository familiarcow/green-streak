import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import logger from '../../utils/logger';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { GridCell, GridCellState } from '../../types/achievements';
import { colors } from '../../theme';
import { GlassBreakEffect, IMPACT_DELAY, TOTAL_DURATION } from './GlassBreakEffect';
import { StressFractures, STRESS_DURATION } from './StressFractures';

// Derived timing constants (coordinated with StressFractures + GlassBreakEffect)
const RECOIL_DURATION = 60;     // Impact recoil animation
const SETTLE_START = 600;       // When scale settles back to 1.0
const HOLD_DELAY = SETTLE_START - IMPACT_DELAY - RECOIL_DURATION; // Time between recoil end and settle

// Animation phases
type AnimationPhase = 'idle' | 'stress' | 'break';

/**
 * Which corners should be rounded vs square
 */
export interface CornerRadius {
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
}

interface AchievementGridCellProps {
  cell: GridCell;
  size: number;
  onPress: (cell: GridCell) => void;
  accentColor: string;
  cornerRadius: CornerRadius;
  isAnimatingUnlock?: boolean;
  onUnlockAnimationComplete?: () => void;
  isSelected?: boolean;
}

const BORDER_RADIUS = 6;

/**
 * Create a darker shade of a color by mixing with dark gray
 * Preserves more of the original color character than mixing with pure black
 */
const createDarkShade = (hex: string, darkness: number): string => {
  // Remove # if present
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Mix with a dark gray (25, 25, 30) instead of pure black
  // This keeps more color character
  const darkR = 25;
  const darkG = 25;
  const darkB = 30;

  const newR = Math.round(r * (1 - darkness) + darkR * darkness);
  const newG = Math.round(g * (1 - darkness) + darkG * darkness);
  const newB = Math.round(b * (1 - darkness) + darkB * darkness);

  return `rgb(${newR}, ${newG}, ${newB})`;
};

/**
 * Get background color based on cell state
 * Locked cells are darker shade of accent color
 * Visible cells are medium shade
 * Unlocked cells are transparent windows
 */
const getCellBackgroundColor = (
  state: GridCellState,
  accentColor: string
): string => {
  switch (state) {
    case 'unlocked':
      // Transparent window - reveals background image
      return 'transparent';
    case 'visible':
      // Lighter shade - shows this is "seen" but not unlocked yet
      return createDarkShade(accentColor, 0.15); // 15% toward dark (lighter)
    case 'locked':
    default:
      // Medium shade - hides background, keeps accent color prominent
      return createDarkShade(accentColor, 0.35); // 35% toward dark
  }
};

/**
 * Single cell in the achievement grid
 * Handles different states: locked, visible, unlocked, starter
 */
export const AchievementGridCell: React.FC<AchievementGridCellProps> = ({
  cell,
  size,
  onPress,
  accentColor,
  cornerRadius,
  isAnimatingUnlock = false,
  onUnlockAnimationComplete,
  isSelected = false,
}) => {
  const scale = useSharedValue(1);
  const windowOpacity = useSharedValue(isAnimatingUnlock ? 0 : 1);

  // Animation phase state: idle -> stress -> break
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');

  // Glass break unlock animation - Cinematic experience
  // Timeline:
  // - STRESS phase (0-400ms): StressFractures shows hairline cracks + tremor
  // - BREAK phase (400-1100ms): GlassBreakEffect with impact, shards, physics
  //
  // Cell scale animation coordinated across both phases:
  // - Stress: Subtle pulse as pressure builds
  // - Break: Explosive punch + recoil + settle

  // Start stress phase when unlock animation begins
  useEffect(() => {
    logger.debug('UI', 'Cell animation check', {
      isAnimatingUnlock,
      cellState: cell.state,
      animationPhase,
      achievementId: cell.achievement?.id,
    });

    if (isAnimatingUnlock && cell.state === 'unlocked' && animationPhase === 'idle') {
      logger.info('UI', 'Starting STRESS phase', { achievementId: cell.achievement?.id });
      setAnimationPhase('stress');
      scale.value = 1;
      windowOpacity.value = 0;

      // During stress phase: subtle pulsing tension
      scale.value = withSequence(
        withTiming(1.03, { duration: 150, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 150, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.05, { duration: 100, easing: Easing.inOut(Easing.quad) }),
      );
    }
  }, [isAnimatingUnlock, cell.state, animationPhase]);

  // Handle stress phase completion -> transition to break phase
  const handleStressComplete = () => {
    logger.info('UI', 'Stress complete, starting BREAK phase', { achievementId: cell.achievement?.id });
    setAnimationPhase('break');

    // Break phase scale animation - dramatic like Kirby Air Ride
    scale.value = withSequence(
      // Phase 1: Tension - scale up builds anticipation
      withTiming(1.12, {
        duration: IMPACT_DELAY,
        easing: Easing.out(Easing.quad),
      }),
      // Phase 2: Impact - punch OUT then snap back
      withTiming(1.25, { duration: 40 }), // Explosive punch
      withTiming(0.92, { duration: RECOIL_DURATION }), // Sharp recoil
      // Phase 3: Hold at recoil - wait for shards to fall
      withDelay(HOLD_DELAY, withTiming(0.92, { duration: 1 })),
      // Phase 4: Settle back to normal with bounce
      withSpring(1, { damping: 12, stiffness: 180 })
    );

    // Window reveal - instant at impact moment
    windowOpacity.value = withDelay(
      IMPACT_DELAY,
      withTiming(1, { duration: 1 })
    );
  };

  // Reset animation phase when not animating
  useEffect(() => {
    if (!isAnimatingUnlock) {
      setAnimationPhase('idle');
    }
  }, [isAnimatingUnlock]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Overlay that covers the cell during unlock animation
  // Starts opaque (hiding the transparent window), fades to reveal
  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: 1 - windowOpacity.value,
  }));

  const handlePressIn = () => {
    if (cell.state !== 'locked') {
      scale.value = withSpring(0.95, { damping: 20 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    if (cell.state !== 'locked') {
      onPress(cell);
    }
  };

  const backgroundColor = getCellBackgroundColor(cell.state, accentColor);
  const isInteractive = cell.state !== 'locked';
  const selectionBorderWidth = isSelected ? 3 : 0;

  // Compute border radius for each corner
  const borderRadiusStyle = {
    borderTopLeftRadius: cornerRadius.topLeft ? BORDER_RADIUS : 0,
    borderTopRightRadius: cornerRadius.topRight ? BORDER_RADIUS : 0,
    borderBottomLeftRadius: cornerRadius.bottomLeft ? BORDER_RADIUS : 0,
    borderBottomRightRadius: cornerRadius.bottomRight ? BORDER_RADIUS : 0,
  };

  return (
    <Animated.View
      style={[animatedContainerStyle]}
    >
      <View style={{ position: 'relative' }}>
        <TouchableOpacity
          style={[
            styles.cell,
            {
              width: size,
              height: size,
              backgroundColor,
              ...borderRadiusStyle,
              borderWidth: selectionBorderWidth,
              borderColor: isSelected ? '#FFFFFF' : 'transparent',
            },
            isAnimatingUnlock && styles.unlockingCell,
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!isInteractive || isAnimatingUnlock}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={
            cell.state === 'locked'
              ? 'Locked achievement'
              : cell.state === 'visible'
              ? `Hidden: ${cell.achievement?.name || 'Unknown'}`
              : cell.achievement?.name || 'Achievement'
          }
          accessibilityHint={
            cell.state === 'locked'
              ? 'Unlock adjacent achievements to reveal'
              : cell.state === 'visible'
              ? 'Tap to view objective'
              : 'Tap to view details'
          }
          accessibilityState={{ disabled: !isInteractive }}
        />

        {/* Cover overlay - hides the transparent window during unlock animation */}
        {isAnimatingUnlock && (
          <Animated.View
            style={[
              styles.unlockOverlay,
              {
                width: size,
                height: size,
                backgroundColor: createDarkShade(accentColor, 0.15),
                ...borderRadiusStyle,
              },
              animatedOverlayStyle,
            ]}
            pointerEvents="none"
          />
        )}

        {/* Stress fractures - anticipation phase before break */}
        {isAnimatingUnlock && cell.achievement && animationPhase === 'stress' && (
          <StressFractures
            visible={animationPhase === 'stress'}
            cellSize={size}
            onComplete={handleStressComplete}
          />
        )}

        {/* Glass break effect - crack pattern + falling shards */}
        {isAnimatingUnlock && cell.achievement && animationPhase === 'break' && (
          <GlassBreakEffect
            visible={animationPhase === 'break'}
            cellSize={size}
            rarity={cell.achievement.rarity}
            onComplete={onUnlockAnimationComplete}
          />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  unlockingCell: {
    zIndex: 10,
  },

  unlockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 5,
  },
});

export default AchievementGridCell;
