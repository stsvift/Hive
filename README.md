# Hive - Система управления задачами

Современная система управления задачами, разработанная с использованием React и .NET.

## О проекте

Hive представляет собой полнофункциональное решение для управления задачами и проектами, сочетающее в себе простоту использования и мощный функционал. Система разработана для оптимизации рабочих процессов и повышения продуктивности команд любого размера.

### Ключевые возможности

- **Гибкое управление задачами**: создание, назначение и отслеживание задач
- **Организация по проектам**: группировка связанных задач и установка сроков
- **Персонализированные рабочие пространства**: настройка под нужды каждого пользователя
- **Аналитика и отчеты**: отслеживание прогресса и оценка эффективности
- **Интерактивный интерфейс**: современный и интуитивно понятный UI на React
- **Безопасный бэкенд**: надежная архитектура на .NET с защитой данных

### Для кого

Hive идеально подходит для разработчиков, проектных менеджеров, небольших компаний и фрилансеров, которым требуется эффективный инструмент для организации работы и взаимодействия с командой.

## Предварительные требования

- .NET 9.0 SDK
- Node.js (v18 или новее)
- npm или yarn
- MySQL Server

## Настройка бэкенда

1. Перейдите в директорию бэкенда:

   ```bash
   cd backend
   ```

2. Создайте файл конфигурации окружения:

   ```bash
   cp .env.example .env
   ```

3. Отредактируйте файл `.env`, указав реальные данные для подключения к базе данных и секретный ключ JWT:

   ```
   ConnectionStrings__DefaultConnection=Server=your_server;Database=your_database;User=your_username;Password=your_password;Connect Timeout=30;Default Command Timeout=30;
   JWT_SECRET_KEY=your_secure_secret_key
   ```

4. Восстановите пакеты и соберите проект:

   ```bash
   dotnet restore
   dotnet build
   ```

5. Выполните миграции базы данных (если используется Entity Framework):

   ```bash
   dotnet ef database update
   ```

6. Запустите сервер бэкенда:

   ```bash
   dotnet run
   ```

   Бэкенд API будет доступен по адресу http://localhost:5031 (или на порту, указанном в вашей конфигурации).

## Настройка фронтенда

1. Перейдите в директорию фронтенда:

   ```bash
   cd frontend
   ```

2. Создайте файл конфигурации окружения:

   ```bash
   cp .env.example .env
   ```

3. Отредактируйте файл `.env`, указав правильный URL API (измените, если ваш бэкенд запущен на другом порту):

   ```
   VITE_API_URL=http://your-url/api
   ```

4. Установите зависимости:

   ```bash
   npm install
   # или если используете yarn
   yarn install
   ```

5. Запустите сервер разработки:

   ```bash
   npm run dev
   # или если используете yarn
   yarn dev
   ```

   Фронтенд приложение будет доступно по адресу http://localhost:5173 (порт по умолчанию для Vite).

## Важные замечания

- Никогда не коммитьте ваши файлы `.env` в систему контроля версий. Они уже включены в `.gitignore` по умолчанию.
- Убедитесь, что бэкенд и фронтенд запущены одновременно для правильной работы приложения.
- Порт бэкенда в ваших файлах `.env` должен соответствовать фактическому порту, на котором работает бэкенд.

## Распространенные проблемы и их решение

- Если возникают проблемы с подключением к базе данных, убедитесь, что ваш сервер MySQL запущен и строка подключения в файле `.env` бэкенда указана правильно.
- Если фронтенд не может подключиться к API, проверьте, соответствует ли порт в `VITE_API_URL` порту вашего бэкенда.
- При проблемах с CORS убедитесь, что бэкенд настроен для приема запросов с источника вашего фронтенда.

## Рабочий процесс разработки

1. Запустите оба сервера - бэкенд и фронтенд, как описано выше.
2. Внесите изменения в код.
3. Протестируйте изменения локально.
4. Зафиксируйте и отправьте ваши изменения в систему контроля версий (исключая файлы `.env`).
