# Database Migrations

Эта папка содержит SQL миграции для базы данных Cloudflare D1.

## База данных

- **Название**: planer-db
- **ID**: 55f3bc53-6889-4cf3-a22b-9bdd763ee4d1
- **Регион**: APAC

## Команды

### Применить миграции

```bash
# В production
npm run db:migrate

# Локально (для разработки)
npm run db:migrate:local
```

### Посмотреть список миграций

```bash
npm run db:list
```

### Выполнить SQL запрос

```bash
# В production
npx wrangler d1 execute planer-db --remote --command="SELECT * FROM app_versions"

# Локально
npx wrangler d1 execute planer-db --local --command="SELECT * FROM app_versions"
```

## Структура таблиц

### app_versions

Таблица для управления версиями приложения.

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | INTEGER | Первичный ключ (автоинкремент) |
| version | TEXT | Название версии (например, "1.0.0") |
| release_date | TEXT | Дата релиза |
| description | TEXT | Описание версии |
| is_active | INTEGER | Активна ли версия (1/0) |
| created_at | TEXT | Дата создания записи |
| updated_at | TEXT | Дата обновления записи |

### schema_migrations

Служебная таблица для отслеживания примененных миграций.

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | INTEGER | Первичный ключ (автоинкремент) |
| version | TEXT | Название миграции |
| applied_at | TEXT | Дата применения |

## API Endpoints

### GET /api/version

Возвращает информацию о текущей активной версии приложения.

**Пример запроса:**
```bash
curl https://your-worker.workers.dev/api/version
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "version": "1.0.0",
    "release_date": "2025-11-20 17:20:04",
    "description": "Начальная версия приложения",
    "is_active": 1,
    "created_at": "2025-11-20 17:20:04",
    "updated_at": "2025-11-20 17:20:04"
  }
}
```

## Создание новой миграции

1. Создайте новый файл с именем `XXXX_description.sql` (где XXXX - порядковый номер)
2. Напишите SQL команды для миграции
3. Примените миграцию командой `npm run db:migrate:local` (для локального теста) или `npm run db:migrate` (для production)

**Пример новой миграции:**

```sql
-- 0002_add_users_table.sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## Проверка статуса

Текущий статус базы данных:
- ✅ Миграция 0001_initial.sql применена
- ✅ Тестовые данные загружены
- ✅ API endpoint /api/version работает

