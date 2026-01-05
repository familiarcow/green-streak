import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  onboardingVersion: string;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      onboardingVersion: '1.0.0',

      completeOnboarding: () => {
        logger.info('STATE', 'Onboarding completed');
        set({ hasCompletedOnboarding: true });
      },

      resetOnboarding: () => {
        logger.info('STATE', 'Onboarding reset');
        set({ hasCompletedOnboarding: false });
      },
    }),
    {
      name: 'onboarding-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          logger.debug('STATE', 'Onboarding store rehydrated', {
            hasCompleted: state.hasCompletedOnboarding,
            version: state.onboardingVersion,
          });
        }
      },
    }
  )
);