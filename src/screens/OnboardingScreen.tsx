import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { AnimatedButton } from '../components/AnimatedButton';
import { OnboardingDemo } from '../components/OnboardingDemo';
import { Icon, IconName } from '../components/common/Icon';
import { TemplateCatalogModal } from '../components/TemplateCatalog';
import { colors, textStyles, spacing, shadows } from '../theme';
import { radiusValues } from '../theme/utils';
import { HabitTemplate } from '../types/templates';
import logger from '../utils/logger';

interface OnboardingScreenProps {
  onComplete: (shouldSetupTask: boolean, selectedTemplate?: HabitTemplate) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const onboardingSteps = [
  {
    id: 1,
    icon: 'heart' as IconName,
    title: 'Welcome to Green Streak!',
    subtitle: 'Build lasting habits with visual progress tracking',
    content: 'Track your daily habits and watch your consistency grow with our GitHub-style contribution graph. Every completion counts towards building your green streak!',
    showGraph: false,
  },
  {
    id: 2,
    icon: 'barChart' as IconName,
    title: 'Visualize Your Progress',
    subtitle: 'See your consistency at a glance',
    content: 'Your habit completions are displayed in an intuitive calendar grid. Darker squares mean more activity - build those streaks and watch your dedication shine!',
    showGraph: true,
  },
  {
    id: 3,
    icon: 'target' as IconName,
    title: 'Track Multiple Habits',
    subtitle: 'One app for all your goals',
    content: 'Whether it\'s exercising, reading, or drinking water - track unlimited habits with custom colors and icons. Each habit can be completed once or multiple times per day.',
    showGraph: false,
  },
  {
    id: 4,
    icon: 'checkCircle' as IconName,
    title: 'Ready to Start?',
    subtitle: 'Your journey begins now',
    content: 'You can set up your first habit right away, or explore the app and add habits later. Either way, you\'re about to start building amazing consistent habits!',
    showGraph: false,
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTemplateCatalog, setShowTemplateCatalog] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnimation = useSharedValue(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({ 
        x: nextStep * screenWidth, 
        animated: true 
      });
      logger.debug('UI', 'Onboarding step changed', { step: nextStep });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      scrollViewRef.current?.scrollTo({ 
        x: prevStep * screenWidth, 
        animated: true 
      });
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const step = Math.round(contentOffsetX / screenWidth);
    if (step !== currentStep) {
      setCurrentStep(step);
    }
  };

  const handleSetupTask = () => {
    logger.info('UI', 'User chose to set up first task during onboarding');
    onComplete(true);
  };

  const handleBrowseTemplates = useCallback(() => {
    logger.info('UI', 'User chose to browse templates during onboarding');
    setShowTemplateCatalog(true);
  }, []);

  const handleSelectTemplate = useCallback((template: HabitTemplate) => {
    logger.info('UI', 'User selected template during onboarding', { templateId: template.id });
    setShowTemplateCatalog(false);
    onComplete(true, template);
  }, [onComplete]);

  const handleSkipSetup = () => {
    logger.info('UI', 'User chose to explore app without setting up task');
    onComplete(false);
  };

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ 
      translateX: withSpring(currentStep * (spacing[2] + 8)) 
    }],
  }));

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepCounter}>
          {currentStep + 1} of {onboardingSteps.length}
        </Text>
        {currentStep > 0 && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scrollContainer}
      >
        {onboardingSteps.map((step, index) => (
          <View key={step.id} style={styles.stepContainer}>
            <ScrollView
              style={styles.contentScrollView}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {!step.showGraph && (
                <Animated.View
                  entering={FadeInUp.delay(200)}
                  style={styles.iconContainer}
                >
                  <Icon
                    name={step.icon}
                    size={64}
                    color={colors.primary}
                  />
                </Animated.View>
              )}

              <Animated.View
                entering={FadeInUp.delay(300)}
                style={styles.textContainer}
              >
                <Text style={styles.title}>{step.title}</Text>
                <Text style={styles.subtitle}>{step.subtitle}</Text>
                <Text style={styles.content}>{step.content}</Text>
              </Animated.View>

              {step.showGraph && (
                <Animated.View
                  entering={SlideInRight.delay(400)}
                  style={styles.graphContainer}
                >
                  <OnboardingDemo />
                </Animated.View>
              )}
            </ScrollView>

            <View style={styles.actionsContainer}>
              {!isLastStep || index !== currentStep ? (
                <AnimatedButton
                  title="Continue"
                  onPress={handleNext}
                  variant="primary"
                  size="large"
                />
              ) : (
                <View style={styles.finalButtons}>
                  <AnimatedButton
                    title="Choose from Templates"
                    onPress={handleBrowseTemplates}
                    variant="primary"
                    size="large"
                    style={styles.primaryAction}
                  />
                  <TouchableOpacity
                    onPress={handleSetupTask}
                    style={styles.secondaryActionButton}
                  >
                    <Icon name="plus" size={18} color={colors.primary} />
                    <Text style={styles.secondaryActionButtonText}>
                      Create Custom Habit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSkipSetup}
                    style={styles.secondaryAction}
                  >
                    <Text style={styles.secondaryActionText}>
                      Explore First
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.progressIndicator}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep ? styles.progressDotActive : styles.progressDotInactive
              ]}
            />
          ))}
          <Animated.View style={[styles.progressIndicatorActive, animatedIndicatorStyle]} />
        </View>
      </View>

      {/* Template Catalog Modal */}
      <TemplateCatalogModal
        visible={showTemplateCatalog}
        onClose={() => setShowTemplateCatalog(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  stepCounter: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  backButton: {
    padding: spacing[2],
  },

  backButtonText: {
    ...textStyles.button,
    color: colors.primary,
  },

  scrollContainer: {
    flex: 1,
  },

  stepContainer: {
    width: screenWidth,
    flex: 1,
    justifyContent: 'space-between',
  },

  contentScrollView: {
    flex: 1,
  },

  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconContainer: {
    marginBottom: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.accent.light,
    borderRadius: spacing[4],
    ...shadows.sm,
  },

  textContainer: {
    alignItems: 'center',
    marginBottom: spacing[3],
  },

  title: {
    ...textStyles.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },

  subtitle: {
    ...textStyles.h3,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing[4],
    fontWeight: '600',
  },

  content: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing[2],
  },

  graphContainer: {
    width: '100%',
  },

  actionsContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },

  finalButtons: {
    alignItems: 'center',
    gap: spacing[3],
  },

  primaryAction: {
    width: '100%',
  },

  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing[2],
  },

  secondaryActionButtonText: {
    ...textStyles.button,
    color: colors.primary,
  },

  secondaryAction: {
    padding: spacing[3],
  },

  secondaryActionText: {
    ...textStyles.button,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  footer: {
    paddingVertical: spacing[2],
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  progressIndicator: {
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'center',
  },

  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: spacing[1],
  },

  progressDotActive: {
    backgroundColor: 'transparent',
  },

  progressDotInactive: {
    backgroundColor: colors.interactive.default,
  },

  progressIndicatorActive: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});

export default OnboardingScreen;