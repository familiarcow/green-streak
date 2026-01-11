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
      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Pre-load sound effects
      await this.loadSounds();
      this.isInitialized = true;
      
      logger.debug('SOUND', 'SoundEffectsService initialized');
    } catch (error) {
      logger.error('SOUND', 'Failed to initialize sound service', { error });
    }
  }

  private async loadSounds(): Promise<void> {
    // For now, we'll use system sounds. In production, you'd load actual sound files
    // from your assets folder like:
    // const { sound } = await Audio.Sound.createAsync(
    //   require('../assets/sounds/success.mp3')
    // );
    
    // For demo purposes, we'll create placeholder sounds
    try {
      // In a real implementation, you would have actual sound files in assets/sounds/
      // For now, we'll log when sounds would play
      logger.debug('SOUND', 'Sound files would be loaded here');
      
      // Example of how to load real sounds:
      // const successSound = await Audio.Sound.createAsync(
      //   require('../assets/sounds/success.mp3')
      // );
      // this.sounds.set('success', successSound.sound);
    } catch (error) {
      logger.error('SOUND', 'Failed to load sound files', { error });
    }
  }

  async play(type: SoundType): Promise<void> {
    if (!this.isEnabled || !this.isInitialized) {
      return;
    }

    try {
      const sound = this.sounds.get(type);
      
      if (sound) {
        // Reset to beginning
        await sound.setPositionAsync(0);
        await sound.playAsync();
        
        logger.debug('SOUND', 'Playing sound', { type });
      } else {
        // Fallback for when sounds aren't loaded
        logger.debug('SOUND', 'Sound effect triggered (no file loaded)', { type });
        
        // Use system sound as fallback
        await this.playSystemSound(type);
      }
    } catch (error) {
      logger.error('SOUND', 'Failed to play sound', { error, type });
    }
  }

  private async playSystemSound(type: SoundType): Promise<void> {
    try {
      // Create a temporary sound with a simple tone
      // In production, you would have actual sound files
      const { sound } = await Audio.Sound.createAsync(
        { uri: this.getSystemSoundUri(type) },
        { shouldPlay: true }
      );

      // Clean up after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      // Silently fail if system sounds aren't available
      logger.debug('SOUND', 'System sound not available', { type });
    }
  }

  private getSystemSoundUri(type: SoundType): string {
    // These are placeholder URIs - in production, use actual sound file URIs
    // For now, return empty to avoid errors
    switch (type) {
      case 'success':
      case 'streak':
        return ''; // Would be a success chime
      case 'milestone':
        return ''; // Would be a celebration sound
      case 'error':
        return ''; // Would be an error tone
      default:
        return '';
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logger.debug('SOUND', 'Sound effects enabled state changed', { enabled });
  }

  cleanup(): void {
    try {
      // Unload all sounds synchronously if possible
      this.sounds.forEach((sound, type) => {
        sound.unloadAsync().catch(error => {
          logger.error('SOUND', 'Failed to unload sound', { type, error });
        });
      });
      this.sounds.clear();
      this.isInitialized = false;
      
      logger.debug('SOUND', 'Sound service cleanup completed');
    } catch (error) {
      logger.error('SOUND', 'Failed to cleanup sounds', { error });
    }
  }
  
  /**
   * Preload specific sounds (optional - for critical sounds)
   * Currently not implemented as we're using placeholder sounds
   */
  async preload(types: SoundType[]): Promise<void> {
    // In production, this would load specific sound files
    // For now, just log the intent
    logger.debug('SOUND', 'Would preload sounds', { types });
  }
}

export default SoundEffectsService;