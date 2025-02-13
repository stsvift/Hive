# Hive - Система управления задачами

Современная система управления задачами, разработанная с использованием React и .NET.

## Структура проекта

- `/frontend` - React приложение с TypeScript
- `/backend` - .NET API сервер

## Системные требования

- Node.js 18+
- .NET 9.0
- MySQL 8+

## Быстрый старт

1. Клонирование репозитория:
```bash
git clone https://github.com/stsvift/hive.git
cd hive
```

2. Настройка backend:
```bash
cd backend
cp .env.example .env
# Отредактируйте .env файл под ваше окружение
dotnet restore
dotnet run
```

3. Настройка frontend:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Разработка

Подробные инструкции по разработке находятся в соответствующих директориях:
- [Frontend документация](./frontend/README.md)
- [Backend документация](./backend/README.md)

## Лицензия

MIT
>>>>>>> bd26cfe (Initial commit)
