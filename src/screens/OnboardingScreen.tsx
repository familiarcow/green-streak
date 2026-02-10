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
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AnimatedButton } from '../components/AnimatedButton';
import { OnboardingDemo } from '../components/OnboardingDemo';
import { Icon, IconName } from '../components/common/Icon';
import { TemplateCatalogModal } from '../components/TemplateCatalog';
import { CalendarColorPreview } from '../components/CalendarColorPreview';
import { HueBar } from '../components/ColorPicker/HueBar';
import { GoalExplanationStep, GoalPickerStep } from '../components/onboarding';
import { colors, textStyles, spacing, shadows } from '../theme';
import { radiusValues } from '../theme/utils';
import { HabitTemplate } from '../types/templates';
import { useSettingsStore, DEFAULT_CALENDAR_COLOR } from '../store/settingsStore';
import { useSounds } from '../hooks';
import { CALENDAR_COLOR_PRESETS, generateContributionPalette, hexToHsv, hsvToHex } from '../utils/colorUtils';
import notificationService from '../services/NotificationService';
import { getGoalService } from '../services';
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
    subtitle: 'Build healthy habits and become who you were meant to be',
    content: 'Every green square on the contribution chart is a promise kept to yourself. Watch your consistency grow, one day at a time.',
    showGraph: false,
    showSettings: false,
    showGoalExplanation: false,
    showGoalPicker: false,
  },
  {
    id: 2,
    icon: 'barChart' as IconName,
    title: 'Visualize Your Progress',
    subtitle: 'See your consistency at a glance',
    content: 'Your habit completions are displayed in an intuitive calendar grid. Darker squares mean more activity - build those streaks and watch your dedication shine!',
    showGraph: true,
    showSettings: false,
    showGoalExplanation: false,
    showGoalPicker: false,
  },
  {
    id: 3,
    icon: 'target' as IconName,
    title: 'Goals & Habits',
    subtitle: 'The "why" behind the "what"',
    content: '',
    showGraph: false,
    showSettings: false,
    showGoalExplanation: true,
    showGoalPicker: false,
  },
  {
    id: 4,
    icon: 'target' as IconName,
    title: 'Choose Your Goals',
    subtitle: 'Select the life goals that matter most',
    content: '',
    showGraph: false,
    showSettings: false,
    showGoalExplanation: false,
    showGoalPicker: true,
  },
  {
    id: 5,
    icon: 'settings' as IconName,
    title: 'Settings',
    subtitle: 'Set up your preferences',
    content: '',
    showGraph: false,
    showSettings: true,
    showGoalExplanation: false,
    showGoalPicker: false,
  },
  {
    id: 6,
    icon: 'checkCircle' as IconName,
    title: 'Ready to Start?',
    subtitle: 'Your journey begins now',
    content: 'You can set up your first habit right away, or explore the app and add habits later.',
    showGraph: false,
    showSettings: false,
    showGoalExplanation: false,
    showGoalPicker: false,
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTemplateCatalog, setShowTemplateCatalog] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnimation = useSharedValue(0);

  // Settings state
  const [selectedColor, setSelectedColor] = useState(DEFAULT_CALENDAR_COLOR);
  const [colorPickerExpanded, setColorPickerExpanded] = useState(false);
  const [hue, setHue] = useState(() => {
    const hsv = hexToHsv(DEFAULT_CALENDAR_COLOR);
    return hsv?.h || 120;
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dailyRemindersEnabled, setDailyRemindersEnabled] = useState(false);
  const [streakProtectionEnabled, setStreakProtectionEnabled] = useState(false);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [use24HourFormat, setUse24HourFormat] = useState(false);

  // Goals state
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [primaryGoalId, setPrimaryGoalId] = useState<string | null>(null);

  // Handle hue change from slider
  const handleHueChange = useCallback((newHue: number) => {
    setHue(newHue);
    // Convert hue to hex with fixed saturation and value for vibrant colors
    const newColor = hsvToHex(newHue, 0.7, 0.85);
    setSelectedColor(newColor);
  }, []);

  // Handle preset color selection
  const handlePresetSelect = useCallback((color: string) => {
    setSelectedColor(color);
    const hsv = hexToHsv(color);
    if (hsv) {
      setHue(hsv.h);
    }
  }, []);

  // Handle goal toggle (select/deselect)
  const handleToggleGoal = useCallback((goalId: string) => {
    setSelectedGoalIds(prev => {
      const isSelected = prev.includes(goalId);
      if (isSelected) {
        // Deselect - also clear primary if it was the primary goal
        if (primaryGoalId === goalId) {
          // Set the first remaining goal as primary, or null if none left
          const remaining = prev.filter(id => id !== goalId);
          setPrimaryGoalId(remaining.length > 0 ? remaining[0] : null);
        }
        return prev.filter(id => id !== goalId);
      } else {
        // Select - if no primary yet, make this the primary
        const newSelected = [...prev, goalId];
        if (primaryGoalId === null) {
          setPrimaryGoalId(goalId);
        }
        return newSelected;
      }
    });
  }, [primaryGoalId]);

  // Handle setting primary goal
  const handleSetPrimaryGoal = useCallback((goalId: string) => {
    setPrimaryGoalId(goalId);
    // Ensure the goal is selected
    setSelectedGoalIds(prev => {
      if (!prev.includes(goalId)) {
        return [...prev, goalId];
      }
      return prev;
    });
  }, []);

  // Settings store
  const { setCalendarColor, updateNotificationSettings, setSoundEffectsEnabled: saveSoundEffectsEnabled, setUse24HourFormat: saveUse24HourFormat } = useSettingsStore();

  // Sound effects
  const { playToggle, playExpand, playRandomTap, playRandomType, play } = useSounds();


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

  // Save settings before completing onboarding
  const saveOnboardingSettings = useCallback(async () => {
    try {
      // Save calendar color
      setCalendarColor(selectedColor);

      // Save sound effects setting
      saveSoundEffectsEnabled(soundEffectsEnabled);

      // Save 24-hour format setting
      saveUse24HourFormat(use24HourFormat);

      // Request notification permissions if any notification setting is enabled
      if (notificationsEnabled || dailyRemindersEnabled || streakProtectionEnabled) {
        const hasPermission = await notificationService.requestPermissions();
        if (!hasPermission) {
          logger.warn('UI', 'Notification permission denied during onboarding');
        }
      }

      // Save notification settings
      await updateNotificationSettings({
        global: {
          enabled: notificationsEnabled,
        },
        daily: {
          enabled: dailyRemindersEnabled,
        },
        streaks: {
          protectionEnabled: streakProtectionEnabled,
        },
      });

      // Save selected goals
      if (selectedGoalIds.length > 0) {
        try {
          const goalService = getGoalService();
          for (const goalId of selectedGoalIds) {
            const isPrimary = goalId === primaryGoalId;
            await goalService.selectGoal(goalId, isPrimary);
          }
          logger.info('UI', 'Goals saved during onboarding', {
            count: selectedGoalIds.length,
            primaryGoalId,
          });
        } catch (goalError) {
          logger.error('UI', 'Failed to save goals during onboarding', { error: goalError });
          // Don't fail the whole onboarding if goals fail to save
        }
      }

      logger.info('UI', 'Onboarding settings saved', {
        calendarColor: selectedColor,
        soundEffectsEnabled,
        use24HourFormat,
        notificationsEnabled,
        dailyRemindersEnabled,
        streakProtectionEnabled,
        goalsCount: selectedGoalIds.length,
      });
    } catch (error) {
      logger.error('UI', 'Failed to save onboarding settings', { error });
    }
  }, [selectedColor, soundEffectsEnabled, use24HourFormat, notificationsEnabled, dailyRemindersEnabled, streakProtectionEnabled, selectedGoalIds, primaryGoalId, setCalendarColor, saveSoundEffectsEnabled, saveUse24HourFormat, updateNotificationSettings]);

  const handleSetupTask = async () => {
    logger.info('UI', 'User chose to set up first task during onboarding');
    await saveOnboardingSettings();
    onComplete(true);
  };

  const handleBrowseTemplates = useCallback(() => {
    logger.info('UI', 'User chose to browse templates during onboarding');
    setShowTemplateCatalog(true);
  }, []);

  const handleSelectTemplate = useCallback(async (template: HabitTemplate) => {
    logger.info('UI', 'User chose to customize template during onboarding', { templateId: template.id });
    setShowTemplateCatalog(false);
    await saveOnboardingSettings();
    onComplete(true, template);
  }, [onComplete, saveOnboardingSettings]);

  const handleSkipSetup = async () => {
    logger.info('UI', 'User chose to explore app without setting up task');
    await saveOnboardingSettings();
    onComplete(false);
  };

  // Handle master notifications toggle
  const handleNotificationsToggle = useCallback(async (enabled: boolean) => {
    playToggle(enabled);
    if (enabled) {
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setNotificationsEnabled(enabled);
    // If turning off master notifications, turn off sub-notifications too
    if (!enabled) {
      setDailyRemindersEnabled(false);
      setStreakProtectionEnabled(false);
    }
  }, [playToggle]);

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
          <TouchableOpacity
            onPress={() => {
              play('close');
              handleBack();
            }}
            style={styles.backButton}
          >
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

              {step.showGoalExplanation && (
                <GoalExplanationStep />
              )}

              {step.showGoalPicker && (
                <GoalPickerStep
                  selectedGoalIds={selectedGoalIds}
                  primaryGoalId={primaryGoalId}
                  onToggleGoal={handleToggleGoal}
                  onSetPrimary={handleSetPrimaryGoal}
                />
              )}

              {step.showSettings && (
                <Animated.View
                  entering={FadeInUp.delay(300)}
                  style={styles.settingsContainer}
                >
                  {/* Calendar Color Selection */}
                  <View style={styles.settingSection}>
                    <Text style={styles.settingSectionTitle}>Calendar Color</Text>

                    {/* Color Preview Row */}
                    <View style={styles.colorPreviewRow}>
                      <View style={styles.colorPreviewLeft}>
                        <CalendarColorPreview
                          palette={generateContributionPalette(selectedColor)}
                          size={24}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.editColorButton}
                        onPress={() => {
                          playExpand(!colorPickerExpanded);
                          setColorPickerExpanded(!colorPickerExpanded);
                        }}
                        accessibilityLabel={colorPickerExpanded ? "Close color picker" : "Edit color"}
                      >
                        <Text style={styles.editColorButtonText}>
                          {colorPickerExpanded ? 'Done' : 'Edit'}
                        </Text>
                        <Icon
                          name={colorPickerExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Expandable Color Options */}
                    {colorPickerExpanded && (
                      <Animated.View
                        entering={FadeInUp.duration(200)}
                        style={styles.colorOptionsContainer}
                      >
                        <View style={styles.colorOptionsRow}>
                          {CALENDAR_COLOR_PRESETS.map((color) => (
                            <TouchableOpacity
                              key={color}
                              style={[
                                styles.colorOption,
                                { backgroundColor: color },
                                selectedColor.toUpperCase() === color.toUpperCase() && styles.colorOptionSelected,
                              ]}
                              onPress={() => {
                                playRandomTap();
                                handlePresetSelect(color);
                              }}
                              accessibilityLabel={`Select ${color} color`}
                            />
                          ))}
                        </View>
                        <GestureHandlerRootView style={styles.hueBarContainer}>
                          <HueBar
                            hue={hue}
                            onHueChange={handleHueChange}
                            onDragSound={playRandomType}
                            width={screenWidth - spacing[8] * 2 - spacing[6]}
                            height={28}
                          />
                        </GestureHandlerRootView>
                      </Animated.View>
                    )}
                  </View>

                  {/* Notification Settings */}
                  <View style={styles.settingSection}>
                    <Text style={styles.settingSectionTitle}>Notifications</Text>

                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Enable Notifications</Text>
                        <Text style={styles.settingDescription}>
                          Allow reminders and alerts
                        </Text>
                      </View>
                      <Switch
                        value={notificationsEnabled}
                        onValueChange={handleNotificationsToggle}
                        trackColor={{ false: colors.interactive.default, true: colors.primary }}
                        thumbColor={colors.surface}
                      />
                    </View>

                    <View style={[styles.settingRow, !notificationsEnabled && styles.settingRowDisabled]}>
                      <View style={styles.settingInfo}>
                        <Text style={[styles.settingLabel, !notificationsEnabled && styles.settingLabelDisabled]}>
                          Daily Reminders
                        </Text>
                        <Text style={styles.settingDescription}>
                          Get reminded to log your habits
                        </Text>
                      </View>
                      <Switch
                        value={dailyRemindersEnabled}
                        onValueChange={(enabled) => {
                          playToggle(enabled);
                          setDailyRemindersEnabled(enabled);
                        }}
                        disabled={!notificationsEnabled}
                        trackColor={{ false: colors.interactive.default, true: colors.primary }}
                        thumbColor={colors.surface}
                      />
                    </View>

                    <View style={[styles.settingRow, !notificationsEnabled && styles.settingRowDisabled]}>
                      <View style={styles.settingInfo}>
                        <Text style={[styles.settingLabel, !notificationsEnabled && styles.settingLabelDisabled]}>
                          Streak Protection
                        </Text>
                        <Text style={styles.settingDescription}>
                          Get warned before losing a streak
                        </Text>
                      </View>
                      <Switch
                        value={streakProtectionEnabled}
                        onValueChange={(enabled) => {
                          playToggle(enabled);
                          setStreakProtectionEnabled(enabled);
                        }}
                        disabled={!notificationsEnabled}
                        trackColor={{ false: colors.interactive.default, true: colors.primary }}
                        thumbColor={colors.surface}
                      />
                    </View>
                  </View>

                  {/* Sound Effects Section */}
                  <View style={styles.settingSection}>
                    <Text style={styles.settingSectionTitle}>Sound Effects</Text>

                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Enable Sound Effects</Text>
                        <Text style={styles.settingDescription}>
                          Play sounds on actions
                        </Text>
                      </View>
                      <Switch
                        value={soundEffectsEnabled}
                        onValueChange={(enabled) => {
                          if (enabled) {
                            // Turning ON: save first, then play sound
                            saveSoundEffectsEnabled(enabled);
                            setSoundEffectsEnabled(enabled);
                            playToggle(enabled);
                          } else {
                            // Turning OFF: play sound first (while still enabled), then save
                            playToggle(enabled);
                            saveSoundEffectsEnabled(enabled);
                            setSoundEffectsEnabled(enabled);
                          }
                        }}
                        trackColor={{ false: colors.interactive.default, true: colors.primary }}
                        thumbColor={colors.surface}
                      />
                    </View>
                  </View>

                  {/* Time Format Section */}
                  <View style={styles.settingSection}>
                    <Text style={styles.settingSectionTitle}>Time Format</Text>

                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>24-Hour Format</Text>
                        <Text style={styles.settingDescription}>
                          Use 24-hour time format
                        </Text>
                      </View>
                      <Switch
                        value={use24HourFormat}
                        onValueChange={(enabled) => {
                          playToggle(enabled);
                          setUse24HourFormat(enabled);
                        }}
                        trackColor={{ false: colors.interactive.default, true: colors.primary }}
                        thumbColor={colors.surface}
                      />
                    </View>
                  </View>
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
                    title="Browse Habit Templates"
                    onPress={handleBrowseTemplates}
                    variant="primary"
                    size="large"
                    style={styles.primaryAction}
                  />
                  <View style={styles.secondaryActionsRow}>
                    <TouchableOpacity
                      onPress={() => {
                        playRandomTap();
                        handleSkipSetup();
                      }}
                      style={styles.skipButton}
                    >
                      <Text style={styles.skipButtonText}>Skip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        playRandomTap();
                        handleSetupTask();
                      }}
                      style={styles.secondaryActionButton}
                    >
                      <Icon name="edit" size={16} color={colors.primary} />
                      <Text style={styles.secondaryActionButtonText}>
                        Custom
                      </Text>
                    </TouchableOpacity>
                  </View>
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
    gap: spacing[2],
  },

  primaryAction: {
    width: '100%',
  },

  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },

  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },

  secondaryActionButtonText: {
    ...textStyles.button,
    color: colors.primary,
    fontWeight: '600',
  },

  skipButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },

  skipButtonText: {
    ...textStyles.body,
    color: colors.text.tertiary,
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

  // Settings step styles
  settingsContainer: {
    width: '100%',
    paddingHorizontal: spacing[2],
  },

  settingSection: {
    marginBottom: spacing[4],
  },

  settingSectionTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing[3],
    fontWeight: '600',
  },

  colorPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[3],
    ...shadows.sm,
  },

  colorPreviewLeft: {
    flex: 1,
  },

  editColorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },

  editColorButtonText: {
    ...textStyles.button,
    color: colors.primary,
    fontWeight: '600',
  },

  colorOptionsContainer: {
    marginTop: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[3],
    ...shadows.sm,
  },

  colorOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },

  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    ...shadows.sm,
    borderWidth: 3,
    borderColor: 'transparent',
  },

  colorOptionSelected: {
    borderColor: colors.text.primary,
  },

  hueBarContainer: {
    marginTop: spacing[4],
    alignItems: 'center',
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  settingRowDisabled: {
    opacity: 0.5,
  },

  settingInfo: {
    flex: 1,
    marginRight: spacing[3],
  },

  settingLabel: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: spacing[1],
  },

  settingLabelDisabled: {
    color: colors.text.tertiary,
  },

  settingDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
});

export default OnboardingScreen;