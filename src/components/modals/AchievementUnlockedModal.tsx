import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { BaseModal } from './BaseModal';
import { AnimatedButton } from '../AnimatedButton';
import { colors, spacing, textStyles, RARITY_COLORS, formatCategory } from '../../theme';
import { borderRadius } from '../../theme/spacing';
import { AchievementUnlockEvent } from '../../types/achievements';
import { getConfettiService, getSoundService } from '../../services';
import logger from '../../utils/logger';

interface AchievementUnlockedModalProps {
  event: AchievementUnlockEvent | null;
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Celebration modal shown when an achievement is unlocked
 * Displays achievement icon, name, description with animations
 * Triggers confetti and sound effects based on rarity
 */
export const AchievementUnlockedModal: React.FC<AchievementUnlockedModalProps> = ({
  event,
  onDismiss,
}) => {
  const isVisible = event !== null;
  const hasPlayedEffects = useRef(false);

  // Animation values
  const iconScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);

  // Play celebration effects when modal opens
  useEffect(() => {
    if (isVisible && event && !hasPlayedEffects.current) {
      hasPlayedEffects.current = true;

      // Start animations - subtle and professional
      iconScale.value = withDelay(
        100,
        withSpring(1, { damping: 20, stiffness: 300 })
      );

      contentOpacity.value = withDelay(250, withSpring(1, { damping: 20 }));
      badgeScale.value = withDelay(350, withSpring(1, { damping: 18, stiffness: 250 }));

      // Trigger celebration effects
      playCelebrationEffects(event);
    }

    // Reset effects flag when modal closes
    if (!isVisible) {
      hasPlayedEffects.current = false;
      iconScale.value = 0;
      contentOpacity.value = 0;
      badgeScale.value = 0;
    }
  }, [isVisible, event, iconScale, contentOpacity, badgeScale]);

  const playCelebrationEffects = (unlockEvent: AchievementUnlockEvent) => {
    const { celebration, rarity } = unlockEvent.achievement;

    try {
      // Play sound effect
      if (celebration.sound !== 'none') {
        const soundService = getSoundService();
        soundService.play(celebration.sound);
      }

      // Trigger confetti
      if (celebration.confetti) {
        const confettiService = getConfettiService();
        confettiService.trigger(celebration.confetti);
      }

      logger.debug('UI', 'Achievement celebration effects triggered', {
        achievementId: unlockEvent.achievement.id,
        rarity,
        confetti: celebration.confetti,
        sound: celebration.sound,
      });
    } catch (error) {
      logger.error('UI', 'Failed to play celebration effects', { error });
    }
  };

  // Animated styles
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  if (!event) {
    return null;
  }

  const { achievement } = event;
  const rarityColor = RARITY_COLORS[achievement.rarity];

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={onDismiss}
      closeOnBackdropPress={false}
      height="auto"
      minHeight={300}
    >
      <View style={styles.container}>
        {/* Achievement Unlocked Header */}
        <Text style={styles.header}>Achievement Unlocked!</Text>

        {/* Achievement Icon with Animation */}
        <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
          <View style={[styles.iconBackground, { borderColor: rarityColor }]}>
            <Text style={styles.icon}>{achievement.icon}</Text>
          </View>
        </Animated.View>

        {/* Content */}
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          {/* Rarity Badge */}
          <Animated.View style={[styles.badgeContainer, badgeAnimatedStyle]}>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
              <Text style={styles.rarityText}>
                {achievement.rarity.toUpperCase()}
              </Text>
            </View>
          </Animated.View>

          {/* Achievement Name */}
          <Text style={styles.name}>{achievement.name}</Text>

          {/* Achievement Description */}
          <Text style={styles.description}>{achievement.description}</Text>

          {/* Category */}
          <Text style={styles.category}>
            {formatCategory(achievement.category)}
          </Text>
        </Animated.View>

        {/* Dismiss Button */}
        <View style={styles.buttonContainer}>
          <AnimatedButton
            title="Awesome!"
            onPress={onDismiss}
            variant="primary"
            size="large"
            style={styles.button}
          />
        </View>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[6],
    alignItems: 'center',
  },
  header: {
    ...textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing[6],
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: spacing[6],
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 60,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  badgeContainer: {
    marginBottom: spacing[3],
  },
  rarityBadge: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  rarityText: {
    ...textStyles.caption,
    color: colors.text.inverse,
    fontWeight: '700',
    letterSpacing: 1,
  },
  name: {
    ...textStyles.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  description: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[2],
    paddingHorizontal: spacing[4],
  },
  category: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[6],
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacing[4],
  },
  button: {
    width: '100%',
  },
});

export default AchievementUnlockedModal;
