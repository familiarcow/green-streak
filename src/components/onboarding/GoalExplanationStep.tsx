/**
 * GoalExplanationStep
 *
 * Onboarding step that explains the difference between goals and habits.
 * Goals are the "why" (motivational anchors), habits are the "what" (daily actions).
 * Features synchronized highlighting to show goal-habit connections.
 *
 * Animation Pattern:
 * - Uses dual-layer text (inactive + active) with animated opacity for smooth color transitions
 * - fontWeight cannot be animated in RN, so we overlay bold text on regular text
 * - activeIndex cycles 0 -> 1 -> 2 -> 0... every CYCLE_DURATION ms
 * - Each text item has its own opacity derived from activeIndex proximity
 * - Wraps Animated.View/Text in plain View containers to avoid Reanimated layout animation warnings
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated';
import { Icon } from '../common/Icon';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues } from '../../theme/utils';

// Synchronized pairs: [goal, habit]
const EXAMPLES = [
  { goal: 'Better Health', habit: 'Exercise' },
  { goal: 'Strong Relationships', habit: 'Call a Friend' },
  { goal: 'Mental Clarity', habit: 'Meditation' },
];

const CYCLE_DURATION = 5000; // 5 seconds per pair
const FADE_DURATION = 600; // Smooth transition duration

interface HighlightedTextProps {
  text: string;
  isGoal: boolean;
  index: number;
  activeIndex: SharedValue<number>;
}

/**
 * HighlightedText uses a dual-layer approach:
 * - Base layer: inactive color (tertiary text), always visible
 * - Overlay layer: active color (green/blue) + bold, fades in/out based on activeIndex
 *
 * This avoids animating fontWeight (not supported) and color interpolation warnings.
 *
 * To avoid Reanimated warnings about layout animations overwriting animated properties,
 * we wrap all Animated components in plain View containers. The animated opacity is
 * applied only via useAnimatedStyle, with no entering/exiting layout animations.
 */
const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  isGoal,
  index,
  activeIndex,
}) => {
  const activeColor = isGoal ? colors.primary : colors.info;

  // Derive opacity for the active overlay based on whether this index is active
  const activeOpacity = useDerivedValue(() => {
    return activeIndex.value === index ? 1 : 0;
  });

  // Animated style for the active (colored + bold) overlay - only opacity, no transform
  const activeOverlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(activeOpacity.value, {
      duration: FADE_DURATION,
      easing: Easing.inOut(Easing.ease),
    }),
  }));

  // Animated style for the inactive (tertiary) base layer - inverse opacity
  const inactiveBaseStyle = useAnimatedStyle(() => ({
    opacity: withTiming(activeOpacity.value === 1 ? 0 : 1, {
      duration: FADE_DURATION,
      easing: Easing.inOut(Easing.ease),
    }),
  }));

  // Animated style for the bullet icon - active state
  const bulletActiveStyle = useAnimatedStyle(() => ({
    opacity: withTiming(activeOpacity.value, {
      duration: FADE_DURATION,
      easing: Easing.inOut(Easing.ease),
    }),
  }));

  // Animated style for the bullet icon - inactive state
  const bulletInactiveStyle = useAnimatedStyle(() => ({
    opacity: withTiming(activeOpacity.value === 1 ? 0 : 1, {
      duration: FADE_DURATION,
      easing: Easing.inOut(Easing.ease),
    }),
  }));

  return (
    <View style={styles.bulletRow}>
      {/* Bullet icon with dual-layer animation - wrapped in plain View */}
      <View style={styles.bulletWrapper}>
        <View style={styles.bulletLayerContainer}>
          <Animated.View style={[styles.bulletLayer, bulletInactiveStyle]}>
            <Icon name="goal" size={14} color={colors.text.tertiary} />
          </Animated.View>
        </View>
        <View style={[styles.bulletLayerContainer, styles.bulletOverlay]}>
          <Animated.View style={[styles.bulletLayer, bulletActiveStyle]}>
            <Icon name="goal" size={14} color={activeColor} />
          </Animated.View>
        </View>
      </View>
      {/* Text with dual-layer animation - wrapped in plain View */}
      <View style={styles.textWrapper}>
        <View style={styles.textLayerContainer}>
          <Animated.View style={inactiveBaseStyle}>
            <Text style={[styles.exampleItem, styles.inactiveText]}>{text}</Text>
          </Animated.View>
        </View>
        <View style={[styles.textLayerContainer, styles.activeTextContainer]}>
          <Animated.View style={activeOverlayStyle}>
            <Text style={[styles.exampleItem, styles.activeText, { color: activeColor }]}>
              {text}
            </Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export const GoalExplanationStep: React.FC = () => {
  // Discrete index (0, 1, or 2) - not a continuous value
  const activeIndex = useSharedValue(0);

  // Set up the cycling animation using a simple interval approach
  // This is cleaner than complex withSequence for discrete state changes
  useEffect(() => {
    let currentIndex = 0;

    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % EXAMPLES.length;
      activeIndex.value = currentIndex;
    }, CYCLE_DURATION);

    return () => clearInterval(intervalId);
  }, [activeIndex]);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.iconContainer}>
          <Icon name="target" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>Goals & Habits</Text>
        <Text style={styles.subtitle}>The "why" behind the "what"</Text>
      </View>

      <View style={styles.comparisonContainer}>
        {/* Goals Section */}
        <View style={styles.section}>
          <View style={[styles.pill, { backgroundColor: colors.primary + '20' }]}>
            <Icon name="target" size={18} color={colors.primary} />
            <Text style={[styles.pillText, { color: colors.primary }]}>Goals</Text>
          </View>
          <Text style={styles.description}>Life aspirations that motivate you</Text>
          <View style={styles.examplesList}>
            {EXAMPLES.map((item, index) => (
              <HighlightedText
                key={item.goal}
                text={item.goal}
                isGoal={true}
                index={index}
                activeIndex={activeIndex}
              />
            ))}
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <Icon name="chevron-down" size={20} color={colors.text.tertiary} />
        </View>

        {/* Habits Section */}
        <View style={styles.section}>
          <View style={[styles.pill, { backgroundColor: colors.info + '20' }]}>
            <Icon name="checkCircle" size={18} color={colors.info} />
            <Text style={[styles.pillText, { color: colors.info }]}>Habits</Text>
          </View>
          <Text style={styles.description}>Daily actions that achieve your goals</Text>
          <View style={styles.examplesList}>
            {EXAMPLES.map((item, index) => (
              <HighlightedText
                key={item.habit}
                text={item.habit}
                isGoal={false}
                index={index}
                activeIndex={activeIndex}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.benefitSection}>
        <Text style={styles.benefitText}>
          Next, we'll set your first goal. Later, when you create habits you can link them to goals to track progress towards your long-term outcomes.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },

  iconContainer: {
    padding: spacing[2],
    backgroundColor: colors.accent.light,
    borderRadius: spacing[2],
    marginBottom: spacing[2],
    ...shadows.sm,
  },

  title: {
    ...textStyles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[1],
  },

  subtitle: {
    ...textStyles.body,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },

  comparisonContainer: {
    alignItems: 'flex-start',
  },

  section: {
    width: '100%',
    marginBottom: spacing[1],
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[1],
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: radiusValues.md,
    marginBottom: spacing[1],
  },

  pillText: {
    ...textStyles.body,
    fontWeight: '700',
  },

  description: {
    ...textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },

  examplesList: {
    gap: spacing[1],
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  bulletWrapper: {
    width: 14,
    height: 14,
    position: 'relative',
  },

  bulletLayerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 14,
    height: 14,
  },

  bulletLayer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bulletOverlay: {
    // Positioned absolute via bulletLayerContainer, stacked on top
  },

  textWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },

  textLayerContainer: {
    // Base layer takes up space in the layout
  },

  activeTextContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },

  exampleItem: {
    ...textStyles.bodySmall,
  },

  inactiveText: {
    color: colors.text.tertiary,
    fontWeight: '400',
  },

  activeText: {
    fontWeight: '700',
  },

  arrowContainer: {
    alignSelf: 'center',
    paddingVertical: spacing[2],
  },

  benefitSection: {
    marginTop: spacing[4],
  },

  benefitText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default GoalExplanationStep;
