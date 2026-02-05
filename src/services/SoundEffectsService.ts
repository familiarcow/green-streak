import { Audio } from 'expo-av';
import logger from '../utils/logger';

type SoundType = 'success' | 'milestone' | 'streak' | 'error';

export class SoundEffectsService {
  private sounds: Map<SoundType, Audio.Sound> = new Map();
  private isEnabled: boolean = true;
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

      // TODO: Load real sound files here via loadSounds()
      this.isInitialized = true;
      logger.debug('SOUND', 'SoundEffectsService initialized');
    } catch (error) {
      logger.error('SOUND', 'Failed to initialize sound service', { error });
    }
  }

  /**
   * Load sound assets. Call during initialize() once you have real .mp3/.wav files.
   *
   * Example:
   *   const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/success.mp3'));
   *   this.sounds.set('success', sound);
   */
  private async loadSounds(): Promise<void> {
    // Add Audio.Sound.createAsync calls here for each SoundType
  }

  async play(type: SoundType): Promise<void> {
    if (!this.isEnabled || !this.isInitialized) return;

    try {
      const sound = this.sounds.get(type);
      if (!sound) return;

      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (error) {
      logger.error('SOUND', 'Failed to play sound', { error, type });
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
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
