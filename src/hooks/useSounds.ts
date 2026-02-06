import { useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { getSoundService } from '../services';
import { SoundType } from '../services/SoundEffectsService';
import logger from '../utils/logger';

/**
 * Hook for playing sound effects throughout the app.
 *
 * This is a thin wrapper around SoundEffectsService for React components.
 * The service is the single source of truth for enabled state - this hook
 * does NOT duplicate that check. The settingsStore syncs the enabled state
 * to the service when it changes.
 */
export const useSounds = () => {
  // Subscribe to setting changes for re-render (UI updates)
  const soundEffectsEnabled = useSettingsStore(state => state.soundEffectsEnabled);

  /**
   * Play a sound effect by type.
   * The service handles enabled state - callers don't need to check.
   */
  const play = useCallback(async (type: SoundType): Promise<void> => {
    try {
      const soundService = getSoundService();
      await soundService.play(type);
    } catch (error) {
      logger.debug('SOUND', 'Failed to play sound', { error, type });
    }
  }, []);

  /**
   * Play toggle sound based on the new state.
   * Convenience wrapper for toggle_on/toggle_off sounds.
   */
  const playToggle = useCallback(async (enabled: boolean): Promise<void> => {
    try {
      const soundService = getSoundService();
      await soundService.play(enabled ? 'toggle_on' : 'toggle_off');
    } catch (error) {
      logger.debug('SOUND', 'Failed to play toggle sound', { error });
    }
  }, []);

  /**
   * Play button press sound.
   * Convenience wrapper for the button sound.
   */
  const playButton = useCallback(async (): Promise<void> => {
    try {
      const soundService = getSoundService();
      await soundService.play('button');
    } catch (error) {
      logger.debug('SOUND', 'Failed to play button sound', { error });
    }
  }, []);

  /**
   * Play celebration sound.
   * Convenience wrapper for the celebration sound.
   */
  const playCelebration = useCallback(async (): Promise<void> => {
    try {
      const soundService = getSoundService();
      await soundService.play('celebration');
    } catch (error) {
      logger.debug('SOUND', 'Failed to play celebration sound', { error });
    }
  }, []);

  /**
   * Play achievement sound.
   * Convenience wrapper for the achievement sound.
   */
  const playAchievement = useCallback(async (): Promise<void> => {
    try {
      const soundService = getSoundService();
      await soundService.play('achievement');
    } catch (error) {
      logger.debug('SOUND', 'Failed to play achievement sound', { error });
    }
  }, []);

  /**
   * Play caution/error sound.
   * Convenience wrapper for the caution sound.
   */
  const playCaution = useCallback(async (): Promise<void> => {
    try {
      const soundService = getSoundService();
      await soundService.play('caution');
    } catch (error) {
      logger.debug('SOUND', 'Failed to play caution sound', { error });
    }
  }, []);

  /**
   * Play expand/collapse sound based on the new state.
   * Convenience wrapper for open/close sounds.
   */
  const playExpand = useCallback(async (expanded: boolean): Promise<void> => {
    try {
      const soundService = getSoundService();
      await soundService.play(expanded ? 'open' : 'close');
    } catch (error) {
      logger.debug('SOUND', 'Failed to play expand sound', { error });
    }
  }, []);

  /**
   * Play a random tap sound (all 5 variants).
   * Used for date selection and similar interactions.
   */
  const playRandomTap = useCallback(async (): Promise<void> => {
    try {
      const soundService = getSoundService();
      const tapSounds: SoundType[] = ['tap_01', 'tap_02', 'tap_03', 'tap_04', 'tap_05'];
      const randomTap = tapSounds[Math.floor(Math.random() * tapSounds.length)];
      await soundService.play(randomTap);
    } catch (error) {
      logger.debug('SOUND', 'Failed to play tap sound', { error });
    }
  }, []);

  /**
   * Play a random type sound (tap_01 to tap_05).
   * Used for time period selection and similar UI changes.
   */
  const playRandomType = useCallback(async (): Promise<void> => {
    try {
      const soundService = getSoundService();
      const typeSounds: SoundType[] = ['tap_01', 'tap_02', 'tap_03', 'tap_04', 'tap_05'];
      const randomType = typeSounds[Math.floor(Math.random() * typeSounds.length)];
      await soundService.play(randomType);
    } catch (error) {
      logger.debug('SOUND', 'Failed to play type sound', { error });
    }
  }, []);

  return {
    play,
    playToggle,
    playButton,
    playCelebration,
    playAchievement,
    playCaution,
    playExpand,
    playRandomTap,
    playRandomType,
    /** Current enabled state (for UI display) */
    isSoundEnabled: soundEffectsEnabled ?? true,
  };
};

export default useSounds;
