import { useState, useCallback, useEffect } from 'react';
import { CustomGoalDefinition } from '../types/goals';

type PendingGoalModalAction = 'addGoals' | 'editGoal' | 'createGoal' | null;

interface UseGoalModalFlowConfig {
  /** Callback to close the GoalDetailModal (e.g., closeModal() in HomeScreen, setShowGoalDetailModal(false) in SettingsScreen) */
  onCloseGoalDetail: () => void;
  /** Callback to set whether secondary modals can show (from useGoalsStore) */
  setCanShowModal: (value: boolean) => void;
  /** Callback to reload goals after changes */
  loadGoals: () => void;
}

interface UseGoalModalFlowReturn {
  // Modal visibility states
  showAddGoalsModal: boolean;
  showEditGoalModal: boolean;
  editingGoal: CustomGoalDefinition | undefined;

  // Entry point: called when "Add more goals" is tapped in GoalDetailModal
  handleOpenAddGoalsFromGoalDetail: () => void;

  // GoalDetailModal lifecycle
  handleGoalDetailCloseComplete: () => void;

  // AddGoalsModal handlers
  handleAddGoalsClose: () => void;
  handleAddGoalsCloseComplete: () => void;
  handleCreateCustomGoal: () => void;
  handleEditCustomGoal: (goal: CustomGoalDefinition) => void;

  // EditGoalModal handlers
  handleEditGoalClose: () => void;
  handleGoalSaved: (goal: CustomGoalDefinition) => void;

  // Reset all state (for cleanup on unmount)
  resetState: () => void;
}

/**
 * Hook that encapsulates the goal modal flow sequencing logic.
 *
 * This handles the iOS-safe modal sequencing pattern where modals must
 * open one at a time with proper delays between close and open.
 *
 * Flow: GoalDetailModal -> AddGoalsModal -> EditGoalModal
 *
 * Used by both HomeScreen and SettingsScreen to ensure consistent behavior
 * and avoid code duplication.
 */
export const useGoalModalFlow = (config: UseGoalModalFlowConfig): UseGoalModalFlowReturn => {
  const { onCloseGoalDetail, setCanShowModal, loadGoals } = config;

  // Modal visibility state
  const [showAddGoalsModal, setShowAddGoalsModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CustomGoalDefinition | undefined>(undefined);

  // Pending action state - tracks which modal should open after current one closes
  const [pendingGoalModalAction, setPendingGoalModalAction] = useState<PendingGoalModalAction>(null);

  // Reset all state - useful for cleanup on unmount
  const resetState = useCallback(() => {
    setShowAddGoalsModal(false);
    setShowEditGoalModal(false);
    setEditingGoal(undefined);
    setPendingGoalModalAction(null);
  }, []);

  // Entry point: user taps "Add more goals" in GoalDetailModal
  const handleOpenAddGoalsFromGoalDetail = useCallback(() => {
    // Store intent to open AddGoalsModal after GoalDetailModal closes
    setPendingGoalModalAction('addGoals');
    onCloseGoalDetail();
  }, [onCloseGoalDetail]);

  // Called when GoalDetailModal finishes its close animation
  const handleGoalDetailCloseComplete = useCallback(() => {
    // 100ms delay lets native iOS modal animation fully complete
    setTimeout(() => {
      setCanShowModal(true);
      loadGoals(); // Always refresh goals when GoalDetailModal closes

      if (pendingGoalModalAction === 'addGoals') {
        setShowAddGoalsModal(true);
        setPendingGoalModalAction(null);
      }
    }, 100);
  }, [setCanShowModal, loadGoals, pendingGoalModalAction]);

  // AddGoalsModal close handler
  const handleAddGoalsClose = useCallback(() => {
    setShowAddGoalsModal(false);
  }, []);

  // Called when AddGoalsModal finishes its close animation
  const handleAddGoalsCloseComplete = useCallback(() => {
    // 100ms delay lets native iOS modal animation fully complete
    setTimeout(() => {
      if (pendingGoalModalAction === 'createGoal') {
        setShowEditGoalModal(true);
        setEditingGoal(undefined);
        setPendingGoalModalAction(null);
      } else if (pendingGoalModalAction === 'editGoal' && editingGoal) {
        setShowEditGoalModal(true);
        setPendingGoalModalAction(null);
      }
    }, 100);
  }, [pendingGoalModalAction, editingGoal]);

  // User taps "Create Your Own" in AddGoalsModal
  const handleCreateCustomGoal = useCallback(() => {
    // Store intent to open EditGoalModal in create mode after AddGoalsModal closes
    setPendingGoalModalAction('createGoal');
    setShowAddGoalsModal(false);
  }, []);

  // User taps edit on a custom goal in AddGoalsModal
  const handleEditCustomGoal = useCallback((goal: CustomGoalDefinition) => {
    // Store intent to open EditGoalModal in edit mode after AddGoalsModal closes
    setEditingGoal(goal);
    setPendingGoalModalAction('editGoal');
    setShowAddGoalsModal(false);
  }, []);

  // EditGoalModal close handler (cancel or backdrop)
  const handleEditGoalClose = useCallback(() => {
    setShowEditGoalModal(false);
    setEditingGoal(undefined);
  }, []);

  // User saves a goal in EditGoalModal
  const handleGoalSaved = useCallback((goal: CustomGoalDefinition) => {
    // Goal was saved - close modal and refresh goals
    setShowEditGoalModal(false);
    setEditingGoal(undefined);
    loadGoals();
  }, [loadGoals]);

  return {
    showAddGoalsModal,
    showEditGoalModal,
    editingGoal,
    handleOpenAddGoalsFromGoalDetail,
    handleGoalDetailCloseComplete,
    handleAddGoalsClose,
    handleAddGoalsCloseComplete,
    handleCreateCustomGoal,
    handleEditCustomGoal,
    handleEditGoalClose,
    handleGoalSaved,
    resetState,
  };
};
