import logger from '../utils/logger';

export type ToastPriority = 'low' | 'medium' | 'high' | 'critical';

export interface QueuedToast {
  id: string;
  message: string;
  priority: ToastPriority;
  timestamp: number;
  hash: string; // For deduplication
  data: any; // Original toast data
}

/**
 * Toast Queue Management System
 * 
 * Provides:
 * - Priority-based queueing
 * - Deduplication of similar messages
 * - Rate limiting to prevent spam
 * - Queue overflow protection
 */
export class ToastQueue {
  private queue: QueuedToast[] = [];
  private readonly maxQueueSize = 50;
  private readonly dedupeWindow = 2000; // 2 seconds
  private recentHashes: Map<string, number> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Rate limiting
  private rateLimitTimestamps: number[] = [];
  private readonly rateLimitWindow = 10000; // 10 seconds
  private readonly rateLimitMax = 5;

  constructor() {
    // Cleanup old hashes periodically
    this.cleanupInterval = setInterval(() => this.cleanupOldHashes(), 5000);
  }

  /**
   * Add a toast to the queue with priority
   */
  enqueue(toast: any, priority: ToastPriority = 'medium'): QueuedToast | null {
    const now = Date.now();
    const hash = this.generateHash(toast.message);
    
    // Check deduplication
    if (!this.shouldShowToast(hash, now)) {
      logger.debug('TOAST_QUEUE', 'Toast deduplicated', { 
        message: toast.message,
        hash 
      });
      return null;
    }
    
    // Check rate limiting
    if (!this.checkRateLimit(now)) {
      logger.warn('TOAST_QUEUE', 'Rate limit exceeded', { 
        current: this.rateLimitTimestamps.length,
        max: this.rateLimitMax 
      });
      return null;
    }
    
    // Create queued toast
    const queuedToast: QueuedToast = {
      id: toast.id || `queued-${now}-${Math.random()}`,
      message: toast.message,
      priority,
      timestamp: now,
      hash,
      data: toast
    };
    
    // Insert based on priority
    const insertIndex = this.findInsertIndex(priority);
    this.queue.splice(insertIndex, 0, queuedToast);
    
    // Trim queue if it's too large
    if (this.queue.length > this.maxQueueSize) {
      const removed = this.queue.splice(this.maxQueueSize);
      logger.warn('TOAST_QUEUE', 'Queue overflow, removed toasts', { 
        removed: removed.length 
      });
    }
    
    // Record for deduplication
    this.recentHashes.set(hash, now);
    
    // Record for rate limiting
    this.rateLimitTimestamps.push(now);
    
    logger.debug('TOAST_QUEUE', 'Toast enqueued', { 
      id: queuedToast.id,
      priority,
      queueSize: this.queue.length 
    });
    
    return queuedToast;
  }

  /**
   * Get the next toast from the queue
   */
  dequeue(): QueuedToast | null {
    const toast = this.queue.shift();
    if (toast) {
      logger.debug('TOAST_QUEUE', 'Toast dequeued', { 
        id: toast.id,
        priority: toast.priority,
        remainingInQueue: this.queue.length 
      });
    }
    return toast || null;
  }

  /**
   * Peek at the next toast without removing it
   */
  peek(): QueuedToast | null {
    return this.queue[0] || null;
  }

  /**
   * Get multiple toasts up to a limit
   */
  dequeueMultiple(limit: number): QueuedToast[] {
    const toasts = this.queue.splice(0, Math.min(limit, this.queue.length));
    if (toasts.length > 0) {
      logger.debug('TOAST_QUEUE', 'Multiple toasts dequeued', { 
        count: toasts.length,
        remainingInQueue: this.queue.length 
      });
    }
    return toasts;
  }

  /**
   * Get current queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    const previousSize = this.queue.length;
    this.queue = [];
    this.recentHashes.clear();
    this.rateLimitTimestamps = [];
    
    logger.debug('TOAST_QUEUE', 'Queue cleared', { 
      previousSize 
    });
  }

  /**
   * Destroy the queue and cleanup resources
   */
  destroy(): void {
    // Clear the interval timer
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Clear all data
    this.clear();
    
    logger.debug('TOAST_QUEUE', 'Queue destroyed and resources cleaned up');
  }

  /**
   * Check if a toast should be shown (deduplication)
   */
  private shouldShowToast(hash: string, now: number): boolean {
    const lastShown = this.recentHashes.get(hash);
    
    if (lastShown && now - lastShown < this.dedupeWindow) {
      return false;
    }
    
    return true;
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(now: number): boolean {
    // Clean old timestamps
    this.rateLimitTimestamps = this.rateLimitTimestamps.filter(
      timestamp => now - timestamp < this.rateLimitWindow
    );
    
    // Check if we're under the limit
    return this.rateLimitTimestamps.length < this.rateLimitMax;
  }

  /**
   * Find insert index based on priority
   */
  private findInsertIndex(priority: ToastPriority): number {
    const priorityValues = {
      'low': 0,
      'medium': 1,
      'high': 2,
      'critical': 3
    };
    
    const targetValue = priorityValues[priority];
    
    // Find first toast with lower priority
    for (let i = 0; i < this.queue.length; i++) {
      const currentValue = priorityValues[this.queue[i].priority];
      if (currentValue < targetValue) {
        return i;
      }
    }
    
    // Add to end if no lower priority found
    return this.queue.length;
  }

  /**
   * Generate hash for deduplication
   */
  private generateHash(message: string): string {
    // Simple hash for demonstration - in production use a proper hash
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Cleanup old hashes to prevent memory leak
   */
  private cleanupOldHashes(): void {
    const now = Date.now();
    const expired: string[] = [];
    
    this.recentHashes.forEach((timestamp, hash) => {
      if (now - timestamp > this.dedupeWindow * 2) {
        expired.push(hash);
      }
    });
    
    expired.forEach(hash => this.recentHashes.delete(hash));
    
    if (expired.length > 0) {
      logger.debug('TOAST_QUEUE', 'Cleaned up old hashes', { 
        count: expired.length 
      });
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueSize: number;
    rateLimitRemaining: number;
    recentHashesCount: number;
    priorityCounts: Record<ToastPriority, number>;
  } {
    const now = Date.now();
    this.rateLimitTimestamps = this.rateLimitTimestamps.filter(
      timestamp => now - timestamp < this.rateLimitWindow
    );
    
    const priorityCounts: Record<ToastPriority, number> = {
      'low': 0,
      'medium': 0,
      'high': 0,
      'critical': 0
    };
    
    this.queue.forEach(toast => {
      priorityCounts[toast.priority]++;
    });
    
    return {
      queueSize: this.queue.length,
      rateLimitRemaining: Math.max(0, this.rateLimitMax - this.rateLimitTimestamps.length),
      recentHashesCount: this.recentHashes.size,
      priorityCounts
    };
  }
}

export default ToastQueue;