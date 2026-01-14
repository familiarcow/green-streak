// Import notification types for use in this file
import { NotificationSettings } from './notifications';
import { HabitTemplate } from './templates';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export type LogCategory = 
  | 'DATA' 
  | 'UI' 
  | 'NOTIF' 
  | 'STATE' 
  | 'PERF' 
  | 'DEV' 
  | 'ERROR'
  | 'APP'
  | 'SERVICE'
  | 'SERVICES'
  | 'STORE'
  | 'HOOK'
  | 'TOAST'
  | 'TOAST_CONTEXT'
  | 'TOAST_ERROR'
  | 'TOAST_QUEUE'
  | 'ORCHESTRATOR'
  | 'CONFETTI'
  | 'SOUND';

export interface Task {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  isMultiCompletion: boolean;
  createdAt: string;
  archivedAt?: string;
  reminderEnabled: boolean;
  reminderTime?: string;
  reminderFrequency?: 'daily' | 'weekly';
  streakEnabled?: boolean;
  streakSkipWeekends?: boolean;
  streakSkipDays?: string[]; // Array of days to skip (e.g., ['2024-01-01', '2024-12-25'])
  streakMinimumCount?: number;
}

export interface TaskLog {
  id: string;
  taskId: string;
  date: string; // YYYY-MM-DD format
  count: number;
  updatedAt: string;
}

// Alias for export/import operations
export type Log = TaskLog;

export interface TaskStreak {
  id: string;
  taskId: string;
  currentStreak: number;
  bestStreak: number;
  lastCompletionDate?: string;
  streakStartDate?: string;
  updatedAt: string;
}

export interface StreakConfig {
  enabled: boolean;
  skipWeekends: boolean;
  skipDays: string[];
  minimumCount: number;
}

export interface AppSettings {
  globalReminderEnabled: boolean;
  globalReminderTime?: string;
  debugLoggingEnabled: boolean;
  currentLogLevel: LogLevel;
  firstDayOfWeek: 'sunday' | 'monday';
  notificationSettings?: NotificationSettings; // Smart notification settings
  calendarColor?: string; // Custom calendar/contribution graph color (default: #22c55e)
}

// Re-export notification types
export * from './notifications';

export interface SeedConfig {
  tasks: number;
  days: number;
  reset?: boolean;
  seed?: number;
  verbose?: boolean;
}

export interface ContributionData {
  date: string;
  count: number;
  tasks: Array<{
    taskId: string;
    name: string;
    count: number;
    color: string;
  }>;
}

// Component Props Interfaces
export interface TodayCardProps {
  selectedDate: string;
  selectedDateData?: ContributionData;
  tasks: Task[];
  onQuickAdd: (taskId: string, date?: string) => void;
  onViewMore: () => void;
  onDateChange: (date: string) => void;
}

export interface TasksSectionProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onAddTask: () => void;
}

export interface EmptyStateSectionProps {
  onAddTask: () => void;
}

// Hook Return Types
export interface UseModalStateReturn {
  // State
  showAddTask: boolean;
  editingTask: Task | null;
  showDailyLog: boolean;
  showSettings: boolean;
  showTaskAnalytics: boolean;
  
  // Actions
  openAddTask: () => void;
  openEditTask: (task: Task) => void;
  closeAddTask: () => void;
  openDailyLog: () => void;
  closeDailyLog: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openTaskAnalytics: () => void;
  closeTaskAnalytics: () => void;
  closeAllModals: () => void;
}

export interface UseTaskActionsReturn {
  handleQuickAdd: (taskId: string, date?: string) => Promise<void>;
  handleQuickRemove: (taskId: string, date?: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
  refreshContributionData: () => Promise<void>;
}

export interface UseDateNavigationReturn {
  selectedDate: string;
  handleDayPress: (date: string) => void;
  handleDateChange: (date: string) => void;
  navigateToToday: () => void;
  navigateDate: (direction: 'prev' | 'next') => string;
  isToday: (date?: string) => boolean;
  setSelectedDate: (date: string) => void;
}

// Screen Props Interfaces
export interface EditTaskModalProps {
  onClose: () => void;
  onTaskAdded: () => void;
  existingTask?: Task;
  initialTemplate?: HabitTemplate;
}

export interface DailyLogScreenProps {
  date: string;
  onClose: () => void;
  onDateChange?: (date: string) => void;
}

export interface SettingsScreenProps {
  onClose: () => void;
}

export interface TaskAnalyticsScreenProps {
  task: Task;
  onClose: () => void;
}

export interface OnboardingScreenProps {
  onComplete: () => void;
}

// Common Utility Interfaces
export interface DateNavigation {
  date: string;
  canGoBack: boolean;
  canGoForward: boolean;
}