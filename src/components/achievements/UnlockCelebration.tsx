/**
 * UnlockCelebration - Full-screen celebration moment after glass breaks
 *
 * Animation sequence (3000ms):
 * 1. Card scales in with spring (0-300ms)
 * 2. Icon pulses with glow (200-600ms)
 * 3. Text reveals (300-700ms)
 * 4. Confetti (400ms+) - Based on rarity
 * 5. Hold + Fade (2700-3000ms)
 *
 * User can dismiss early with X button.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { AchievementDefinition } from '../../types/achievements';
import { RARITY_COLORS, RARITY_CELEBRATIONS } from '../../theme/achievements';
import { colors, spacing } from '../../theme';
import { getSoundService, getConfettiService } from '../../services';
import { Icon } from '../common/Icon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CELEBRATION_DURATION = 4500;

interface UnlockCelebrationProps {
  visible: boolean;
  achievement: AchievementDefinition | null;
  cellPosition: { x: number; y: number } | null;
  onComplete: () => void;
}

export const UnlockCelebration: React.FC<UnlockCelebrationProps> = ({
  visible,
  achievement,
  cellPosition,
  onComplete,
}) => {
  const hasTriggeredRef = useRef(false);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const containerOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const glowRingOpacity = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const descriptionOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);
  const closeButtonOpacity = useSharedValue(0);

  const rarityColor = achievement ? RARITY_COLORS[achievement.rarity] : colors.primary;
  const celebration = achievement ? RARITY_CELEBRATIONS[achievement.rarity] : null;

  // Dismiss handler - can be called by X button or auto-complete
  const handleDismiss = useCallback(() => {
    // Clear pending timeouts
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }

    // Fade out and complete
    containerOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      onComplete();
    }, 200);
  }, [onComplete, containerOpacity]);

  useEffect(() => {
    if (visible && achievement && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;

      // Container fade in
      containerOpacity.value = withTiming(1, { duration: 150 });

      // 1. Card scales in with spring (0-300ms)
      cardScale.value = withSpring(1, { damping: 12, stiffness: 200 });
      cardOpacity.value = withTiming(1, { duration: 200 });

      // 2. Icon fades in (100-300ms)
      iconOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));

      // 3. Glow ring fades in (no scale animation)
      glowRingOpacity.value = withDelay(200, withTiming(0.7, { duration: 400 }));

      // 4. Text fades in (300-500ms)
      textOpacity.value = withDelay(300, withTiming(1, { duration: 200 }));

      // 5. Description fades in (400-600ms)
      descriptionOpacity.value = withDelay(400, withTiming(1, { duration: 200 }));

      // 6. Badge bounces in (500-700ms)
      badgeScale.value = withDelay(
        500,
        withSpring(1, { damping: 10, stiffness: 250 })
      );

      // Show close button after content appears
      closeButtonOpacity.value = withDelay(600, withTiming(1, { duration: 200 }));

      // Play achievement sound
      const soundService = getSoundService();
      soundService.play('achievement');

      // Trigger confetti for rare+ achievements
      if (celebration?.confetti) {
        setTimeout(() => {
          const confettiService = getConfettiService();
          confettiService.trigger(celebration.confetti as 'burst' | 'fireworks' | 'rain');
        }, 400);
      }

      // No auto-dismiss - stays until user taps X button

      return () => {
        hasTriggeredRef.current = false;
        if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
      };
    }

    if (!visible) {
      hasTriggeredRef.current = false;
      containerOpacity.value = 0;
      cardScale.value = 0.8;
      cardOpacity.value = 0;
      glowRingOpacity.value = 0;
      iconOpacity.value = 0;
      textOpacity.value = 0;
      descriptionOpacity.value = 0;
      badgeScale.value = 0;
      closeButtonOpacity.value = 0;
    }
  }, [visible, achievement, celebration, onComplete]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const glowRingStyle = useAnimatedStyle(() => ({
    opacity: glowRingOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const descriptionStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const closeButtonStyle = useAnimatedStyle(() => ({
    opacity: closeButtonOpacity.value,
  }));

  if (!visible || !achievement) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Backdrop - tap to dismiss */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleDismiss}
      />

      {/* Card */}
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Header row with title and rarity pill */}
        <View style={styles.headerRow}>
          <Animated.Text style={[styles.headerText, textStyle]}>
            ACHIEVEMENT UNLOCKED
          </Animated.Text>
          {/* Rarity pill - top right */}
          <Animated.View
            style={[
              styles.rarityPill,
              { backgroundColor: rarityColor },
              badgeStyle,
            ]}
          >
            <Text style={styles.rarityPillText}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </Text>
          </Animated.View>
        </View>

        {/* Icon with glow ring */}
        <View style={styles.iconWrapper}>
          {/* Glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              { borderColor: rarityColor, shadowColor: rarityColor },
              glowRingStyle,
            ]}
          />
          {/* Icon */}
          <Animated.View style={[styles.iconContainer, iconStyle]}>
            <View style={[styles.iconBackground, { backgroundColor: `${rarityColor}20` }]}>
              <Text style={styles.icon}>{achievement.icon}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Achievement name */}
        <Animated.Text style={[styles.name, textStyle]}>
          {achievement.name}
        </Animated.Text>

        {/* Description */}
        <Animated.Text style={[styles.description, descriptionStyle]}>
          {achievement.description}
        </Animated.Text>

        {/* Continue button */}
        <Animated.View style={[styles.continueButtonContainer, closeButtonStyle]}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: rarityColor }]}
            onPress={handleDismiss}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Extend beyond parent to cover modal handle area (16px)
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  card: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 360,
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
    paddingHorizontal: spacing[5],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing[4],
  },

  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 1.5,
  },

  rarityPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 12,
  },

  rarityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },

  glowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 8,
  },

  iconContainer: {
    zIndex: 1,
  },

  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 52,
  },

  name: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },

  description: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: 22,
    paddingHorizontal: spacing[2],
  },

  continueButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },

  continueButton: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[3],
    borderRadius: 24,
    minWidth: 140,
    alignItems: 'center',
  },

  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default UnlockCelebration;
