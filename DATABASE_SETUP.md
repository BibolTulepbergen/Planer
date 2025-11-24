# Подключение базы данных D1 к проекту Planer

## ✅ Выполненные задачи

### 1. Создана база данных D1
- **Название**: `planer-db`
- **Database ID**: `95f2e9ac-075e-487b-92ed-623fbc5d8be4`
- **Регион**: APAC
- **Binding**: `DataBase` (используется в worker'е как `env.DataBase`)

### 2. Настроена конфигурация
Файл `wrangler.jsonc` обновлен с правильными параметрами подключения:
```json
"d1_databases": [
  {
    "binding": "DataBase",
    "database_name": "planer-db",
    "database_id": "95f2e9ac-075e-487b-92ed-623fbc5d8be4",
    "migrations_dir": "migrations"
  }
]
```

### 3. Создана начальная миграция
Файл: `migrations/0001_initial.sql`

**Созданные таблицы:**

#### `app_versions`
Хранит информацию о версиях приложения:
- `id` - уникальный идентификатор
- `version` - номер версии (например, "1.0.0")
- `release_date` - дата релиза
- `description` - описание версии
- `is_active` - флаг активной версии
- `created_at`, `updated_at` - временные метки

#### `schema_migrations`
Служебная таблица для отслеживания миграций

### 4. Добавлены npm скрипты
В `package.json` добавлены команды для работы с БД:
```bash
npm run db:migrate          # Применить миграции в production
npm run db:migrate:local    # Применить миграции локально
npm run db:list             # Список миграций
```

### 5. Миграция применена
- ✅ Локально: миграция применена успешно
- ✅ Production: миграция применена успешно
- ✅ Тестовые данные загружены (версия 1.0.0)

### 6. API endpoint работает
**Endpoint**: `GET /api/version`

Возвращает информацию о текущей активной версии приложения.

**Код в worker/index.ts:**
```typescript
if (url.pathname === "/api/version") {
  try {
    const result = await env.DataBase.prepare(
      "SELECT * FROM app_versions WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1"
    ).first();
    
    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
```

## 🚀 Как использовать

### Запрос к БД из worker'а
```typescript
// Получить одну запись
const result = await env.DataBase.prepare("SELECT * FROM app_versions WHERE id = ?")
  .bind(1)
  .first();

// Получить все записи
const results = await env.DataBase.prepare("SELECT * FROM app_versions")
  .all();

// Вставить данные
await env.DataBase.prepare("INSERT INTO app_versions (version, description) VALUES (?, ?)")
  .bind("1.1.0", "New features")
  .run();
```

### Запросы через CLI
```bash
# Production
npx wrangler d1 execute planer-db --remote --command="SELECT * FROM app_versions"

# Локально
npx wrangler d1 execute planer-db --local --command="SELECT * FROM app_versions"
```

### Деплой
```bash
npm run deploy
```

## 📝 Следующие шаги

1. При необходимости создайте дополнительные миграции
2. Добавьте новые API endpoints для работы с данными
3. Реализуйте CRUD операции для управления версиями
4. Добавьте аутентификацию при необходимости

## 📚 Полезные ссылки
- [Документация Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Workers API](https://developers.cloudflare.com/workers/)

