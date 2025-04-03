import { STORAGE_KEYS } from '../config/constants'

// In development, use the proxy. In production, use the env variable
const API_BASE_URL = 'http://localhost:5000/api' // Using port 5000 where backend is running

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

// Get the auth token from localStorage with better validation
const getAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)

    if (!token) {
      console.warn('No auth token found in localStorage.')
      return null
    }

    // Remove any quotes that might have been added
    const cleanToken = token.replace(/^["']|["']$/g, '')

    // Verify the token is not empty after cleaning
    if (!cleanToken || cleanToken === 'undefined' || cleanToken === 'null') {
      console.warn('Auth token is invalid:', token)
      return null
    }

    return cleanToken
  } catch (error) {
    console.error('Error retrieving auth token:', error)
    return null
  }
}

// Helper function to build request headers with auth token
const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    console.log('Using authorization token:', token.substring(0, 10) + '...')
  } else {
    console.error(
      'Authorization token is missing. Requests will fail with 401 Unauthorized.'
    )
  }

  return headers
}

// Improved function to get the current user's ID with better fallback options
const getCurrentUserId = (): number | null => {
  try {
    // Try to get user from localStorage first
    const userString = localStorage.getItem(STORAGE_KEYS.USER)
    if (userString) {
      const user = JSON.parse(userString)
      if (user?.id) {
        console.log('Found user ID in localStorage:', user.id)
        return user.id
      }
    }

    // If not found, try to extract from token
    const token = getAuthToken()
    if (token) {
      // JWT tokens are in the format: header.payload.signature
      // We need the payload part which is the second segment
      try {
        const payload = token.split('.')[1]
        if (payload) {
          // Decode the base64 payload
          const decodedPayload = JSON.parse(atob(payload))
          if (decodedPayload.userId || decodedPayload.sub) {
            const userId = decodedPayload.userId || decodedPayload.sub
            console.log('Extracted user ID from token:', userId)
            return Number(userId)
          }
        }
      } catch (tokenError) {
        console.warn('Failed to extract user ID from token', tokenError)
      }
    }

    // Fallback to a hardcoded user ID for development (remove in production)
    console.warn('Using fallback user ID: 1')
    return 1
  } catch (error) {
    console.error('Error getting current user ID:', error)
    return 1 // Fallback to user ID 1 as a last resort
  }
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

  // Check for auth token before making the request
  const token = getAuthToken()
  if (!token) {
    console.error('No valid auth token available. Redirecting to login...')
    // If appropriate, redirect to login page here
    // window.location.href = '/login'
    throw new Error('Authentication required. Please login.')
  }

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

      // If unauthorized and this is the first attempt, try to refresh token
      if (
        error instanceof Error &&
        error.message.includes('401') &&
        attempt === 0
      ) {
        console.warn('Unauthorized access. Token may be expired.')
        // Option to handle token refresh or redirect to login
      }

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
      console.log('Task input:', task)

      // Get the current user ID with better logging
      const assigneeId = getCurrentUserId()
      console.log('Using assigneeId for task creation:', assigneeId)

      // Create payload with the assigneeId
      const payload = {
        title: task.title.trim(),
        description: task.description || '',
        isCompleted: false,
        taskDate: formatDateForApi(task.taskDate),
        priority: 'Medium',
        status: 'Todo',
        assigneeId: assigneeId || 1, // Always provide a valid ID (use 1 as fallback)
        // Only include additional fields if they have values
        ...(task.startTime && { startTime: task.startTime }),
        ...(task.endTime && { endTime: task.endTime }),
        ...(task.category && { category: task.category }),
        ...(task.tags && { tags: task.tags }),
        ...(task.folderId && { folderId: task.folderId }),
        ...(task.estimatedHours && { estimatedHours: task.estimatedHours }),
        ...(task.actualHours && { actualHours: task.actualHours }),
      }

      console.log('Creating task with payload including assigneeId:', payload)

      const response = await fetchAPI('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      console.log('API response:', response)

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
