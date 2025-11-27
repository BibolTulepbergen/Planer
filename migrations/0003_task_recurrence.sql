-- Migration for task recurrence (periodic tasks)
-- Creating table to store recurrence rules for tasks

-- Task recurrence rules table
CREATE TABLE IF NOT EXISTS task_recurrence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL UNIQUE,
  recurrence_type TEXT NOT NULL CHECK(recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  interval_value INTEGER DEFAULT 1, -- Every N days/weeks/months/years
  days_of_week TEXT, -- Comma-separated days for weekly (1-7, 1=Monday)
  day_of_month INTEGER, -- Day of month for monthly recurrence (1-31)
  week_of_month INTEGER, -- Week of month for monthly recurrence (1-4, -1=last)
  month_of_year INTEGER, -- Month for yearly recurrence (1-12)
  end_type TEXT DEFAULT 'never' CHECK(end_type IN ('never', 'date', 'count')),
  end_date TEXT, -- End date for recurrence
  max_occurrences INTEGER, -- Maximum number of occurrences
  current_count INTEGER DEFAULT 0, -- Current count of created instances
  last_generated TEXT, -- Last time an instance was generated
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Index for task_recurrence
CREATE INDEX IF NOT EXISTS idx_task_recurrence_task_id ON task_recurrence(task_id);
CREATE INDEX IF NOT EXISTS idx_task_recurrence_type ON task_recurrence(recurrence_type);

-- Add parent_task_id to tasks table to link recurring instances
ALTER TABLE tasks ADD COLUMN parent_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL;

-- Index for parent_task_id
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_task_id);

-- Record migration
INSERT INTO schema_migrations (version)
VALUES ('0003_task_recurrence');

