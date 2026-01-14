import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';
import { colors, textStyles, spacing, shadows } from '../theme';
import { radiusValues } from '../theme/utils';
import { Icon } from './common/Icon';
import logger from '../utils/logger';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Top-level error boundary for the entire application
 * Catches critical errors that would otherwise crash the app
 */
export const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({ children }) => {
  const handleAppError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log critical app error for monitoring
    logger.error('APP', 'Critical application error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Here you could send error to crash reporting service
    // crashlytics().recordError(error);
  };

  const renderAppErrorFallback = (
    <View style={styles.container}>
      <View style={styles.errorCard}>
        <View style={styles.iconContainer}>
          <Icon name="x" size={64} color={colors.error} />
        </View>
        
        <Text style={styles.title}>App Error</Text>
        <Text style={styles.message}>
          The Green Streak app encountered a critical error. Please restart the app to continue.
        </Text>
        
        <Text style={styles.suggestion}>
          If this problem persists, try reinstalling the app or contact support.
        </Text>

        <TouchableOpacity
          style={styles.restartButton}
          onPress={() => {
            // In a real app, you might trigger a restart or navigation reset
            logger.info('APP', 'User requested app restart from error boundary');
          }}
          accessibilityRole="button"
          accessibilityLabel="Restart app"
        >
          <Icon name="loader" size={18} color={colors.text.inverse} />
          <Text style={styles.restartButtonText}>Restart App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ErrorBoundary 
      fallback={renderAppErrorFallback}
      onError={handleAppError}
    >
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
    borderRadius: spacing[4],
    padding: spacing[6],
    maxWidth: 350,
    width: '100%',
    alignItems: 'center',
    ...shadows.md,
  },

  iconContainer: {
    marginBottom: spacing[4],
  },

  title: {
    ...textStyles.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },

  message: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[3],
    lineHeight: 22,
  },

  suggestion: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing[5],
    lineHeight: 18,
    fontStyle: 'italic',
  },

  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radiusValues.box,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    gap: spacing[2],
    minWidth: 140,
    justifyContent: 'center',
  },

  restartButtonText: {
    ...textStyles.body,
    color: colors.text.inverse,
    fontWeight: '700',
  },
});

export default AppErrorBoundary;