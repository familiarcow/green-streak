import { SoundEffectsService, SoundType } from './SoundEffectsService';
import { ConfettiService } from './ConfettiService';
import logger from '../utils/logger';

export type ToastVariant = 'success' | 'warning' | 'info' | 'celebration' | 'error';
export type ToastPosition = 'top' | 'bottom';
export type SoundEffect = SoundType | 'none';

export interface ToastEffects {
  confetti?: boolean | 'burst' | 'fireworks' | 'rain';
  sound?: SoundEffect;
  haptic?: boolean;
}

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number; // 0 means persistent until dismissed
  icon?: string; // Emoji or icon name
  effects?: ToastEffects;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
}

export interface ToastConfig {
  duration: number;
  position: ToastPosition;
  offset: number;
  maxVisible: number;
  animationDuration: number;
  swipeToDismiss: boolean;
  sounds: boolean;
  haptics: boolean;
}

export class ToastNotificationService {
  private soundService: SoundEffectsService | null;
  private confettiService: ConfettiService | null;
  private toastIdCounter = 0;

  constructor(
    soundService?: SoundEffectsService,
    confettiService?: ConfettiService
  ) {
    // Accept services via dependency injection to avoid circular dependencies
    // If not provided, services will be null and effects won't play
    this.soundService = soundService || null;
    this.confettiService = confettiService || null;
    
    logger.debug('TOAST', 'ToastNotificationService initialized', {
      hasSoundService: !!this.soundService,
      hasConfettiService: !!this.confettiService
    });
  }

  createToast(toast: Omit<Toast, 'id'>): Toast {
    const id = this.generateToastId();
    const fullToast: Toast = {
      id,
      ...toast,
    };

    logger.debug('TOAST', 'Toast created', { 
      id, 
      message: fullToast.message, 
      variant: fullToast.variant 
    });

    return fullToast;
  }

  triggerEffects(effects: ToastEffects): void {
    if (effects) {
      this.handleEffects(effects);
    }
  }

  cleanup(): void {
    // Cleanup sound and confetti services if they exist
    if (this.soundService) {
      this.soundService.cleanup();
    }
    logger.debug('TOAST', 'Service cleaned up');
  }

  private handleEffects(effects: ToastEffects): void {
    // Play sound if service is available
    if (effects.sound && effects.sound !== 'none' && this.soundService) {
      this.soundService.play(effects.sound).catch(error => {
        logger.error('TOAST', 'Failed to play sound', { error, sound: effects.sound });
      });
    }

    // Trigger confetti if service is available
    if (effects.confetti && this.confettiService) {
      const confettiType = typeof effects.confetti === 'string' ? effects.confetti : 'burst';
      this.confettiService.trigger(confettiType);
    }

    // Trigger haptic feedback through sound service (which handles both)
    if (effects.haptic && this.soundService) {
      // The sound service's play() method handles haptics alongside sounds
      // But if no specific sound effect is requested, just play a light impact
      if (!effects.sound || effects.sound === 'none') {
        this.soundService.playImpact('light').catch(error => {
          logger.debug('TOAST', 'Haptic feedback failed', { error });
        });
      }
      // If sound is also requested, haptics are already triggered in play()
    }
  }

  private generateToastId(): string {
    return `toast-${Date.now()}-${this.toastIdCounter++}`;
  }

  // Utility methods for common toasts
  success(message: string, effects?: ToastEffects): Toast {
    return this.createToast({
      message,
      variant: 'success',
      icon: '✅',
      effects: {
        sound: 'celebration',
        ...effects,
      },
    });
  }

  error(message: string): Toast {
    return this.createToast({
      message,
      variant: 'error',
      icon: '❌',
      effects: {
        sound: 'caution',
      },
    });
  }

  celebration(message: string, effects?: ToastEffects): Toast {
    return this.createToast({
      message,
      variant: 'celebration',
      icon: '🎉',
      effects: {
        sound: 'celebration',
        confetti: 'burst',
        ...effects,
      },
    });
  }
}

export default ToastNotificationService;