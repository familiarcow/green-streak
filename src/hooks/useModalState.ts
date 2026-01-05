import { useState, useCallback } from 'react';
import { Task, UseModalStateReturn } from '../types';

/**
 * Custom hook for managing modal states
 * Provides consistent modal state management across components
 */
export const useModalState = (): UseModalStateReturn => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDailyLog, setShowDailyLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTaskAnalytics, setShowTaskAnalytics] = useState(false);

  const openAddTask = useCallback(() => {
    setEditingTask(null); // Clear any existing task
    setShowAddTask(true);
  }, []);

  const openEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setShowAddTask(true);
  }, []);

  const closeAddTask = useCallback(() => {
    setShowAddTask(false);
    setEditingTask(null); // Clear editing task
  }, []);

  const openDailyLog = useCallback(() => {
    setShowDailyLog(true);
  }, []);

  const closeDailyLog = useCallback(() => {
    setShowDailyLog(false);
  }, []);

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const openTaskAnalytics = useCallback(() => {
    setShowTaskAnalytics(true);
  }, []);

  const closeTaskAnalytics = useCallback(() => {
    setShowTaskAnalytics(false);
  }, []);

  const closeAllModals = useCallback(() => {
    setShowAddTask(false);
    setEditingTask(null);
    setShowDailyLog(false);
    setShowSettings(false);
    setShowTaskAnalytics(false);
  }, []);

  return {
    // State
    showAddTask,
    editingTask,
    showDailyLog,
    showSettings,
    showTaskAnalytics,
    
    // Actions
    openAddTask,
    openEditTask,
    closeAddTask,
    openDailyLog,
    closeDailyLog,
    openSettings,
    closeSettings,
    openTaskAnalytics,
    closeTaskAnalytics,
    closeAllModals,
  };
};