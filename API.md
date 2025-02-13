# API Hive - Простое описание

## Как работает авторизация

1. Регистрация нового пользователя:
   ```http
   POST http://localhost:5000/api/auth/register
   {
     "email": "user@example.com",
     "password": "password123",
     "name": "Иван Иванов"
   }
   ```

2. Вход в систему:
   ```http
   POST http://localhost:5000/api/auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
   В ответ получаем токен, который нужно использовать в заголовке всех последующих запросов:
   `Authorization: Bearer ваш_токен`

## Работа с задачами

### Получение списка задач
```http
GET http://localhost:5000/api/tasks?page=1&pageSize=10
```
Дополнительные фильтры:
- `status=todo` (или in_progress, done)
- `priority=low` (или medium, high)

### Создание задачи
```http
POST http://localhost:5000/api/tasks
{
  "title": "Написать документацию",
  "description": "Создать описание API",
  "priority": "medium",
  "assigneeId": "id-пользователя"
}
```

### Изменение задачи
```http
PUT http://localhost:5000/api/tasks/id-задачи
{
  "title": "Обновить документацию",
  "status": "in_progress"
}
```

### Удаление задачи
```http
DELETE http://localhost:5000/api/tasks/id-задачи
```

## Работа с пользователями

### Список всех пользователей
```http
GET http://localhost:5000/api/users
```

### Информация о конкретном пользователе
```http
GET http://localhost:5000/api/users/id-пользователя
```

## Частые ошибки и их решения

- 401 ошибка: Проверьте правильность токена авторизации
- 403 ошибка: У вас нет прав для этого действия
- 404 ошибка: Задача или пользователь не найдены
- 400 ошибка: Проверьте правильность отправляемых данных

## Примеры использования с fetch

### Получение списка задач
```javascript
const response = await fetch('http://localhost:5000/api/tasks', {
  headers: {
    'Authorization': 'Bearer ваш_токен'
  }
});
const tasks = await response.json();
```

### Создание новой задачи
```javascript
const response = await fetch('http://localhost:5000/api/tasks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ваш_токен',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Новая задача',
    description: 'Описание задачи',
    priority: 'medium'
  })
});
```

### Изменение статуса задачи
```javascript
const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ваш_токен',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'done'
  })
});
```

## Советы по использованию

1. Всегда проверяйте наличие токена авторизации
2. Используйте try-catch для обработки ошибок
3. При создании задачи обязательны поля: title и priority
4. Статусы задач: todo, in_progress, done
5. Приоритеты задач: low, medium, high
