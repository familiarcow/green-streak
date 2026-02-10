/**
 * GlassBreakEffect - Orchestrates the achievement unlock glass break animation
 *
 * Apple-philosophy design: One perfect moment beats ten flashy effects.
 * The unlock feels like tapping a wine glass—clean, physical, satisfying.
 *
 * Timeline (600ms total):
 * - Phase 1: Tension (0-80ms) - Handled by parent cell scale
 * - Phase 2: Impact (80ms) - Crack + Haptic + Sound SIMULTANEOUSLY
 * - Phase 3: Physics (80-500ms) - Shards fall with gravity
 * - Phase 4: Settle (500-600ms) - Clean state
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AchievementRarity } from '../../types/achievements';
import { CrackPattern } from './CrackPattern';
import { GlassShard } from './GlassShard';
import { getSoundService } from '../../services';

// Timing constants (in ms) - exported for AchievementGridCell coordination
export const IMPACT_DELAY = 100;       // When crack/haptic/sound fire (slightly longer tension)
export const CRACK_FADE_DURATION = 250; // How long crack takes to fade (more visible)
export const SHARD_DURATION = 500;     // How long shards animate (longer fall)
export const TOTAL_DURATION = 700;     // Complete animation duration

/**
 * Rarity-based configuration
 * Subtle scaling - not loud
 */
interface RarityConfig {
  shardCount: number;
  successHapticAtEnd: boolean;  // Only legendary gets success haptic at end
}

const RARITY_CONFIG: Record<AchievementRarity, RarityConfig> = {
  common:    { shardCount: 8,  successHapticAtEnd: false },
  uncommon:  { shardCount: 10, successHapticAtEnd: false },
  rare:      { shardCount: 12, successHapticAtEnd: false },
  epic:      { shardCount: 14, successHapticAtEnd: false },
  legendary: { shardCount: 16, successHapticAtEnd: true },
};

export interface GlassBreakEffectProps {
  visible: boolean;
  cellSize: number;
  rarity: AchievementRarity;
  onComplete?: () => void;
}

/**
 * Generate shard configurations for the physics simulation
 */
interface ShardConfig {
  startX: number;
  startY: number;
  initialAngle: number;
  initialSpeed: number;
  size: number;
  delay: number;
}

const generateShards = (
  shardCount: number,
  cellSize: number
): ShardConfig[] => {
  const shards: ShardConfig[] = [];
  const center = cellSize / 2;

  for (let i = 0; i < shardCount; i++) {
    // Distribute angles evenly with variance
    const baseAngle = (i / shardCount) * Math.PI * 2;
    const angleVariance = (Math.random() - 0.5) * 0.8;
    const angle = baseAngle + angleVariance;

    // Start near center (at crack intersection points)
    const startRadius = 4 + Math.random() * 8;
    const startX = Math.cos(angle) * startRadius;
    const startY = Math.sin(angle) * startRadius;

    // Initial speed - strong outward push for dramatic effect
    const initialSpeed = 60 + Math.random() * 60; // 60-120 px/s (3x stronger)

    // Size varies 10-20px (larger, more visible)
    const size = 10 + Math.random() * 10;

    // Stagger for cascading effect (0-80ms spread after impact)
    const delay = IMPACT_DELAY + Math.random() * 80;

    shards.push({
      startX,
      startY,
      initialAngle: angle, // Push outward from center
      initialSpeed,
      size,
      delay,
    });
  }

  return shards;
};

export const GlassBreakEffect: React.FC<GlassBreakEffectProps> = ({
  visible,
  cellSize,
  rarity,
  onComplete,
}) => {
  const config = RARITY_CONFIG[rarity];
  const hasTriggeredRef = useRef(false);

  // Flash animation for impact
  const flashOpacity = useSharedValue(0);

  // Generate shards configuration once when visible becomes true
  const shards = useMemo(() => {
    if (!visible) return [];
    return generateShards(config.shardCount, cellSize);
  }, [visible, config.shardCount, cellSize]);

  useEffect(() => {
    if (visible && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;

      // Bright white flash at impact - Kirby Air Ride style
      flashOpacity.value = withDelay(
        IMPACT_DELAY,
        withSequence(
          withTiming(1, { duration: 30 }),  // Flash ON instantly
          withTiming(0, { duration: 150 })  // Fade out
        )
      );

      // Fire haptic + sound at impact moment
      const impactTimeout = setTimeout(() => {
        const soundService = getSoundService();

        // ONE heavy haptic for that satisfying crack feel
        soundService.playImpact('heavy');

        // Play glass crack sound
        soundService.play('glass_crack');
      }, IMPACT_DELAY);

      // Success haptic at end for legendary only
      let successTimeout: NodeJS.Timeout | undefined;
      if (config.successHapticAtEnd) {
        successTimeout = setTimeout(() => {
          // Extra special feel for legendary achievements
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, TOTAL_DURATION);
      }

      // Call onComplete
      const completeTimeout = setTimeout(() => {
        onComplete?.();
      }, TOTAL_DURATION);

      return () => {
        clearTimeout(impactTimeout);
        if (successTimeout) clearTimeout(successTimeout);
        clearTimeout(completeTimeout);
      };
    }

    // Reset when becoming invisible
    if (!visible) {
      hasTriggeredRef.current = false;
      flashOpacity.value = 0;
    }
  }, [visible, config.successHapticAtEnd, onComplete]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View
      style={[
        styles.container,
        {
          width: cellSize,
          height: cellSize,
        },
      ]}
      pointerEvents="none"
    >
      {/* Bright white flash at impact - cinematic effect */}
      <Animated.View
        style={[
          styles.flash,
          {
            width: cellSize + 20,
            height: cellSize + 20,
            borderRadius: 10,
          },
          flashStyle,
        ]}
      />

      {/* Crack pattern - appears at impact, fades quickly */}
      <CrackPattern
        visible={visible}
        cellSize={cellSize}
        rarity={rarity}
        delay={IMPACT_DELAY}
        fadeDuration={CRACK_FADE_DURATION}
      />

      {/* Glass shards with gravity physics */}
      <View style={styles.shardContainer}>
        {shards.map((shard, index) => (
          <GlassShard
            key={index}
            startX={shard.startX}
            startY={shard.startY}
            initialAngle={shard.initialAngle}
            initialSpeed={shard.initialSpeed}
            size={shard.size}
            delay={shard.delay}
            duration={SHARD_DURATION}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 20,
  },

  flash: {
    position: 'absolute',
    top: -10,
    left: -10,
    backgroundColor: '#FFFFFF',
    zIndex: 30,
  },

  shardContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GlassBreakEffect;
