import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ToastNotificationService, Toast, ToastConfig } from '../services/ToastNotificationService';
import { ToastQueue, ToastPriority } from '../services/ToastQueue';
import { getToastService } from '../services/ServiceRegistry';
import logger from '../utils/logger';

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
  toasts: Toast[];
  config: ToastConfig;
  updateConfig: (config: Partial<ToastConfig>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [config, setConfig] = useState<ToastConfig>({
    duration: 3000,
    position: 'bottom',
    offset: 100,
    maxVisible: 3,
    animationDuration: 300,
    swipeToDismiss: true,
    sounds: true,
    haptics: true,
  });
  
  // Timer management for auto-dismiss with proper cleanup tracking
  const timerRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const animatingToasts = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  // Queue management for preventing toast collisions
  const toastQueue = useRef<ToastQueue>(new ToastQueue());
  const queueProcessorRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingQueue = useRef(false);

  // Delay between showing queued toasts (ms)
  const QUEUE_PROCESS_DELAY = 400;

  // Get toast service from registry, fallback to new instance if not available
  const toastService = useRef<ToastNotificationService | null>(null);
  if (!toastService.current) {
    try {
      toastService.current = getToastService();
    } catch (error) {
      logger.warn('TOAST_CONTEXT', 'Toast service not found in registry, creating new instance');
      toastService.current = new ToastNotificationService();
    }
  }
  
  // Cleanup all timers on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // Clear all pending timers
      const timers = Array.from(timerRefs.current.entries());
      timers.forEach(([id, timer]) => {
        clearTimeout(timer);
        logger.debug('TOAST_CONTEXT', 'Cleared timer on unmount', { id });
      });
      timerRefs.current.clear();

      // Clear animating toasts tracking
      animatingToasts.current.clear();

      // Clear queue processor
      if (queueProcessorRef.current) {
        clearTimeout(queueProcessorRef.current);
        queueProcessorRef.current = null;
      }

      // Destroy toast queue
      if (toastQueue.current) {
        toastQueue.current.destroy();
      }

      // Cleanup service resources
      if (toastService.current) {
        // Use destroy if available, fallback to cleanup
        if (typeof (toastService.current as any).destroy === 'function') {
          (toastService.current as any).destroy();
        } else if (typeof toastService.current.cleanup === 'function') {
          toastService.current.cleanup();
        }
      }

      logger.debug('TOAST_CONTEXT', 'Cleaned up all resources');
    };
  }, []);

  const hideToast = useCallback((id: string) => {
    // Clear any pending timer for this toast
    const timerId = timerRefs.current.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timerRefs.current.delete(id);
      logger.debug('TOAST_CONTEXT', 'Cleared timer for toast', { id });
    }
    
    // Remove from animating set
    animatingToasts.current.delete(id);
    
    // Only update state if component is still mounted
    if (isMountedRef.current) {
      setToasts(prev => prev.filter(t => t.id !== id));
    }
  }, []);

  // Internal function that actually displays a toast (moved from showToast)
  const displayToast = useCallback((toast: Omit<Toast, 'id'>) => {
    if (!toastService.current) {
      logger.error('TOAST_CONTEXT', 'Toast service not available');
      return;
    }

    const newToast = toastService.current.createToast(toast);

    // Handle effects immediately
    if (toast.effects && config.sounds && toastService.current) {
      toastService.current.triggerEffects(toast.effects);
    }

    setToasts(prev => {
      // Limit to maxVisible toasts
      const updated = [...prev, newToast];
      if (updated.length > config.maxVisible) {
        // Clear timers for removed toasts
        const removed = updated.slice(0, updated.length - config.maxVisible);
        removed.forEach(t => {
          const timerId = timerRefs.current.get(t.id);
          if (timerId) {
            clearTimeout(timerId);
            timerRefs.current.delete(t.id);
          }
        });
        return updated.slice(-config.maxVisible);
      }
      return updated;
    });

    // Track as animating
    animatingToasts.current.add(newToast.id);

    // Auto-dismiss after duration
    if (toast.duration !== 0) {
      const duration = toast.duration || config.duration;
      const timerId = setTimeout(() => {
        // Double-check component is still mounted and toast is still animating
        if (isMountedRef.current && animatingToasts.current.has(newToast.id)) {
          hideToast(newToast.id);
        } else {
          // Just cleanup if component unmounted
          timerRefs.current.delete(newToast.id);
          animatingToasts.current.delete(newToast.id);
        }
      }, duration);

      timerRefs.current.set(newToast.id, timerId);
      logger.debug('TOAST_CONTEXT', 'Set auto-dismiss timer', {
        id: newToast.id,
        duration
      });
    }

    return newToast;
  }, [config.maxVisible, config.duration, config.sounds, hideToast]);

  // Process the toast queue one at a time with delay between toasts
  const processQueue = useCallback(() => {
    if (!isMountedRef.current || isProcessingQueue.current) {
      return;
    }

    const queuedToast = toastQueue.current.dequeue();
    if (!queuedToast) {
      // Queue is empty, stop processing
      isProcessingQueue.current = false;
      return;
    }

    isProcessingQueue.current = true;

    // Display the toast
    displayToast(queuedToast.data);
    logger.debug('TOAST_CONTEXT', 'Processed queued toast', {
      id: queuedToast.id,
      remainingInQueue: toastQueue.current.size()
    });

    // Schedule next queue processing with delay to prevent collisions
    if (toastQueue.current.size() > 0) {
      queueProcessorRef.current = setTimeout(() => {
        isProcessingQueue.current = false;
        processQueue();
      }, QUEUE_PROCESS_DELAY);
    } else {
      isProcessingQueue.current = false;
    }
  }, [displayToast]);

  // Public showToast function - enqueues toast and starts processing
  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    if (!toastService.current) {
      logger.error('TOAST_CONTEXT', 'Toast service not available');
      return;
    }

    // Determine priority based on toast variant
    let priority: ToastPriority = 'medium';
    if (toast.variant === 'error') {
      priority = 'high';
    } else if (toast.variant === 'celebration') {
      priority = 'high';
    } else if (toast.variant === 'warning') {
      priority = 'medium';
    }

    // Enqueue the toast
    const queuedToast = toastQueue.current.enqueue(
      { ...toast, message: toast.message },
      priority
    );

    if (queuedToast) {
      logger.debug('TOAST_CONTEXT', 'Toast enqueued', {
        message: toast.message,
        priority,
        queueSize: toastQueue.current.size()
      });

      // Start processing queue if not already processing
      if (!isProcessingQueue.current) {
        processQueue();
      }
    }
  }, [processQueue]);

  const hideAllToasts = useCallback(() => {
    // Clear all timers
    timerRefs.current.forEach(timer => clearTimeout(timer));
    timerRefs.current.clear();

    // Clear queue processor
    if (queueProcessorRef.current) {
      clearTimeout(queueProcessorRef.current);
      queueProcessorRef.current = null;
    }
    isProcessingQueue.current = false;

    // Clear the toast queue
    toastQueue.current.clear();

    setToasts([]);
    logger.debug('TOAST_CONTEXT', 'Cleared all toasts, timers, and queue');
  }, []);

  const updateConfig = useCallback((newConfig: Partial<ToastConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    logger.debug('TOAST_CONTEXT', 'Config updated', { newConfig });
  }, []);

  // Memoize visible toasts for performance (only render what's visible)
  const visibleToasts = useMemo(() => {
    return toasts.slice(0, config.maxVisible);
  }, [toasts, config.maxVisible]);
  
  // Memoize context value to prevent unnecessary re-renders
  const value: ToastContextValue = useMemo(() => ({
    showToast,
    hideToast,
    hideAllToasts,
    toasts: visibleToasts, // Use visible toasts for better performance
    config,
    updateConfig,
  }), [showToast, hideToast, hideAllToasts, visibleToasts, config, updateConfig]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;