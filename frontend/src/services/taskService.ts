import { STORAGE_KEYS } from '../config/constants'

// In development, use the proxy. In production, use the env variable
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Task interface that matches the API
export interface Task {
  id: string
  title: string
  description: string
  isCompleted: boolean
  taskDate?: string
  startTime?: string // Time field for task start
  endTime?: string // Time field for task end
  priority: string
  status: string
  category?: string
  tags?: string
  estimatedHours?: number
  actualHours?: number
  folderId?: number
  createdAt: string
}

// Task creation/update interface
export interface TaskInput {
  title: string
  description: string | null
  isCompleted: boolean
  taskDate: string | null
  startTime: string | null
  endTime: string | null
  assigneeId: number | null
  priority: string // Changed from number to string
  status: string
  folderId: number | null
  category: string | null
  tags: string | null
  estimatedHours: number | null
  actualHours: number | null
}

// Get the auth token from localStorage
const getAuthToken = (): string | null => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  if (!token) {
    console.warn('No auth token found in localStorage.')
  }
  return token
}

// Helper function to build request headers with auth token
const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  } else {
    console.error('Authorization token is missing. Requests may fail.')
  }

  return headers
}

// Helper function for delay between retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Enhanced fetch function with retries and better error handling
const fetchAPI = async (
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`
  console.log('Making request to:', url)

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getHeaders(),
          Accept: 'application/json',
        },
      })

      // Log response status
      console.log(`Attempt ${attempt + 1}: Status ${response.status}`)

      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        if (isJson) {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        }
        throw new Error(errorMessage)
      }

      if (response.status === 204) {
        return null
      }

      if (!isJson) {
        console.warn('Response is not JSON:', await response.text())
        throw new Error('Invalid response format')
      }

      return await response.json()
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error)

      if (attempt === retries - 1) {
        throw error
      }

      await delay(1000 * Math.pow(2, attempt))
    }
  }
}

// API functions for tasks
export const taskService = {
  // Get all tasks
  getAllTasks: async (): Promise<Task[]> => {
    return fetchAPI('/tasks')
  },

  // Get a single task by ID
  getTaskById: async (id: string): Promise<Task> => {
    return fetchAPI(`/tasks/${id}`)
  },

  // Create a new task
  createTask: async (task: TaskInput): Promise<Task> => {
    try {
      // Create a simple payload that matches EXACTLY what's in the API documentation
      // with minimal transformations
      const payload = {
        title: task.title.trim(),
        description: task.description || '',
        isCompleted: false, // Always start with false regardless of status
        taskDate: formatDateForApi(task.taskDate), // Fix date format
        startTime: task.startTime, // Send raw time string
        endTime: task.endTime, // Send raw time string
        priority: 'Medium', // Use exact string from API docs
        status: 'Todo', // Use exact string from API docs
        category: task.category || '',
        tags: task.tags || '',
        folderId: task.folderId || null,
        estimatedHours: task.estimatedHours || null,
        actualHours: task.actualHours || null,
        // Don't include assigneeId - the API will assign it based on the token
      }

      console.log('Creating task with minimal payload:', payload)

      const response = await fetchAPI('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return (
        response ||
        ({
          id: '0',
          title: task.title,
          createdAt: new Date().toISOString(),
        } as Task)
      )
    } catch (error) {
      console.error('Task creation error:', error)

      // Capture response text if possible
      if (error instanceof Error) {
        console.log('Error details:', error.message)
      }

      throw error
    }
  },

  // Update an existing task
  updateTask: async (id: string, task: Partial<TaskInput>): Promise<Task> => {
    try {
      // Упрощаем создание payload для более прямой передачи данных
      const payload = {
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        isCompleted: task.status === 'Done',
        taskDate: formatDateForApi(task.taskDate),
        startTime: task.startTime,
        endTime: task.endTime,
        tags: task.tags,
        category: task.category || null,
        folderId: task.folderId || null,
        estimatedHours: task.estimatedHours || null,
        actualHours: task.actualHours || null,
      }

      console.log(`[API] Updating task ${id} with data:`, payload)

      // Проверяем базовый URL и порт
      const baseUrl = import.meta.env.DEV
        ? '/api'
        : import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      console.log(`[API] Using base URL: ${baseUrl}`)

      const response = await fetchAPI(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      console.log(`[API] Update response:`, response)
      return response
    } catch (error) {
      console.error('[API] Task update error:', error)
      if (error instanceof Error) {
        console.log('[API] Error details:', error.message)
      }
      throw error
    }
  },

  // Toggle task completion status
  toggleTaskCompletion: async (id: string): Promise<Task> => {
    return fetchAPI(`/tasks/${id}/toggle`, {
      method: 'PATCH',
    })
  },

  // Delete a task
  deleteTask: async (id: string): Promise<void> => {
    return fetchAPI(`/tasks/${id}`, {
      method: 'DELETE',
    })
  },
}

// Helper function to capitalize first letter (add this to your file)
const capitalizeFirstLetter = (str: string | null | undefined): string => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Helper function to ensure dates are in the correct format (yyyy-MM-dd)
const formatDateForApi = (
  dateString: string | null | undefined
): string | null => {
  if (!dateString) return null

  // If already in yyyy-MM-dd format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }

  // If it has a time component, extract just the date
  if (dateString.includes('T')) {
    return dateString.split('T')[0]
  }

  try {
    // Otherwise try to create a date and format it
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null

    return date.toISOString().split('T')[0]
  } catch (e) {
    console.error('Error formatting date:', e)
    return null
  }
}
