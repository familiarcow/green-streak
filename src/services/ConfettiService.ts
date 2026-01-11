import logger from '../utils/logger';

export type ConfettiType = 'burst' | 'fireworks' | 'rain';

interface ConfettiConfig {
  type: ConfettiType;
  duration: number;
  particleCount: number;
  colors: string[];
}

export class ConfettiService {
  private activeEffects: Set<string> = new Set();
  private listeners: Map<string, (config: ConfettiConfig) => void> = new Map();
  private effectIdCounter = 0;

  constructor() {
    logger.debug('CONFETTI', 'ConfettiService initialized');
  }

  trigger(type: ConfettiType = 'burst'): string {
    const effectId = this.generateEffectId();
    const config = this.getConfettiConfig(type);
    
    logger.debug('CONFETTI', 'Triggering confetti effect', { 
      effectId, 
      type,
      config 
    });

    this.activeEffects.add(effectId);
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      listener(config);
    });

    // Auto cleanup after duration
    setTimeout(() => {
      this.cleanup(effectId);
    }, config.duration);

    return effectId;
  }

  subscribe(id: string, listener: (config: ConfettiConfig) => void): void {
    this.listeners.set(id, listener);
    logger.debug('CONFETTI', 'Subscriber added', { id });
  }

  unsubscribe(id: string): void {
    this.listeners.delete(id);
    logger.debug('CONFETTI', 'Subscriber removed', { id });
  }

  private getConfettiConfig(type: ConfettiType): ConfettiConfig {
    switch (type) {
      case 'burst':
        return {
          type: 'burst',
          duration: 1500,
          particleCount: 30,
          colors: [
            '#22c55e', // green
            '#3b82f6', // blue
            '#f59e0b', // amber
            '#ef4444', // red
            '#8b5cf6', // violet
          ],
        };
      
      case 'fireworks':
        return {
          type: 'fireworks',
          duration: 2500,
          particleCount: 50,
          colors: [
            '#FFD700', // gold
            '#FF6B6B', // coral
            '#00D4AA', // teal
            '#7C3AED', // purple
            '#FF9500', // orange
          ],
        };
      
      case 'rain':
        return {
          type: 'rain',
          duration: 3000,
          particleCount: 100,
          colors: [
            '#22c55e', // green (primary)
            '#10b981', // emerald
            '#14b8a6', // teal
            '#06b6d4', // cyan
          ],
        };
      
      default:
        return this.getConfettiConfig('burst');
    }
  }

  private cleanup(effectId: string): void {
    this.activeEffects.delete(effectId);
    logger.debug('CONFETTI', 'Effect cleaned up', { effectId });
  }

  private generateEffectId(): string {
    return `confetti-${Date.now()}-${this.effectIdCounter++}`;
  }

  getActiveEffects(): string[] {
    return Array.from(this.activeEffects);
  }

  clearAll(): void {
    this.activeEffects.clear();
    logger.debug('CONFETTI', 'All effects cleared');
  }
}

export default ConfettiService;