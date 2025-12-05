-- Migration for task sharing
-- Creating table to store shared task permissions

CREATE TABLE IF NOT EXISTS task_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  owner_user_id INTEGER NOT NULL,
  shared_user_id INTEGER NOT NULL,
  access_level TEXT NOT NULL CHECK(access_level IN ('view', 'edit')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  removed_at TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(task_id, shared_user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_shares_task_id ON task_shares(task_id);
CREATE INDEX IF NOT EXISTS idx_task_shares_shared_user_id ON task_shares(shared_user_id);

INSERT INTO schema_migrations (version)
VALUES ('0005_task_shares');


