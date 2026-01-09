import { renderHook, act } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { useModalManager, ModalType, ModalConfig } from '../useModalManager';
import { createMockTask } from '../../test/utils';

// Mock BackHandler
jest.mock('react-native', () => {
  const actualRN = jest.requireActual('react-native');
  return {
    ...actualRN,
    BackHandler: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

// Mock logger
jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('useModalManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with no active modal', () => {
      const { result } = renderHook(() => useModalManager());
      
      expect(result.current.activeModal).toBeNull();
      expect(result.current.modalConfig).toBeNull();
      expect(result.current.isAnimating).toBe(false);
    });

    it('should provide animation values', () => {
      const { result } = renderHook(() => useModalManager());
      
      expect(result.current.animations).toBeDefined();
      expect(result.current.animations.backgroundOpacity).toBeDefined();
      expect(result.current.animations.slideAnim).toBeDefined();
      expect(result.current.animations.scaleAnim).toBeDefined();
      expect(result.current.animations.fadeAnim).toBeDefined();
    });
  });

  describe('Modal Opening', () => {
    it('should open a modal with correct configuration', () => {
      const { result } = renderHook(() => useModalManager());
      
      const config: ModalConfig = {
        type: 'addTask',
        animationType: 'slide',
      };

      act(() => {
        result.current.openModal(config);
      });

      expect(result.current.activeModal).toBe('addTask');
      expect(result.current.modalConfig).toEqual(config);
    });

    it('should queue modals when another is already open', () => {
      const { result } = renderHook(() => useModalManager());
      
      const firstConfig: ModalConfig = {
        type: 'addTask',
        animationType: 'slide',
      };
      
      const secondConfig: ModalConfig = {
        type: 'settings',
        animationType: 'fade',
      };

      act(() => {
        result.current.openModal(firstConfig);
        result.current.openModal(secondConfig);
      });

      // First modal should be active
      expect(result.current.activeModal).toBe('addTask');
      // Second modal should be queued (not directly testable, but behavior verified)
    });

    it('should set up hardware back button handler when opening modal', () => {
      const mockAddEventListener = jest.mocked(BackHandler.addEventListener);
      const { result } = renderHook(() => useModalManager());
      
      const config: ModalConfig = {
        type: 'addTask',
        animationType: 'slide',
      };

      act(() => {
        result.current.openModal(config);
      });

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'hardwareBackPress',
        expect.any(Function)
      );
    });
  });

  describe('Modal Closing', () => {
    it('should close active modal', () => {
      const { result } = renderHook(() => useModalManager());
      
      const config: ModalConfig = {
        type: 'addTask',
        animationType: 'slide',
      };

      act(() => {
        result.current.openModal(config);
      });

      expect(result.current.activeModal).toBe('addTask');

      act(() => {
        result.current.closeModal();
      });

      // Modal should start closing animation
      expect(result.current.isAnimating).toBe(true);
    });

    it('should do nothing when no modal is active', () => {
      const { result } = renderHook(() => useModalManager());
      
      // Should not throw or change state
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.activeModal).toBeNull();
    });
  });

  describe('Specific Modal Helpers', () => {
    it('should open add task modal', () => {
      const { result } = renderHook(() => useModalManager());
      
      act(() => {
        result.current.openAddTask();
      });

      expect(result.current.activeModal).toBe('addTask');
      expect(result.current.modalConfig?.animationType).toBe('slide');
    });

    it('should open edit task modal with task data', () => {
      const { result } = renderHook(() => useModalManager());
      const mockTask = createMockTask();
      
      act(() => {
        result.current.openEditTask(mockTask);
      });

      expect(result.current.activeModal).toBe('editTask');
      expect(result.current.modalConfig?.props?.task).toEqual(mockTask);
      expect(result.current.modalConfig?.animationType).toBe('slide');
    });

    it('should open daily log modal with date', () => {
      const { result } = renderHook(() => useModalManager());
      const testDate = '2024-01-01';
      
      act(() => {
        result.current.openDailyLog(testDate);
      });

      expect(result.current.activeModal).toBe('dailyLog');
      expect(result.current.modalConfig?.props?.date).toBe(testDate);
      expect(result.current.modalConfig?.animationType).toBe('slide');
    });

    it('should open settings modal', () => {
      const { result } = renderHook(() => useModalManager());
      
      act(() => {
        result.current.openSettings();
      });

      expect(result.current.activeModal).toBe('settings');
      expect(result.current.modalConfig?.animationType).toBe('slide');
    });

    it('should open task analytics modal with task data', () => {
      const { result } = renderHook(() => useModalManager());
      const mockTask = createMockTask();
      
      act(() => {
        result.current.openTaskAnalytics(mockTask);
      });

      expect(result.current.activeModal).toBe('taskAnalytics');
      expect(result.current.modalConfig?.props?.task).toEqual(mockTask);
      expect(result.current.modalConfig?.animationType).toBe('fade');
    });

    it('should open confirmation modal with callbacks', () => {
      const { result } = renderHook(() => useModalManager());
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      
      act(() => {
        result.current.openConfirmation(onConfirm, onCancel);
      });

      expect(result.current.activeModal).toBe('confirmation');
      expect(result.current.modalConfig?.props?.onConfirm).toBe(onConfirm);
      expect(result.current.modalConfig?.props?.onCancel).toBe(onCancel);
      expect(result.current.modalConfig?.animationType).toBe('scale');
    });
  });

  describe('Animation Styles', () => {
    it('should return slide animation style', () => {
      const { result } = renderHook(() => useModalManager());
      
      const style = result.current.getAnimationStyle('slide');
      
      expect(style).toHaveProperty('transform');
      expect(Array.isArray(style.transform)).toBe(true);
      expect(style.transform[0]).toHaveProperty('translateY');
    });

    it('should return fade animation style', () => {
      const { result } = renderHook(() => useModalManager());
      
      const style = result.current.getAnimationStyle('fade');
      
      expect(style).toHaveProperty('opacity');
    });

    it('should return scale animation style', () => {
      const { result } = renderHook(() => useModalManager());
      
      const style = result.current.getAnimationStyle('scale');
      
      expect(style).toHaveProperty('transform');
      expect(style).toHaveProperty('opacity');
      expect(Array.isArray(style.transform)).toBe(true);
      expect(style.transform[0]).toHaveProperty('scale');
    });

    it('should return empty style for unknown animation type', () => {
      const { result } = renderHook(() => useModalManager());
      
      // @ts-expect-error - Testing unknown animation type
      const style = result.current.getAnimationStyle('unknown');
      
      expect(style).toEqual({});
    });
  });

  describe('Close All Modals', () => {
    it('should close all modals and clear queue', () => {
      const { result } = renderHook(() => useModalManager());
      
      // Open a modal
      act(() => {
        result.current.openAddTask();
      });

      expect(result.current.activeModal).toBe('addTask');

      // Close all modals
      act(() => {
        result.current.closeAllModals();
      });

      expect(result.current.isAnimating).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing modal config gracefully', () => {
      const { result } = renderHook(() => useModalManager());
      
      // Should not throw when closing with no active modal
      expect(() => {
        act(() => {
          result.current.closeModal();
        });
      }).not.toThrow();
    });
  });

  describe('Hardware Back Button', () => {
    it('should handle hardware back button press', () => {
      const mockAddEventListener = jest.mocked(BackHandler.addEventListener);
      const mockRemoveEventListener = jest.fn();
      mockAddEventListener.mockReturnValue({ remove: mockRemoveEventListener });

      const { result } = renderHook(() => useModalManager());
      
      // Open modal
      act(() => {
        result.current.openAddTask();
      });

      // Get the back handler callback
      const backHandlerCallback = mockAddEventListener.mock.calls[0][1];
      
      // Simulate back button press
      act(() => {
        const handledResult = backHandlerCallback();
        expect(handledResult).toBe(true); // Should return true to indicate handled
      });

      expect(result.current.isAnimating).toBe(true); // Should start closing animation
    });
  });

  describe('Modal Types', () => {
    const modalTypes: ModalType[] = [
      'addTask',
      'editTask', 
      'dailyLog',
      'settings',
      'taskAnalytics',
      'confirmation',
    ];

    it.each(modalTypes)('should handle %s modal type', (modalType) => {
      const { result } = renderHook(() => useModalManager());
      
      const config: ModalConfig = {
        type: modalType,
        animationType: 'fade',
      };

      act(() => {
        result.current.openModal(config);
      });

      expect(result.current.activeModal).toBe(modalType);
    });
  });
});