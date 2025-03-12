# Hive API URLs

## Base URL

`http://localhost:5173/api`

## Authentication

- POST `/api/auth/register`
- POST `/api/auth/login`

## User Management

- GET `/api/users/me`
- GET `/api/users/profile`
- PUT `/api/users/profile`
- POST `/api/users/avatar`

## Tasks

- GET `/api/tasks`
- POST `/api/tasks`
- PATCH `/api/tasks/{id}/toggle`
- PUT `/api/tasks/{id}`
- DELETE `/api/tasks/{id}`

## Notes

- GET `/api/notes`
- POST `/api/notes`
- PUT `/api/notes/{id}`
- DELETE `/api/notes/{id}`

## Folders

- GET `/api/folders`
- GET `/api/folders/{id}`
- POST `/api/folders`
- PUT `/api/folders/{id}`
- DELETE `/api/folders/{id}`

## Dashboard

- GET `/api/dashboard/today-tasks`
- GET `/api/dashboard/task-stats`
