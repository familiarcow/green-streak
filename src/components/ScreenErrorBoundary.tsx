import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';
import { colors, textStyles, spacing, shadows } from '../theme';
import { radiusValues } from '../theme/utils';
import { Icon } from './common/Icon';

interface ScreenErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  onClose?: () => void;
  screenName?: string;
}

/**
 * Specialized error boundary for screens and modals with custom retry and close actions
 */
export const ScreenErrorBoundary: React.FC<ScreenErrorBoundaryProps> = ({
  children,
  onRetry,
  onClose,
  screenName = 'Screen',
}) => {
  const renderErrorFallback = (
    <View style={styles.container}>
      <View style={styles.errorCard}>
        <View style={styles.iconContainer}>
          <Icon name="x" size={32} color={colors.error} />
        </View>
        
        <Text style={styles.title}>Error Loading {screenName}</Text>
        <Text style={styles.message}>
          Something went wrong while loading this screen. Please try again or go back.
        </Text>

        <View style={styles.buttonContainer}>
          {onRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel="Retry loading screen"
            >
              <Icon name="loader" size={16} color={colors.text.inverse} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}

          {onClose && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close screen"
            >
              <Icon name="x" size={16} color={colors.text.secondary} />
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ErrorBoundary fallback={renderErrorFallback}>
      {children}
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },

  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[5],
    maxWidth: 320,
    width: '100%',
    alignItems: 'center',
    ...shadows.sm,
  },

  iconContainer: {
    marginBottom: spacing[3],
  },

  title: {
    ...textStyles.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },

  message: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: 20,
  },

  buttonContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },

  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radiusValues.box,
    paddingVertical: spacing[3],
    gap: spacing[2],
  },

  retryButtonText: {
    ...textStyles.body,
    color: colors.text.inverse,
    fontWeight: '600',
  },

  closeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.interactive.default,
    borderRadius: radiusValues.box,
    paddingVertical: spacing[3],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
  },

  closeButtonText: {
    ...textStyles.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
});

export default ScreenErrorBoundary;