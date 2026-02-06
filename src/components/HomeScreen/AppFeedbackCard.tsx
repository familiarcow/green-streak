/**
 * AppFeedbackCard Component
 *
 * Prompts users to rate the app or provide feedback.
 * Shows after 3+ days of logged activity.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { Icon } from '../common/Icon';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues } from '../../theme/utils';
import { useSettingsStore } from '../../store/settingsStore';
import { useAccentColor, useSounds } from '../../hooks';
import logger from '../../utils/logger';

const FEEDBACK_EMAIL = 'familiarcow@proton.me';
const FEEDBACK_SUBJECT = 'Green Streak Feedback';
const FEEDBACK_BODY = `Hi! I'd like to share some feedback about Green Streak:

`;

interface AppFeedbackCardProps {
  activeDaysCount: number;
}

export const AppFeedbackCard: React.FC<AppFeedbackCardProps> = React.memo(({ activeDaysCount }) => {
  const { shouldShowRatingPrompt, dismissRatingPrompt } = useSettingsStore();
  const accentColor = useAccentColor();
  const { playRandomTap, playCelebration, playCaution } = useSounds();

  // Check if we should show the prompt
  const shouldShow = shouldShowRatingPrompt(activeDaysCount);

  const handlePositiveFeedback = useCallback(async () => {
    playRandomTap();
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
        playCelebration();
        logger.info('UI', 'Store review requested');
      } else {
        // Fallback: open App Store page directly
        const storeUrl = StoreReview.storeUrl();
        if (storeUrl) {
          await Linking.openURL(storeUrl);
          playCelebration();
        } else {
          Alert.alert(
            'Thank You!',
            'We appreciate your support! Store reviews are not available on this device.'
          );
        }
      }
      dismissRatingPrompt(true); // Permanently dismiss after rating
    } catch (error) {
      logger.error('UI', 'Failed to open store review', { error });
      Alert.alert('Error', 'Could not open the App Store. Please try again later.');
    }
  }, [playRandomTap, playCelebration, dismissRatingPrompt]);

  const handleNegativeFeedback = useCallback(async () => {
    playRandomTap();
    try {
      const mailtoUrl = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(FEEDBACK_SUBJECT)}&body=${encodeURIComponent(FEEDBACK_BODY)}`;
      const canOpen = await Linking.canOpenURL(mailtoUrl);

      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        logger.info('UI', 'Feedback email opened');
      } else {
        Alert.alert(
          'Send Feedback',
          `Please email your feedback to:\n\n${FEEDBACK_EMAIL}`,
          [{ text: 'OK' }]
        );
      }
      dismissRatingPrompt(true); // Permanently dismiss after providing feedback
    } catch (error) {
      logger.error('UI', 'Failed to open email', { error });
      Alert.alert(
        'Send Feedback',
        `Please email your feedback to:\n\n${FEEDBACK_EMAIL}`,
        [{ text: 'OK' }]
      );
      dismissRatingPrompt(true);
    }
  }, [playRandomTap, dismissRatingPrompt]);

  const handleDismissTemporarily = useCallback(() => {
    playCaution();
    dismissRatingPrompt(false); // Temporary dismiss (5 days)
    logger.info('UI', 'Rating prompt dismissed temporarily');
  }, [playCaution, dismissRatingPrompt]);

  const handleDismissPermanently = useCallback(() => {
    playCaution();
    dismissRatingPrompt(true); // Permanent dismiss
    logger.info('UI', 'Rating prompt dismissed permanently');
  }, [playCaution, dismissRatingPrompt]);

  if (!shouldShow) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Question */}
        <Text style={styles.question}>Are you enjoying Green Streak?</Text>

        {/* Feedback buttons */}
        <View style={styles.feedbackRow}>
          <TouchableOpacity
            style={[styles.feedbackButton, { borderColor: colors.text.tertiary }]}
            onPress={handleNegativeFeedback}
            accessibilityLabel="No, I have feedback"
            accessibilityRole="button"
          >
            <Icon name="thumbs-down" size={24} color={colors.text.tertiary} />
            <Text style={[styles.feedbackButtonText, { color: colors.text.tertiary }]}>Not really</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.feedbackButton, { borderColor: colors.success }]}
            onPress={handlePositiveFeedback}
            accessibilityLabel="Yes, I'm enjoying the app"
            accessibilityRole="button"
          >
            <Icon name="thumbs-up" size={24} color={colors.success} />
            <Text style={[styles.feedbackButtonText, { color: colors.success }]}>Yes!</Text>
          </TouchableOpacity>
        </View>

        {/* Dismiss options */}
        <View style={styles.dismissRow}>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismissPermanently}
            accessibilityLabel="Never ask again"
            accessibilityRole="button"
          >
            <Text style={styles.dismissText}>Don't ask again</Text>
          </TouchableOpacity>

          <View style={styles.dismissDivider} />

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismissTemporarily}
            accessibilityLabel="Ask me later"
            accessibilityRole="button"
          >
            <Text style={styles.dismissText}>Ask later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[4],
    ...shadows.sm,
  },
  question: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  feedbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radiusValues.box,
    borderWidth: 2,
    backgroundColor: colors.background,
  },
  feedbackButtonText: {
    ...textStyles.body,
    fontWeight: '600',
  },
  dismissRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  dismissText: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
  },
  dismissDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.divider,
  },
});

export default AppFeedbackCard;
