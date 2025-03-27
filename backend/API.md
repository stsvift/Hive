# Hive API Documentation

## Base URL

`http://localhost:5031/api`

## Authentication

### Register

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: User object with JWT token

### Login

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: User object with JWT token

## User Management

### Get Current User

- **URL**: `/api/users/me`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**: Current user details

### Get User Profile

- **URL**: `/api/users/profile`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**: User profile details

### Update User Profile

- **URL**: `/api/users/profile`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Request Body**: Updated user profile data
- **Response**: Updated user profile

### Upload Avatar

- **URL**: `/api/users/avatar`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**: Form data with image file
- **Response**: URL to uploaded avatar

## Tasks

### Get All Tasks

- **URL**: `/api/tasks`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**: List of user tasks

### Create Task

- **URL**: `/api/tasks`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string (optional)",
    "isCompleted": false,
    "taskDate": "date (optional)",
    "startTime": "time (optional)",
    "endTime": "time (optional)",
    "priority": "string (default: Medium)",
    "status": "string (default: Todo)",
    "folderId": "number (optional)",
    "category": "string (optional)",
    "tags": "comma-separated string (optional)",
    "estimatedHours": "number (optional)",
    "actualHours": "number (optional)"
  }
  ```
- **Response**: Created task object

### Toggle Task Completion

- **URL**: `/api/tasks/{id}/toggle`
- **Method**: `PATCH`
- **Auth Required**: Yes
- **Response**: Updated task object

### Update Task

- **URL**: `/api/tasks/{id}`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Request Body**: Task object with updated fields
- **Response**: Updated task object

### Delete Task

- **URL**: `/api/tasks/{id}`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Response**: 204 No Content

## Notes

### Get All Notes

- **URL**: `/api/notes`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**: List of user notes

### Create Note

- **URL**: `/api/notes`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "title": "string",
    "content": "string",
    "color": "string (optional)",
    "folderId": "number (optional)"
  }
  ```
- **Response**: Created note object

### Update Note

- **URL**: `/api/notes/{id}`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Request Body**: Note object with updated fields
- **Response**: Updated note object

### Delete Note

- **URL**: `/api/notes/{id}`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Response**: 204 No Content

## Folders

### Get All Folders

- **URL**: `/api/folders`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**: List of user folders

### Get Folder by ID

- **URL**: `/api/folders/{id}`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**: Folder details with related items

### Create Folder

- **URL**: `/api/folders`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string (optional)",
    "color": "string (optional)"
  }
  ```
- **Response**: Created folder object

### Update Folder

- **URL**: `/api/folders/{id}`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Request Body**: Folder object with updated fields
- **Response**: Updated folder object

### Delete Folder

- **URL**: `/api/folders/{id}`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Response**: 204 No Content

## Dashboard

### Get Today's Tasks

- **URL**: `/api/dashboard/today-tasks`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**: List of tasks scheduled for today

### Get Task Statistics

- **URL**: `/api/dashboard/task-stats`
- **Method**: `GET`
- **Auth Required**: Yes
- **Response**: Statistics about user tasks (completed/pending)

## Data Models

### Task Model Fields

- `id`: number (unique identifier)
- `title`: string (required)
- `description`: string (optional)
- `isCompleted`: boolean
- `taskDate`: date (optional)
- `startTime`: time (optional)
- `endTime`: time (optional)
- `assigneeId`: number (required, user ID)
- `priority`: string (default: "Medium")
- `status`: string (default: "Todo")
- `createdAt`: datetime
- `folderId`: number (optional)
- `category`: string (optional)
- `tags`: string (optional, comma-separated)
- `estimatedHours`: number (optional)
- `actualHours`: number (optional)

### Note Model Fields

- `id`: number (unique identifier)
- `title`: string
- `content`: string
- `color`: string
- `createdAt`: datetime
- `updatedAt`: datetime
- `userId`: number (required)
- `folderId`: number (optional)
