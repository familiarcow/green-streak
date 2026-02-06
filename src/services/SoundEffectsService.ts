import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import logger from '../utils/logger';

export type SoundType = 'celebration' | 'toggle_on' | 'toggle_off' | 'achievement' | 'caution' | 'button' | 'open' | 'close' | 'tap_01' | 'tap_02' | 'tap_03' | 'tap_04' | 'tap_05';

/**
 * Sound priority levels (higher number = higher priority)
 * Higher priority sounds will interrupt lower priority ones.
 * Same priority sounds will not interrupt each other.
 */
const SOUND_PRIORITY: Record<SoundType, number> = {
  button: 1,        // Lowest - common UI feedback
  open: 1,          // Expand/collapse UI feedback
  close: 1,         // Expand/collapse UI feedback
  tap_01: 1,        // Date selection tap
  tap_02: 1,        // Date selection tap
  tap_03: 1,        // Date selection tap
  tap_04: 1,        // Date selection tap
  tap_05: 1,        // Date selection tap
  toggle_on: 2,     // UI feedback
  toggle_off: 2,    // UI feedback
  caution: 3,       // Errors - should be heard
  celebration: 4,   // Milestones - important feedback
  achievement: 5,   // Highest - rare, special event
};

/**
 * Approximate duration of each sound in milliseconds.
 * Used for cooldown to prevent overlapping same-priority sounds.
 */
const SOUND_DURATION: Record<SoundType, number> = {
  button: 100,
  open: 100,
  close: 100,
  tap_01: 100,
  tap_02: 100,
  tap_03: 100,
  tap_04: 100,
  tap_05: 100,
  toggle_on: 150,
  toggle_off: 150,
  caution: 300,
  celebration: 800,
  achievement: 1200,
};

/**
 * Volume levels for each sound type (0.0 to 1.0).
 * Allows fine-tuning the relative loudness of different sounds.
 */
const SOUND_VOLUME: Record<SoundType, number> = {
  button: 1.0,
  open: 0.1,          // Dampened - modal open/close are frequent
  close: 0.1,         // Dampened - modal open/close are frequent
  tap_01: 1.0,
  tap_02: 1.0,
  tap_03: 1.0,
  tap_04: 1.0,
  tap_05: 1.0,
  toggle_on: 1.0,
  toggle_off: 1.0,
  caution: 1.0,
  celebration: 1.0,
  achievement: 1.0,
};

// Sound file mappings
const SOUND_FILES: Record<SoundType, any> = {
  celebration: require('../../assets/sounds/celebration.wav'),
  toggle_on: require('../../assets/sounds/toggle_on.wav'),
  toggle_off: require('../../assets/sounds/toggle_off.wav'),
  achievement: require('../../assets/sounds/achievement.wav'),
  caution: require('../../assets/sounds/caution.wav'),
  button: require('../../assets/sounds/button.wav'),
  open: require('../../assets/sounds/open.wav'),
  close: require('../../assets/sounds/close.wav'),
  tap_01: require('../../assets/sounds/tap_01.wav'),
  tap_02: require('../../assets/sounds/tap_02.wav'),
  tap_03: require('../../assets/sounds/tap_03.wav'),
  tap_04: require('../../assets/sounds/tap_04.wav'),
  tap_05: require('../../assets/sounds/tap_05.wav'),
};

// Haptic patterns for each sound type
const HAPTIC_PATTERNS: Record<SoundType, () => Promise<void>> = {
  celebration: async () => {
    // Double haptic for celebrations
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  toggle_on: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  toggle_off: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  achievement: async () => {
    // Triple haptic for achievements
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise(resolve => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 80));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  caution: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  button: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  open: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  close: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  tap_01: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  tap_02: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  tap_03: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  tap_04: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  tap_05: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
};

/**
 * SoundEffectsService - Single source of truth for sound/haptic feedback.
 *
 * This service manages both audio playback and haptic feedback. All enabled
 * state is managed here - consumers should NOT duplicate enabled checks.
 *
 * Settings sync: The settingsStore calls setSoundEnabled() to sync the
 * soundEffectsEnabled setting to this service.
 */
export class SoundEffectsService {
  private sounds: Map<SoundType, Audio.Sound> = new Map();
  private isSoundEnabled: boolean = true;
  private isHapticEnabled: boolean = true;
  private initPromise: Promise<void> | null = null;

  // Priority system state
  private currentlyPlaying: SoundType | null = null;
  private currentPriority: number = 0;
  private playingUntil: number = 0;

  constructor() {
    // Lazy initialization - don't block constructor
  }

  /**
   * Ensure the service is initialized before use.
   * Uses lazy initialization pattern to avoid race conditions.
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    return this.initPromise;
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

      logger.debug('SOUND', 'SoundEffectsService initialized');
    } catch (error) {
      logger.error('SOUND', 'Failed to initialize sound service', { error });
      // Continue - haptics can still work without audio
    }
  }

  /**
   * Load sound assets from the assets/sounds directory.
   * Sound files are optional - haptics will still work without them.
   */
  private async loadSounds(): Promise<void> {
    const soundTypes: SoundType[] = ['celebration', 'toggle_on', 'toggle_off', 'achievement', 'caution', 'button', 'open', 'close', 'tap_01', 'tap_02', 'tap_03', 'tap_04', 'tap_05'];

    for (const type of soundTypes) {
      try {
        const { sound } = await Audio.Sound.createAsync(SOUND_FILES[type]);
        this.sounds.set(type, sound);
        logger.debug('SOUND', `${type} sound loaded`);
      } catch (error) {
        logger.debug('SOUND', `${type} sound not loaded`, { error });
      }
    }
  }

  /**
   * Check if a sound can play based on priority system.
   * Returns true if the sound should play.
   */
  private canPlaySound(type: SoundType): boolean {
    const now = Date.now();
    const requestedPriority = SOUND_PRIORITY[type];

    // If nothing is playing (or cooldown expired), allow
    if (now >= this.playingUntil) {
      return true;
    }

    // Higher priority sounds can interrupt lower priority ones
    if (requestedPriority > this.currentPriority) {
      return true;
    }

    // Same or lower priority - skip to prevent overlap
    logger.debug('SOUND', 'Sound skipped due to priority', {
      requested: type,
      requestedPriority,
      current: this.currentlyPlaying,
      currentPriority: this.currentPriority,
    });
    return false;
  }

  /**
   * Mark a sound as currently playing.
   */
  private markPlaying(type: SoundType): void {
    this.currentlyPlaying = type;
    this.currentPriority = SOUND_PRIORITY[type];
    this.playingUntil = Date.now() + SOUND_DURATION[type];
  }

  /**
   * Play a sound effect with haptic feedback.
   *
   * This is the single point of control for sound/haptic enabled state.
   * Callers should NOT check enabled state - this method handles it.
   *
   * Priority system: Higher priority sounds interrupt lower priority ones.
   * Same or lower priority sounds are skipped if something is playing.
   */
  async play(type: SoundType): Promise<void> {
    // Early exit if both sound and haptic are disabled
    if (!this.isSoundEnabled && !this.isHapticEnabled) return;

    // Check priority - skip if lower priority sound is requested
    if (!this.canPlaySound(type)) {
      // Still play haptic for UI feedback even if sound is skipped
      if (this.isHapticEnabled && (type === 'button' || type === 'toggle_on' || type === 'toggle_off')) {
        const hapticPattern = HAPTIC_PATTERNS[type];
        if (hapticPattern) {
          hapticPattern().catch(() => {});
        }
      }
      return;
    }

    // Ensure initialization (lazy init pattern)
    await this.ensureInitialized();

    try {
      // Mark this sound as playing
      this.markPlaying(type);

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
          await sound.setVolumeAsync(SOUND_VOLUME[type]);
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

  /**
   * Check if sound effects are currently enabled.
   * Useful for UI to reflect current state.
   */
  isSoundEffectsEnabled(): boolean {
    return this.isSoundEnabled;
  }

  /**
   * Check if haptic feedback is currently enabled.
   */
  isHapticsEnabled(): boolean {
    return this.isHapticEnabled;
  }

  cleanup(): void {
    this.sounds.forEach((sound, type) => {
      sound.unloadAsync().catch((error) => {
        logger.error('SOUND', 'Failed to unload sound', { type, error });
      });
    });
    this.sounds.clear();
    this.initPromise = null;

    // Reset priority state
    this.currentlyPlaying = null;
    this.currentPriority = 0;
    this.playingUntil = 0;
  }
}

export default SoundEffectsService;
