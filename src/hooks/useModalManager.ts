import { useCallback, useRef, useState } from 'react';
import { Animated, BackHandler } from 'react-native';
import { Task } from '../types';
import logger from '../utils/logger';

/**
 * Modal types supported by the modal manager
 */
export type ModalType =
  | 'addTask'
  | 'editTask'
  | 'dailyLog'
  | 'settings'
  | 'taskAnalytics'
  | 'confirmation'
  | 'templateCatalog'
  | null;

/**
 * Modal animation types
 */
export type AnimationType = 'slide' | 'fade' | 'scale';

/**
 * Modal configuration for each modal type
 */
export interface ModalConfig {
  type: ModalType;
  animationType: AnimationType;
  props?: {
    task?: Task;
    date?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    [key: string]: any;
  };
}

/**
 * Animation values for different modal types
 */
interface ModalAnimations {
  backgroundOpacity: Animated.Value;
  slideAnim: Animated.Value;
  scaleAnim: Animated.Value;
  fadeAnim: Animated.Value;
}

/**
 * Modal manager state
 */
interface ModalState {
  activeModal: ModalType;
  modalConfig: ModalConfig | null;
  isAnimating: boolean;
  modalQueue: ModalConfig[];
}

/**
 * Modal manager return type
 */
export interface ModalManagerReturn {
  // State
  activeModal: ModalType;
  modalConfig: ModalConfig | null;
  isAnimating: boolean;
  animations: ModalAnimations;
  
  // Actions
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
  closeAllModals: () => void;
  
  // Specific modal helpers
  openAddTask: () => void;
  openEditTask: (task: Task) => void;
  openDailyLog: (date?: string) => void;
  openSettings: () => void;
  openTaskAnalytics: (task: Task) => void;
  openConfirmation: (onConfirm: () => void, onCancel?: () => void) => void;
  
  // Animation helpers
  getAnimationStyle: (animationType: AnimationType) => any;
}

/**
 * Animation configuration for different modal types
 */
const ANIMATION_CONFIG = {
  slide: {
    duration: 300,
    useNativeDriver: true,
  },
  fade: {
    duration: 200,
    useNativeDriver: true,
  },
  scale: {
    duration: 250,
    useNativeDriver: true,
  },
};

/**
 * Unified modal manager hook
 * Centralizes all modal state and animation management
 */
export const useModalManager = (): ModalManagerReturn => {
  // State
  const [state, setState] = useState<ModalState>({
    activeModal: null,
    modalConfig: null,
    isAnimating: false,
    modalQueue: [],
  });

  // Animation values
  const animations = useRef<ModalAnimations>({
    backgroundOpacity: new Animated.Value(0),
    slideAnim: new Animated.Value(0),
    scaleAnim: new Animated.Value(0.3),
    fadeAnim: new Animated.Value(0),
  }).current;

  // Animation helpers
  const animateIn = useCallback((animationType: AnimationType) => {
    setState(prev => ({ ...prev, isAnimating: true }));
    
    const config = ANIMATION_CONFIG[animationType];
    const animationsToRun: Animated.CompositeAnimation[] = [
      Animated.timing(animations.backgroundOpacity, {
        toValue: 1,
        ...config,
      }),
    ];

    switch (animationType) {
      case 'slide':
        animationsToRun.push(
          Animated.timing(animations.slideAnim, {
            toValue: 1,
            ...config,
          })
        );
        break;
      case 'fade':
        animationsToRun.push(
          Animated.timing(animations.fadeAnim, {
            toValue: 1,
            ...config,
          })
        );
        break;
      case 'scale':
        animationsToRun.push(
          Animated.timing(animations.scaleAnim, {
            toValue: 1,
            ...config,
          })
        );
        break;
    }

    Animated.parallel(animationsToRun).start(() => {
      setState(prev => ({ ...prev, isAnimating: false }));
    });
  }, [animations]);

  const animateOut = useCallback((animationType: AnimationType, onComplete: () => void) => {
    setState(prev => ({ ...prev, isAnimating: true }));
    
    const config = ANIMATION_CONFIG[animationType];
    const animationsToRun: Animated.CompositeAnimation[] = [
      Animated.timing(animations.backgroundOpacity, {
        toValue: 0,
        ...config,
      }),
    ];

    switch (animationType) {
      case 'slide':
        animationsToRun.push(
          Animated.timing(animations.slideAnim, {
            toValue: 0,
            ...config,
          })
        );
        break;
      case 'fade':
        animationsToRun.push(
          Animated.timing(animations.fadeAnim, {
            toValue: 0,
            ...config,
          })
        );
        break;
      case 'scale':
        animationsToRun.push(
          Animated.timing(animations.scaleAnim, {
            toValue: 0.3,
            ...config,
          })
        );
        break;
    }

    Animated.parallel(animationsToRun).start(() => {
      setState(prev => ({ ...prev, isAnimating: false }));
      onComplete();
    });
  }, [animations]);

  // Reset animations to initial state
  const resetAnimations = useCallback(() => {
    animations.backgroundOpacity.setValue(0);
    animations.slideAnim.setValue(0);
    animations.scaleAnim.setValue(0.3);
    animations.fadeAnim.setValue(0);
  }, [animations]);

  // Process modal queue
  const processQueue = useCallback(() => {
    setState(prev => {
      if (prev.modalQueue.length > 0 && !prev.activeModal) {
        const nextModal = prev.modalQueue[0];
        const remainingQueue = prev.modalQueue.slice(1);
        
        logger.debug('UI', 'Processing modal queue', { 
          modal: nextModal.type,
          remaining: remainingQueue.length 
        });
        
        return {
          ...prev,
          activeModal: nextModal.type,
          modalConfig: nextModal,
          modalQueue: remainingQueue,
        };
      }
      return prev;
    });
  }, []);

  // Core modal actions
  const openModal = useCallback((config: ModalConfig) => {
    logger.info('UI', 'Opening modal', { type: config.type });
    
    if (state.activeModal) {
      // Add to queue if another modal is open
      setState(prev => ({
        ...prev,
        modalQueue: [...prev.modalQueue, config],
      }));
      logger.debug('UI', 'Modal queued', { type: config.type });
      return;
    }

    setState(prev => ({
      ...prev,
      activeModal: config.type,
      modalConfig: config,
    }));

    // Start animation
    animateIn(config.animationType);

    // Set up hardware back button handler
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      closeModal();
      return true;
    });

    // Store cleanup function in config
    config.props = {
      ...config.props,
      _cleanup: () => backHandler.remove(),
    };
  }, [state.activeModal, animateIn]);

  const closeModal = useCallback(() => {
    if (!state.activeModal || !state.modalConfig) return;

    logger.info('UI', 'Closing modal', { type: state.activeModal });

    const currentConfig = state.modalConfig;
    
    // Cleanup back handler
    if (currentConfig.props?._cleanup) {
      currentConfig.props._cleanup();
    }

    animateOut(currentConfig.animationType, () => {
      resetAnimations();
      setState(prev => ({
        ...prev,
        activeModal: null,
        modalConfig: null,
      }));
      
      // Process queue after closing
      setTimeout(processQueue, 50);
    });
  }, [state.activeModal, state.modalConfig, animateOut, resetAnimations, processQueue]);

  const closeAllModals = useCallback(() => {
    logger.info('UI', 'Closing all modals');
    
    setState(prev => ({
      ...prev,
      modalQueue: [],
    }));
    
    closeModal();
  }, [closeModal]);

  // Specific modal helpers
  const openAddTask = useCallback(() => {
    openModal({
      type: 'addTask',
      animationType: 'slide',
    });
  }, [openModal]);

  const openEditTask = useCallback((task: Task) => {
    openModal({
      type: 'editTask',
      animationType: 'slide',
      props: { task },
    });
  }, [openModal]);

  const openDailyLog = useCallback((date?: string) => {
    openModal({
      type: 'dailyLog',
      animationType: 'slide',
      props: { date },
    });
  }, [openModal]);

  const openSettings = useCallback(() => {
    openModal({
      type: 'settings',
      animationType: 'slide',
    });
  }, [openModal]);

  const openTaskAnalytics = useCallback((task: Task) => {
    openModal({
      type: 'taskAnalytics',
      animationType: 'fade',
      props: { task },
    });
  }, [openModal]);

  const openConfirmation = useCallback((onConfirm: () => void, onCancel?: () => void) => {
    openModal({
      type: 'confirmation',
      animationType: 'scale',
      props: { onConfirm, onCancel },
    });
  }, [openModal]);

  // Animation style helpers
  const getAnimationStyle = useCallback((animationType: AnimationType) => {
    switch (animationType) {
      case 'slide':
        return {
          transform: [
            {
              translateY: animations.slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [600, 0],
              }),
            },
          ],
        };
      case 'fade':
        return {
          opacity: animations.fadeAnim,
        };
      case 'scale':
        return {
          transform: [
            {
              scale: animations.scaleAnim,
            },
          ],
          opacity: animations.scaleAnim,
        };
      default:
        return {};
    }
  }, [animations]);

  return {
    // State
    activeModal: state.activeModal,
    modalConfig: state.modalConfig,
    isAnimating: state.isAnimating,
    animations,
    
    // Actions
    openModal,
    closeModal,
    closeAllModals,
    
    // Specific helpers
    openAddTask,
    openEditTask,
    openDailyLog,
    openSettings,
    openTaskAnalytics,
    openConfirmation,
    
    // Animation helpers
    getAnimationStyle,
  };
};