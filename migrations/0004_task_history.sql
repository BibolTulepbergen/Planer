-- Migration for task history
-- Creating table to track changes to tasks

-- Task history table
CREATE TABLE IF NOT EXISTS task_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('created', 'updated', 'deleted', 'restored', 'status_changed', 'archived')),
  field_name TEXT, -- Name of the field that changed (for updates)
  old_value TEXT, -- Previous value (JSON for complex types)
  new_value TEXT, -- New value (JSON for complex types)
  changed_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for task_history
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_user_id ON task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_action ON task_history(action);
CREATE INDEX IF NOT EXISTS idx_task_history_changed_at ON task_history(changed_at);

-- Record migration
INSERT INTO schema_migrations (version)
VALUES ('0004_task_history');

