import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import logger from '../utils/logger';

type SoundType = 'success' | 'milestone' | 'streak' | 'error';

// Haptic patterns for each sound type
const HAPTIC_PATTERNS: Record<SoundType, () => Promise<void>> = {
  success: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  milestone: async () => {
    // Double haptic for milestones
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  streak: async () => {
    // Triple haptic for streak achievements
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise(resolve => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 80));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  error: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};

export class SoundEffectsService {
  private sounds: Map<SoundType, Audio.Sound> = new Map();
  private isSoundEnabled: boolean = true;
  private isHapticEnabled: boolean = true;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Load sound files if they exist
      await this.loadSounds();

      this.isInitialized = true;
      logger.debug('SOUND', 'SoundEffectsService initialized');
    } catch (error) {
      logger.error('SOUND', 'Failed to initialize sound service', { error });
      // Still mark as initialized so haptics can work
      this.isInitialized = true;
    }
  }

  /**
   * Load sound assets from the assets/sounds directory.
   * Sound files are optional - haptics will still work without them.
   */
  private async loadSounds(): Promise<void> {
    // Sound files to be added in assets/sounds/
    // When you add sound files, uncomment the relevant lines below:
    //
    // try {
    //   const { sound: successSound } = await Audio.Sound.createAsync(
    //     require('../../assets/sounds/success.mp3')
    //   );
    //   this.sounds.set('success', successSound);
    // } catch (e) {
    //   logger.debug('SOUND', 'Success sound not loaded');
    // }
    //
    // try {
    //   const { sound: milestoneSound } = await Audio.Sound.createAsync(
    //     require('../../assets/sounds/milestone.mp3')
    //   );
    //   this.sounds.set('milestone', milestoneSound);
    // } catch (e) {
    //   logger.debug('SOUND', 'Milestone sound not loaded');
    // }
  }

  /**
   * Play a sound effect with optional haptic feedback.
   * Falls back to haptics only if sound file is not available.
   */
  async play(type: SoundType): Promise<void> {
    if (!this.isInitialized) return;
    if (!this.isSoundEnabled && !this.isHapticEnabled) return;

    try {
      // Play haptic feedback first (immediate response)
      if (this.isHapticEnabled) {
        const hapticPattern = HAPTIC_PATTERNS[type];
        if (hapticPattern) {
          hapticPattern().catch(error => {
            logger.debug('SOUND', 'Haptic feedback failed', { error, type });
          });
        }
      }

      // Play audio sound if available and enabled
      if (this.isSoundEnabled) {
        const sound = this.sounds.get(type);
        if (sound) {
          await sound.setPositionAsync(0);
          await sound.playAsync();
        }
      }
    } catch (error) {
      logger.error('SOUND', 'Failed to play sound', { error, type });
    }
  }

  /**
   * Play a simple selection haptic (for UI interactions like toggles)
   */
  async playSelection(): Promise<void> {
    if (!this.isHapticEnabled) return;

    try {
      await Haptics.selectionAsync();
    } catch (error) {
      logger.debug('SOUND', 'Selection haptic failed', { error });
    }
  }

  /**
   * Play a light impact haptic (for button presses)
   */
  async playImpact(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (!this.isHapticEnabled) return;

    try {
      const impactStyle = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      }[style];

      await Haptics.impactAsync(impactStyle);
    } catch (error) {
      logger.debug('SOUND', 'Impact haptic failed', { error });
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.isSoundEnabled = enabled;
  }

  setHapticEnabled(enabled: boolean): void {
    this.isHapticEnabled = enabled;
  }

  /**
   * @deprecated Use setSoundEnabled instead
   */
  setEnabled(enabled: boolean): void {
    this.isSoundEnabled = enabled;
  }

  cleanup(): void {
    this.sounds.forEach((sound, type) => {
      sound.unloadAsync().catch((error) => {
        logger.error('SOUND', 'Failed to unload sound', { type, error });
      });
    });
    this.sounds.clear();
    this.isInitialized = false;
  }
}

export default SoundEffectsService;
