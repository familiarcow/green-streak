import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AnimatedLoader } from './src/components/AnimatedLoader';
import { initializeDatabase } from './src/database';
import { runSeed } from './src/utils/devSeed';
import { SeedConfig } from './src/types';
import { initializeSettings } from './src/store/settingsStore';
import { useOnboardingStore } from './src/store/onboardingStore';
import { useTasksStore } from './src/store/tasksStore';
import { setupDevEnvironment, getDevConfig } from './src/utils/devConfig';
import { getStreakService, getDateService } from './src/services';
import { setSystemDate } from './src/store/systemStore';
import HomeScreen from './src/screens/HomeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import EditTaskModal from './src/screens/EditTaskModal';
import { colors, textStyles, spacing } from './src/theme';
import logger from './src/utils/logger';

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  
  const { hasCompletedOnboarding, completeOnboarding } = useOnboardingStore();
  const { tasks, loadTasks } = useTasksStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Set up development environment first
        setupDevEnvironment();
        
        logger.info('UI', 'App starting initialization');

        // Initialize database
        await initializeDatabase();

        // Initialize settings and notifications
        await initializeSettings();

        // Initialize DateService and connect to system store
        try {
          logger.info('UI', 'Initializing DateService');
          const dateService = getDateService();
          dateService.initialize();
          
          // Subscribe to date changes and update system store
          dateService.subscribe((newDate) => {
            logger.info('UI', 'Date changed, updating system store', { newDate });
            setSystemDate(newDate);
          });
          
          logger.info('UI', 'DateService initialized successfully');
        } catch (error) {
          logger.error('UI', 'Failed to initialize DateService', { error });
          // Don't fail app initialization if date service fails
        }

        // Handle development seeding based on CLI flags
        const { shouldSeed, seedConfig } = getDevConfig();
        
        if (shouldSeed && seedConfig) {
          try {
            logger.info('DEV', 'Running development seed with CLI configuration', {
              tasks: seedConfig.tasks,
              days: seedConfig.days,
              reset: seedConfig.reset,
            });
            await runSeed(seedConfig);
          } catch (seedError) {
            // Don't fail the app if seeding fails, just log it
            logger.warn('DEV', 'Development seeding failed, continuing without seed data', { 
              error: seedError 
            });
          }
        } else if (__DEV__) {
          logger.info('DEV', 'Development mode active but seeding disabled');
        }

        // Load tasks to determine if we should show onboarding
        await loadTasks();
        
        // IMPORTANT: Validate streaks AFTER all data is loaded
        // This ensures we recalculate from actual completion history
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to ensure DB is ready
        
        try {
          logger.info('UI', 'Starting streak validation/recalculation');
          const streakService = getStreakService();
          await streakService.validateAllStreaks();
          logger.info('UI', 'Streak validation completed successfully');
        } catch (error) {
          logger.error('UI', 'Failed to validate streaks on startup', { 
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
        }
        
        setIsInitialized(true);
        logger.info('UI', 'App initialization completed');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        logger.fatal('UI', 'App initialization failed', { error: errorMessage });
        setInitError(errorMessage);
      }
    };

    initializeApp();
  }, []);

  // Check if we should show onboarding after initialization
  useEffect(() => {
    if (isInitialized && !hasCompletedOnboarding && tasks.length === 0) {
      setShowOnboarding(true);
      logger.info('UI', 'Showing onboarding for new user');
    }
  }, [isInitialized, hasCompletedOnboarding, tasks.length]);

  const handleOnboardingComplete = (shouldSetupTask: boolean) => {
    completeOnboarding();
    setShowOnboarding(false);
    
    if (shouldSetupTask) {
      setShowAddTask(true);
      logger.info('UI', 'User chose to set up first task after onboarding');
    } else {
      logger.info('UI', 'User chose to explore app after onboarding');
    }
  };

  const handleTaskAdded = () => {
    setShowAddTask(false);
    // Refresh tasks will happen automatically through the store
  };

  if (initError) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Initialization Error</Text>
          <Text style={styles.errorText}>{initError}</Text>
          <StatusBar style="auto" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <AnimatedLoader 
            text="Initializing Green Streak..." 
            size="large"
            color={colors.primary}
          />
          <StatusBar style="auto" />
        </View>
      </SafeAreaProvider>
    );
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
        <StatusBar style="dark" backgroundColor={colors.background} />
      </SafeAreaProvider>
    );
  }

  // Show add task screen if user chose to set up task after onboarding
  if (showAddTask) {
    return (
      <SafeAreaProvider>
        <EditTaskModal
          onClose={() => setShowAddTask(false)}
          onTaskAdded={handleTaskAdded}
        />
        <StatusBar style="dark" backgroundColor={colors.background} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <HomeScreen />
      <StatusBar style="dark" backgroundColor={colors.background} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  
  loadingText: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginTop: spacing[4],
    textAlign: 'center',
  },
  
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  
  errorTitle: {
    ...textStyles.h2,
    color: colors.error,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  
  errorText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
