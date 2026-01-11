import NotificationService from './NotificationService';
import { ToastNotificationService, Toast, ToastVariant, ToastEffects } from './ToastNotificationService';
import { ToastQueue, ToastPriority } from './ToastQueue';
import logger from '../utils/logger';

export type NotificationType = 'push' | 'toast' | 'both';

export interface UnifiedNotification {
  type: NotificationType;
  title?: string;
  message: string;
  priority?: ToastPriority;
  variant?: ToastVariant;
  icon?: string;
  effects?: ToastEffects;
  scheduledTime?: Date;
  data?: any;
}

/**
 * Notification Orchestrator
 * 
 * Unified service to coordinate all notification types.
 * Provides a single interface for both push and toast notifications
 * with queue management, deduplication, and priority handling.
 */
export class NotificationOrchestrator {
  private pushService: typeof NotificationService;
  private toastService: ToastNotificationService;
  private toastQueue: ToastQueue;
  private isProcessingQueue: boolean = false;
  private processQueueTimeout: NodeJS.Timeout | null = null;

  constructor(
    pushService: typeof NotificationService,
    toastService: ToastNotificationService
  ) {
    this.pushService = pushService;
    this.toastService = toastService;
    this.toastQueue = new ToastQueue();
    
    logger.debug('ORCHESTRATOR', 'NotificationOrchestrator initialized');
  }

  /**
   * Send a unified notification
   */
  async notify(notification: UnifiedNotification): Promise<void> {
    try {
      switch (notification.type) {
        case 'push':
          await this.sendPushNotification(notification);
          break;
          
        case 'toast':
          await this.sendToastNotification(notification);
          break;
          
        case 'both':
          await Promise.all([
            this.sendPushNotification(notification),
            this.sendToastNotification(notification)
          ]);
          break;
          
        default:
          logger.warn('ORCHESTRATOR', 'Unknown notification type', { 
            type: notification.type 
          });
      }
    } catch (error) {
      logger.error('ORCHESTRATOR', 'Failed to send notification', { 
        error,
        type: notification.type 
      });
      throw error;
    }
  }

  /**
   * Send a push notification
   */
  private async sendPushNotification(notification: UnifiedNotification): Promise<void> {
    try {
      // Note: NotificationService only handles scheduled reminders
      // For immediate notifications, we'd need to use expo-notifications directly
      // or extend the NotificationService
      
      if (notification.scheduledTime) {
        // The current NotificationService only supports task reminders
        // This is a limitation we should note
        logger.warn('ORCHESTRATOR', 'Push notifications require task context in current implementation');
      } else {
        // Immediate push notifications not supported by current NotificationService
        logger.warn('ORCHESTRATOR', 'Immediate push notifications not implemented');
      }
      
      logger.debug('ORCHESTRATOR', 'Push notification request processed', { 
        title: notification.title,
        scheduled: !!notification.scheduledTime 
      });
    } catch (error) {
      logger.error('ORCHESTRATOR', 'Failed to send push notification', { error });
      // Don't throw - allow other notifications to proceed
    }
  }

  /**
   * Send a toast notification with queue management
   */
  private async sendToastNotification(notification: UnifiedNotification): Promise<void> {
    // Create toast object
    const toast: Omit<Toast, 'id'> = {
      message: notification.message,
      variant: notification.variant || 'info',
      icon: notification.icon,
      effects: notification.effects
    };
    
    // Add to queue with priority
    const queuedToast = this.toastQueue.enqueue(toast, notification.priority || 'medium');
    
    if (!queuedToast) {
      logger.debug('ORCHESTRATOR', 'Toast rejected by queue (dedupe or rate limit)');
      return;
    }
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      await this.processToastQueue();
    }
  }

  /**
   * Process queued toasts
   */
  private async processToastQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      // Process up to 3 toasts at once
      const maxConcurrent = 3;
      const toasts = this.toastQueue.dequeueMultiple(maxConcurrent);
      
      if (toasts.length === 0) {
        return;
      }
      
      // Create actual toasts
      for (const queuedToast of toasts) {
        const toast = this.toastService.createToast(queuedToast.data);
        
        // Trigger effects if any
        if (queuedToast.data.effects) {
          this.toastService.triggerEffects(queuedToast.data.effects);
        }
        
        logger.debug('ORCHESTRATOR', 'Toast processed from queue', { 
          id: toast.id,
          priority: queuedToast.priority 
        });
      }
      
      // Check if there are more toasts to process
      if (this.toastQueue.size() > 0) {
        // Process more after a delay
        this.processQueueTimeout = setTimeout(() => {
          this.processQueueTimeout = null;
          this.processToastQueue();
        }, 500);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Quick methods for common notifications
   */
  async success(message: string, options?: Partial<UnifiedNotification>): Promise<void> {
    await this.notify({
      type: 'toast',
      message,
      variant: 'success',
      icon: '✅',
      priority: 'medium',
      effects: { sound: 'success' },
      ...options
    });
  }

  async error(message: string, options?: Partial<UnifiedNotification>): Promise<void> {
    await this.notify({
      type: 'toast',
      message,
      variant: 'error',
      icon: '❌',
      priority: 'high',
      effects: { sound: 'error' },
      ...options
    });
  }

  async warning(message: string, options?: Partial<UnifiedNotification>): Promise<void> {
    await this.notify({
      type: 'toast',
      message,
      variant: 'warning',
      icon: '⚠️',
      priority: 'medium',
      ...options
    });
  }

  async info(message: string, options?: Partial<UnifiedNotification>): Promise<void> {
    await this.notify({
      type: 'toast',
      message,
      variant: 'info',
      icon: 'ℹ️',
      priority: 'low',
      ...options
    });
  }

  async celebration(message: string, options?: Partial<UnifiedNotification>): Promise<void> {
    await this.notify({
      type: 'toast',
      message,
      variant: 'celebration',
      icon: '🎉',
      priority: 'high',
      effects: {
        sound: 'milestone',
        confetti: 'burst',
        haptic: true
      },
      ...options
    });
  }

  /**
   * Schedule a notification for the future
   */
  async schedule(
    notification: UnifiedNotification,
    scheduledTime: Date
  ): Promise<string | null> {
    notification.scheduledTime = scheduledTime;
    
    if (notification.type === 'toast') {
      logger.warn('ORCHESTRATOR', 'Cannot schedule toast notifications');
      return null;
    }
    
    await this.notify(notification);
    return `scheduled-${Date.now()}`;
  }

  /**
   * Cancel a scheduled notification
   */
  async cancel(notificationId: string): Promise<void> {
    try {
      // NotificationService only supports canceling task reminders by taskId
      // This is a limitation of the current implementation
      logger.warn('ORCHESTRATOR', 'Cancel requires task context in current implementation', {
        id: notificationId
      });
    } catch (error) {
      logger.error('ORCHESTRATOR', 'Failed to cancel notification', { 
        error,
        id: notificationId 
      });
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAll(): Promise<void> {
    try {
      await this.pushService.cancelAllNotifications();
      logger.debug('ORCHESTRATOR', 'Cancelled all scheduled notifications');
    } catch (error) {
      logger.error('ORCHESTRATOR', 'Failed to cancel all notifications', { error });
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return this.toastQueue.getStats();
  }

  /**
   * Clear the toast queue
   */
  clearToastQueue(): void {
    this.toastQueue.clear();
    logger.debug('ORCHESTRATOR', 'Toast queue cleared');
  }

  /**
   * Check notification permissions
   */
  async hasPermission(): Promise<boolean> {
    const permissions = await this.pushService.requestPermissions();
    return permissions.status === 'granted';
  }

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    const permissions = await this.pushService.requestPermissions();
    return permissions.status === 'granted';
  }

  /**
   * Destroy the orchestrator and cleanup resources
   */
  destroy(): void {
    // Clear any pending timeout
    if (this.processQueueTimeout) {
      clearTimeout(this.processQueueTimeout);
      this.processQueueTimeout = null;
    }
    
    // Destroy the queue
    this.toastQueue.destroy();
    
    // Reset processing flag
    this.isProcessingQueue = false;
    
    logger.debug('ORCHESTRATOR', 'NotificationOrchestrator destroyed and resources cleaned up');
  }
}

// Singleton instance management
let instance: NotificationOrchestrator | null = null;

export function createNotificationOrchestrator(
  pushService: typeof NotificationService,
  toastService: ToastNotificationService
): NotificationOrchestrator {
  if (!instance) {
    instance = new NotificationOrchestrator(pushService, toastService);
  }
  return instance;
}

export function getNotificationOrchestrator(): NotificationOrchestrator {
  if (!instance) {
    throw new Error('NotificationOrchestrator not initialized. Call createNotificationOrchestrator first.');
  }
  return instance;
}

export default NotificationOrchestrator;