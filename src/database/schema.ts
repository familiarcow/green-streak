export const CREATE_TABLES = `
  -- Tasks table
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#22c55e',
    is_multi_completion BOOLEAN DEFAULT FALSE,
    created_at TEXT NOT NULL,
    archived_at TEXT,
    reminder_enabled BOOLEAN DEFAULT FALSE,
    reminder_time TEXT,
    reminder_frequency TEXT,
    streak_enabled BOOLEAN DEFAULT TRUE,
    streak_skip_weekends BOOLEAN DEFAULT FALSE,
    streak_skip_days TEXT,
    streak_minimum_count INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
  );

  -- Daily logs table
  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    date TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    UNIQUE(task_id, date)
  );

  -- Streaks table
  CREATE TABLE IF NOT EXISTS streaks (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_completion_date TEXT,
    streak_start_date TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  -- Settings table
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(date);
  CREATE INDEX IF NOT EXISTS idx_logs_task_date ON logs(task_id, date);
  CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at);
  -- Note: idx_tasks_sort_order is created by the addSortOrder migration
  CREATE INDEX IF NOT EXISTS idx_streaks_task ON streaks(task_id);
  CREATE INDEX IF NOT EXISTS idx_streaks_last_completion ON streaks(last_completion_date);
  CREATE INDEX IF NOT EXISTS idx_streaks_current ON streaks(current_streak) WHERE current_streak > 0;
`;

export const DROP_TABLES = `
  DROP TABLE IF EXISTS logs;
  DROP TABLE IF EXISTS streaks;
  DROP TABLE IF EXISTS tasks;
  DROP TABLE IF EXISTS settings;
`;

export const DEFAULT_SETTINGS = [
  { key: 'global_reminder_enabled', value: 'false' },
  { key: 'global_reminder_time', value: '20:00' },
  { key: 'debug_logging_enabled', value: 'false' },
  { key: 'current_log_level', value: 'WARN' },
  { key: 'app_version', value: '1.0.0' },
];

export const SAMPLE_TASK_NAMES = [
  'Exercise',
  'Read',
  'Meditate',
  'Journal',
  'Water intake',
  'Learn something new',
  'Call family',
  'Clean room',
  'Practice instrument',
  'Stretch',
  'Plan tomorrow',
  'Gratitude practice',
  'Take vitamins',
  'Walk outdoors',
  'Healthy meal'
];

export const SAMPLE_TASK_ICONS = [
  '💪', '📚', '🧘', '📝', '💧',
  '🎓', '📞', '🧹', '🎵', '🤸',
  '📅', '🙏', '💊', '🚶', '🥗'
];

export const COLOR_PALETTE = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#6b7280', // gray
  '#14b8a6', // teal
  '#a855f7', // purple
];