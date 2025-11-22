# 🚀 Quick Start - Planer Versions API

## Что было создано?

Полноценное REST API для управления версиями приложения со следующими возможностями:

✅ **6 Endpoints:**
- `GET /api/version` - Получить текущую активную версию
- `GET /api/versions` - Получить все версии
- `GET /api/version/:id` - Получить версию по ID
- `POST /api/version` - Создать новую версию
- `PUT /api/version/:id` - Обновить версию
- `DELETE /api/version/:id` - Удалить версию

✅ **Функции:**
- CORS поддержка для всех origins
- Автоматическая деактивация других версий при создании/обновлении активной версии
- Валидация данных
- Обработка ошибок
- TypeScript типизация

## 🧪 Тестирование

### Метод 1: HTML Тестер (Рекомендуется)

1. Запустите локальный сервер:
```bash
npm run preview
```

2. Откройте файл `test-api.html` в браузере
3. Используйте интерактивный интерфейс для тестирования всех endpoints

### Метод 2: cURL

```bash
# Получить текущую версию
curl http://localhost:8788/api/version

# Получить все версии
curl http://localhost:8788/api/versions

# Создать новую версию
curl -X POST http://localhost:8788/api/version \
  -H "Content-Type: application/json" \
  -d '{"version":"1.0.1","description":"Bug fixes","is_active":true}'

# Обновить версию
curl -X PUT http://localhost:8788/api/version/1 \
  -H "Content-Type: application/json" \
  -d '{"is_active":true}'

# Удалить версию
curl -X DELETE http://localhost:8788/api/version/1
```

### Метод 3: JavaScript (в браузере)

Откройте консоль браузера и выполните:

```javascript
// Получить текущую версию
fetch('http://localhost:8788/api/version')
  .then(res => res.json())
  .then(data => console.log(data));

// Создать новую версию
fetch('http://localhost:8788/api/version', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    version: '1.0.1',
    description: 'Bug fixes',
    is_active: true
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

## 📦 Деплой на Production

```bash
npm run deploy
```

После деплоя ваш API будет доступен по адресу:
```
https://planer.moldahasank.workers.dev/api
```

## 📋 Примеры использования

### Пример 1: Проверка версии при запуске приложения

```javascript
async function checkAppVersion() {
  try {
    const response = await fetch('https://your-worker.workers.dev/api/version');
    const { data } = await response.json();
    
    const currentVersion = '1.0.0'; // Текущая версия приложения
    
    if (data.version !== currentVersion) {
      console.log('Доступна новая версия:', data.version);
      console.log('Описание:', data.description);
      // Показать пользователю уведомление об обновлении
    }
  } catch (error) {
    console.error('Ошибка проверки версии:', error);
  }
}
```

### Пример 2: Админ-панель для управления версиями

```javascript
// Получить все версии
async function getVersionsList() {
  const response = await fetch('https://your-worker.workers.dev/api/versions');
  const { data } = await response.json();
  return data;
}

// Создать релиз новой версии
async function releaseNewVersion(version, notes) {
  const response = await fetch('https://your-worker.workers.dev/api/version', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: version,
      description: notes,
      is_active: true
    })
  });
  return response.json();
}

// Откатить версию
async function rollbackVersion(oldVersionId) {
  const response = await fetch(`https://your-worker.workers.dev/api/version/${oldVersionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      is_active: true
    })
  });
  return response.json();
}
```

### Пример 3: Интеграция в Android приложение (Kotlin)

```kotlin
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.URL

data class AppVersion(
    val version: String,
    val description: String,
    val isActive: Boolean
)

suspend fun checkForUpdates(): AppVersion? {
    return withContext(Dispatchers.IO) {
        try {
            val url = URL("https://your-worker.workers.dev/api/version")
            val response = url.readText()
            val json = JSONObject(response)
            val data = json.getJSONObject("data")
            
            AppVersion(
                version = data.getString("version"),
                description = data.getString("description"),
                isActive = data.getInt("is_active") == 1
            )
        } catch (e: Exception) {
            null
        }
    }
}
```

## 🔧 Настройка для Production

1. **Обновите database_id** в `wrangler.jsonc`:
```json
"database_id": "55f3bc53-6889-4cf3-a22b-9bdd763ee4d1"
```

2. **Примените миграции**:
```bash
npm run db:migrate
```

3. **Задеплойте worker**:
```bash
npm run deploy
```

4. **Проверьте работу API**:
```bash
curl https://planer.moldahasank.workers.dev/api/version
```

## 📖 Документация

Полная документация API доступна в файле `API_DOCUMENTATION.md`.

## 🎯 Возможности для расширения

1. **Аутентификация**: Добавить API ключи для защиты POST/PUT/DELETE endpoints
2. **Версионирование API**: Добавить `/api/v1/`, `/api/v2/` и т.д.
3. **Дополнительные поля**: Добавить поля `min_supported_version`, `force_update`
4. **Статистика**: Отслеживать количество запросов к каждой версии
5. **Webhook**: Отправлять уведомления при создании новой версии

## ⚠️ Важно!

- **Database ID**: Используйте правильный ID: `55f3bc53-6889-4cf3-a22b-9bdd763ee4d1`
- **CORS**: В production рекомендуется ограничить список разрешенных origins
- **Безопасность**: Добавьте аутентификацию для изменяющих операций (POST/PUT/DELETE)

## 🆘 Troubleshooting

### Проблема: "Database not found"
**Решение**: Проверьте `database_id` в `wrangler.jsonc` и убедитесь, что миграции применены:
```bash
npm run db:migrate
```

### Проблема: CORS ошибки
**Решение**: API уже настроен для работы с любыми origins. Если проблема сохраняется, проверьте настройки браузера.

### Проблема: "Endpoint not found"
**Решение**: Убедитесь, что используете правильный URL и метод запроса. Список всех endpoints: `GET /api`

---

Готово! 🎉 Ваше API готово к использованию!

