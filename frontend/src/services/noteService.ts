import axios from 'axios'
import { STORAGE_KEYS } from '../config/constants'

// Получаем базовый URL из переменных окружения или используем запасной вариант
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Упрощенная проверка доступности API без зависимости от health endpoint
const checkApiAvailability = async () => {
  try {
    // Попробуем сделать запрос к основному API вместо health endpoint
    await axios.head(`${API_URL}`, { timeout: 3000 })
    return true
  } catch (error) {
    console.warn('API availability check failed:', error)
    return false
  }
}

// Configure axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Увеличиваем таймаут
  timeout: 15000,
})

// Add auth token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Добавляем обработчик ошибок для всех запросов
api.interceptors.response.use(
  response => response,
  async error => {
    // Показываем более понятное сообщение при ошибке соединения
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      console.error(
        'Ошибка соединения с сервером. Проверьте, запущен ли бэкенд.'
      )
      // Можно добавить дополнительную логику восстановления соединения
    }
    return Promise.reject(error)
  }
)

export interface ApiNote {
  id: number
  title: string
  content: string
  color: string
  createdAt: string
  updatedAt: string
  userId: number
  folderId?: number
}

export interface CreateNoteDto {
  title: string
  content: string
  color: string
  folderId?: number
}

export interface UpdateNoteDto {
  title: string
  content: string
  color: string
  folderId?: number
}

// Convert API note to frontend note format
export const apiNoteToNote = (apiNote: ApiNote): Note => {
  return {
    id: apiNote.id.toString(),
    title: apiNote.title,
    content: apiNote.content,
    color: apiNote.color,
    createdAt: apiNote.createdAt,
    updatedAt: apiNote.updatedAt,
  }
}

// Get all notes с улучшенной обработкой ошибок соединения
export const getAllNotes = async (): Promise<Note[]> => {
  try {
    // Убираем жесткую зависимость от /health эндпоинта, пробуем напрямую
    const response = await api.get('/notes')
    return response.data.map(apiNoteToNote)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Дополнительная проверка для выявления причины ошибки
      if (error.code === 'ERR_NETWORK') {
        console.error('Сетевая ошибка при получении заметок:', error)
        throw new Error(
          'Не удалось подключиться к серверу. Пожалуйста, проверьте подключение к интернету и убедитесь, что сервер запущен.'
        )
      } else if (error.response?.status === 404) {
        throw new Error(
          'API заметок не найден. Убедитесь, что сервер запущен и API заметок настроен корректно.'
        )
      } else if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        throw new Error(
          'Нет доступа к API заметок. Пожалуйста, войдите в систему заново.'
        )
      }
    }
    console.error('Error fetching notes:', error)
    throw error
  }
}

// Create a new note
export const createNote = async (note: CreateNoteDto): Promise<Note> => {
  try {
    const response = await api.post('/notes', note)
    return apiNoteToNote(response.data)
  } catch (error) {
    console.error('Error creating note:', error)
    throw error
  }
}

// Update an existing note
export const updateNote = async (
  id: string,
  note: UpdateNoteDto
): Promise<Note> => {
  try {
    const response = await api.put(`/notes/${id}`, note)
    return apiNoteToNote(response.data)
  } catch (error) {
    console.error(`Error updating note ${id}:`, error)
    throw error
  }
}

// Delete a note
export const deleteNote = async (id: string): Promise<void> => {
  try {
    await api.delete(`/notes/${id}`)
  } catch (error) {
    console.error(`Error deleting note ${id}:`, error)
    throw error
  }
}

// Interface for frontend note object
export interface Note {
  id: string
  title: string
  content: string
  color: string
  createdAt: string
  updatedAt: string
}
