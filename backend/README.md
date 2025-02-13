# Hive Backend

Серверная часть системы управления задачами Hive на .NET 9.0.

## Технологический стек

- .NET 9.0
- Entity Framework Core
- MySQL
- JWT аутентификация
- Swagger для документации API

## Установка и настройка

### Предварительные требования

- .NET 9.0 SDK
- MySQL 8.0 или выше
- IDE (рекомендуется Visual Studio или Rider)

### Пошаговая настройка

1. Клонирование и переход в директорию:
```bash
cd backend
```

2. Настройка конфигурации:
```bash
cp .env.example .env
```

3. Отредактируйте `.env` файл под ваше окружение

4. Установка зависимостей:
```bash
dotnet restore
```

5. Применение миграций:
```bash
dotnet ef database update
```

6. Запуск приложения:
```bash
dotnet run
```

API будет доступно по адресу: `https://localhost:5001`

## Структура проекта

```
backend/
├── Controllers/    # API контроллеры
├── Models/         # Модели данных
├── Services/       # Бизнес-логика
├── Data/          # Контекст БД и миграции
├── Configuration/ # Настройки приложения
└── Middleware/    # Промежуточное ПО
```

## Документация API

Swagger документация доступна по адресу: `https://localhost:5001/swagger`

## Тестирование

```bash
dotnet test
```
