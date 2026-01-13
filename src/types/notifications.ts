/**
 * Notification System Type Definitions
 * 
 * Comprehensive type definitions for the smart notification system
 */

// Modular notification settings to prevent state explosion
export interface NotificationSettings {
  global: GlobalNotificationSettings;
  daily: DailyNotificationSettings;
  streaks: StreakNotificationSettings;
  achievements: AchievementNotificationSettings;
}

export interface GlobalNotificationSettings {
  enabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
  weekendMode: 'off' | 'reduced' | 'normal';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface DailyNotificationSettings {
  enabled: boolean;
  time: string; // "20:00"
  smartMode: boolean; // Context-aware messages based on activity
  includeMotivation: boolean;
}

export interface StreakNotificationSettings {
  protectionEnabled: boolean;
  protectionTime: string; // "21:00"
  protectionThreshold: number; // Min streak days to protect (e.g., 3)
  priorityBasedAlerts: boolean; // Higher priority for longer streaks
}

export interface AchievementNotificationSettings {
  enabled: boolean;
  milestoneAlerts: boolean;
  weeklyRecapEnabled: boolean;
  weeklyRecapDay: 'sunday' | 'monday';
  weeklyRecapTime: string; // "19:00"
}

// Notification types
export type NotificationType = 
  | 'daily_summary'
  | 'streak_protection'
  | 'morning_motivation'
  | 'achievement'
  | 'weekly_recap'
  | 'task_reminder'
  | 'milestone';

export interface NotificationPriority {
  level: 'low' | 'medium' | 'high' | 'critical';
  sound?: boolean;
  vibrate?: boolean;
  persistent?: boolean;
}

// Context for smart notifications
export interface NotificationContext {
  userId?: string;
  date: string;
  tasks: TaskNotificationData[];
  streaks: StreakNotificationData[];
  completedToday: string[]; // Task IDs completed today
  settings: NotificationSettings;
  timeUntilMidnight: number; // Hours remaining in day
  isWeekend: boolean;
  userPatterns?: UserActivityPattern;
}

export interface TaskNotificationData {
  id: string;
  name: string;
  icon?: string;
  reminderEnabled: boolean;
  reminderTime?: string;
  lastCompletionDate?: string;
  completedToday: boolean;
}

export interface StreakNotificationData {
  taskId: string;
  taskName: string;
  currentStreak: number;
  bestStreak: number;
  lastCompletionDate?: string;
  atRisk: boolean; // Streak will break if not completed today
}

// User activity patterns for intelligent scheduling
export interface UserActivityPattern {
  mostActiveHour: number; // 0-23
  averageCompletionTime: string; // "HH:MM"
  weekdayPattern: number[]; // Activity level by hour [0-23]
  weekendPattern: number[]; // Activity level by hour [0-23]
  lastAnalyzedAt: string; // ISO date
}

// Activity summary for smart messages
export interface ActivitySummary {
  date: string;
  hasLoggedToday: boolean;
  totalTasks: number;
  completedTasks: TaskNotificationData[];
  incompleteTasks: TaskNotificationData[];
  streaksAtRisk: StreakNotificationData[];
  perfectDay: boolean;
  completionRate: number; // 0-100
}

// Scheduled notification configuration
export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledFor: Date;
  priority: NotificationPriority;
  data?: Record<string, any>;
  recurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'custom';
}

// Notification template for consistent messaging
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  titleTemplate: string;
  bodyTemplate: string;
  variables: string[]; // Variables that can be replaced in template
  conditions?: NotificationCondition[];
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'between';
  value: any;
}

// Analytics and metrics
export interface NotificationMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  engagementRate: number; // Opened / Delivered
  byType: Record<NotificationType, {
    sent: number;
    opened: number;
    dismissed: number;
  }>;
  optimalTimes: string[]; // Best times for engagement
  lastUpdated: string;
}

// Strategy pattern interface
export interface NotificationStrategy {
  type: NotificationType;
  shouldNotify(context: NotificationContext): boolean;
  getMessage(context: NotificationContext): { title: string; body: string };
  getScheduleTime(context: NotificationContext): Date;
  getPriority(context: NotificationContext): NotificationPriority;
}

// Cache entry for performance optimization
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Batch notification for reducing battery impact
export interface NotificationBatch {
  notifications: ScheduledNotification[];
  scheduledAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}