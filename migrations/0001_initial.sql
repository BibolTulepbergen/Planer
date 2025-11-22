-- Начальная миграция для planer-db
-- Создание таблицы для версий приложения

-- Таблица для хранения информации о версиях приложения
CREATE TABLE IF NOT EXISTS app_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL UNIQUE,
  release_date TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Создание индекса для быстрого поиска активной версии
CREATE INDEX IF NOT EXISTS idx_app_versions_active ON app_versions(is_active);

-- Создание индекса для версии
CREATE INDEX IF NOT EXISTS idx_app_versions_version ON app_versions(version);

-- Вставка тестовой записи
INSERT INTO app_versions (version, release_date, description, is_active)
VALUES ('1.0.0', datetime('now'), 'Начальная версия приложения', 1);

-- Таблица для отслеживания миграций
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL UNIQUE,
  applied_at TEXT DEFAULT (datetime('now'))
);

-- Запись о применении этой миграции
INSERT INTO schema_migrations (version)
VALUES ('0001_initial');

