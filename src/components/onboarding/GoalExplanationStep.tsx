/**
 * GoalExplanationStep
 *
 * Onboarding step that explains the difference between goals and habits.
 * Goals are the "why" (motivational anchors), habits are the "what" (daily actions).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { Icon } from '../common/Icon';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { glassStyles } from '../../theme/glass';
import { radiusValues } from '../../theme/utils';

export const GoalExplanationStep: React.FC = () => {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(200)} style={styles.headerSection}>
        <View style={styles.iconContainer}>
          <Icon name="target" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>Goals & Habits</Text>
        <Text style={styles.subtitle}>The "why" behind the "what"</Text>
      </Animated.View>

      <View style={styles.comparisonContainer}>
        <Animated.View
          entering={FadeInRight.delay(400)}
          style={[styles.comparisonCard, glassStyles.card]}
        >
          <View style={[styles.cardHeader, { backgroundColor: colors.primary + '20' }]}>
            <Icon name="target" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Goals</Text>
          </View>
          <Text style={styles.cardDescription}>
            Life aspirations that motivate you
          </Text>
          <View style={styles.exampleContainer}>
            <Text style={styles.exampleLabel}>Examples:</Text>
            <Text style={styles.exampleText}>Better Health</Text>
            <Text style={styles.exampleText}>Career Growth</Text>
            <Text style={styles.exampleText}>Financial Freedom</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)} style={styles.arrowContainer}>
          <Icon name="chevron-down" size={28} color={colors.text.tertiary} />
        </Animated.View>

        <Animated.View
          entering={FadeInRight.delay(500)}
          style={[styles.comparisonCard, glassStyles.card]}
        >
          <View style={[styles.cardHeader, { backgroundColor: colors.info + '20' }]}>
            <Icon name="checkCircle" size={24} color={colors.info} />
            <Text style={[styles.cardTitle, { color: colors.info }]}>Habits</Text>
          </View>
          <Text style={styles.cardDescription}>
            Daily actions that achieve your goals
          </Text>
          <View style={styles.exampleContainer}>
            <Text style={styles.exampleLabel}>Examples:</Text>
            <Text style={styles.exampleText}>Exercise 30 minutes</Text>
            <Text style={styles.exampleText}>Read for 20 minutes</Text>
            <Text style={styles.exampleText}>Save $10 daily</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(600)} style={styles.benefitSection}>
        <Text style={styles.benefitText}>
          Link habits to goals to see how your daily actions contribute to your bigger picture.
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },

  iconContainer: {
    padding: spacing[3],
    backgroundColor: colors.accent.light,
    borderRadius: spacing[3],
    marginBottom: spacing[3],
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
    width: '100%',
    alignItems: 'center',
    gap: spacing[2],
  },

  comparisonCard: {
    width: '100%',
    borderRadius: radiusValues.box,
    padding: spacing[3],
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radiusValues.md,
    marginBottom: spacing[2],
  },

  cardTitle: {
    ...textStyles.h3,
    color: colors.primary,
    fontWeight: '700',
  },

  cardDescription: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },

  exampleContainer: {
    paddingLeft: spacing[2],
  },

  exampleLabel: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '600',
    marginBottom: spacing[1],
  },

  exampleText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },

  arrowContainer: {
    padding: spacing[1],
  },

  benefitSection: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[2],
  },

  benefitText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default GoalExplanationStep;
