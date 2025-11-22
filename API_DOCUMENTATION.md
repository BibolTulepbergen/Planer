# API Documentation - Planer Versions API

## Base URL
```
https://your-worker.workers.dev/api
```

## Endpoints

### 1. GET /api/version
Получить текущую активную версию приложения.

**Response:**
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

**Status Codes:**
- `200 OK` - Успешно
- `500 Internal Server Error` - Ошибка сервера

---

### 2. GET /api/versions
Получить список всех версий приложения.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "version": "1.0.1",
      "release_date": "2025-11-21 10:00:00",
      "description": "Bug fixes",
      "is_active": 1,
      "created_at": "2025-11-21 10:00:00",
      "updated_at": "2025-11-21 10:00:00"
    },
    {
      "id": 1,
      "version": "1.0.0",
      "release_date": "2025-11-20 17:20:04",
      "description": "Начальная версия приложения",
      "is_active": 0,
      "created_at": "2025-11-20 17:20:04",
      "updated_at": "2025-11-20 17:20:04"
    }
  ],
  "count": 2
}
```

**Status Codes:**
- `200 OK` - Успешно
- `500 Internal Server Error` - Ошибка сервера

---

### 3. GET /api/version/:id
Получить конкретную версию по ID.

**Parameters:**
- `id` (path) - ID версии

**Example Request:**
```bash
curl https://your-worker.workers.dev/api/version/1
```

**Response:**
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

**Status Codes:**
- `200 OK` - Успешно
- `404 Not Found` - Версия не найдена
- `500 Internal Server Error` - Ошибка сервера

---

### 4. POST /api/version
Создать новую версию приложения.

**Request Body:**
```json
{
  "version": "1.0.1",
  "description": "Bug fixes and improvements",
  "is_active": true
}
```

**Fields:**
- `version` (required, string) - Номер версии
- `description` (optional, string) - Описание версии
- `is_active` (optional, boolean) - Активна ли версия (по умолчанию false)

**Example Request:**
```bash
curl -X POST https://your-worker.workers.dev/api/version \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0.1",
    "description": "Bug fixes",
    "is_active": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "version": "1.0.1",
    "release_date": "2025-11-21 10:00:00",
    "description": "Bug fixes",
    "is_active": 1,
    "created_at": "2025-11-21 10:00:00",
    "updated_at": "2025-11-21 10:00:00"
  },
  "message": "Version created successfully"
}
```

**Note:** Если новая версия создается с `is_active: true`, все остальные версии автоматически деактивируются.

**Status Codes:**
- `201 Created` - Версия создана
- `400 Bad Request` - Некорректные данные
- `500 Internal Server Error` - Ошибка сервера

---

### 5. PUT /api/version/:id
Обновить существующую версию.

**Parameters:**
- `id` (path) - ID версии

**Request Body:**
```json
{
  "version": "1.0.2",
  "description": "Updated description",
  "is_active": true
}
```

**Fields:** (все опциональные)
- `version` (optional, string) - Новый номер версии
- `description` (optional, string) - Новое описание
- `is_active` (optional, boolean) - Активна ли версия

**Example Request:**
```bash
curl -X PUT https://your-worker.workers.dev/api/version/1 \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "is_active": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "version": "1.0.0",
    "release_date": "2025-11-20 17:20:04",
    "description": "Updated description",
    "is_active": 1,
    "created_at": "2025-11-20 17:20:04",
    "updated_at": "2025-11-21 11:00:00"
  },
  "message": "Version updated successfully"
}
```

**Note:** Если версия обновляется с `is_active: true`, все остальные версии автоматически деактивируются.

**Status Codes:**
- `200 OK` - Версия обновлена
- `404 Not Found` - Версия не найдена
- `500 Internal Server Error` - Ошибка сервера

---

### 6. DELETE /api/version/:id
Удалить версию.

**Parameters:**
- `id` (path) - ID версии

**Example Request:**
```bash
curl -X DELETE https://your-worker.workers.dev/api/version/1
```

**Response:**
```json
{
  "success": true,
  "message": "Version deleted successfully"
}
```

**Status Codes:**
- `200 OK` - Версия удалена
- `404 Not Found` - Версия не найдена
- `500 Internal Server Error` - Ошибка сервера

---

### 7. GET /api
Информация об API.

**Response:**
```json
{
  "name": "Planer API",
  "version": "1.0.0",
  "endpoints": {
    "GET /api/version": "Get current active version",
    "GET /api/versions": "Get all versions",
    "GET /api/version/:id": "Get version by ID",
    "POST /api/version": "Create new version",
    "PUT /api/version/:id": "Update version",
    "DELETE /api/version/:id": "Delete version"
  }
}
```

---

## Error Responses

Все ошибки возвращаются в следующем формате:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Error Codes:**
- `400 Bad Request` - Некорректный запрос
- `404 Not Found` - Ресурс не найден
- `500 Internal Server Error` - Внутренняя ошибка сервера

---

## CORS

API поддерживает CORS для всех origins (`*`). Разрешенные методы:
- GET
- POST
- PUT
- DELETE
- OPTIONS

---

## Примеры использования

### JavaScript (Fetch API)

```javascript
// Получить текущую версию
async function getCurrentVersion() {
  const response = await fetch('https://your-worker.workers.dev/api/version');
  const data = await response.json();
  console.log(data);
}

// Создать новую версию
async function createVersion(version, description, isActive) {
  const response = await fetch('https://your-worker.workers.dev/api/version', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version,
      description,
      is_active: isActive,
    }),
  });
  const data = await response.json();
  console.log(data);
}

// Получить все версии
async function getAllVersions() {
  const response = await fetch('https://your-worker.workers.dev/api/versions');
  const data = await response.json();
  console.log(data);
}
```

### cURL Examples

```bash
# Получить текущую версию
curl https://your-worker.workers.dev/api/version

# Получить все версии
curl https://your-worker.workers.dev/api/versions

# Создать новую версию
curl -X POST https://your-worker.workers.dev/api/version \
  -H "Content-Type: application/json" \
  -d '{"version":"1.0.1","description":"Bug fixes","is_active":true}'

# Обновить версию
curl -X PUT https://your-worker.workers.dev/api/version/1 \
  -H "Content-Type: application/json" \
  -d '{"is_active":true}'

# Удалить версию
curl -X DELETE https://your-worker.workers.dev/api/version/1
```

---

## Тестирование локально

Запустите worker локально:
```bash
npm run preview
```

Затем используйте `http://localhost:8788/api/...` вместо production URL.

