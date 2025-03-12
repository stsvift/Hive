import { API_ENDPOINTS } from '../config/api'
import api from '../services/api'

export interface Task {
  id: string | number
  title: string
  description: string
  isCompleted: boolean
  deadline?: string
  assigneeId?: number
  createdAt: string
  folderId?: string | number
  priority: 'low' | 'medium' | 'high' | number // Accept number for API compatibility
  status: 'todo' | 'in_progress' | 'done' | string // Accept API status formats
}

// Улучшим функцию трансформации ответа
const transformTaskResponse = (data: any): Task => {
  if (!data) {
    throw new Error('Invalid task data')
  }

  // Проверяем разные варианты структуры данных
  const taskData = data.data || data.attributes || data
  const id = String(taskData.id || data.id || '')

  // Определяем приоритет в понятном виде
  let priority = taskData.priority
  if (priority === undefined || priority === null) {
    priority = 'medium'
  }

  // Определяем статус с улучшенной обработкой
  let status = taskData.status
  if (!status) {
    status = taskData.isCompleted ? 'done' : 'todo'
  } else if (typeof status === 'number') {
    // Преобразуем числовой статус в строковый
    switch (status) {
      case 0:
        status = 'todo'
        break
      case 1:
        status = 'in_progress'
        break
      case 2:
        status = 'done'
        break
      default:
        status = 'todo'
    }
  } else if (typeof status === 'string') {
    // Нормализуем строковые значения
    status = status.toLowerCase()
    if (status.includes('progress') || status.includes('процесс')) {
      status = 'in_progress'
    } else if (status.includes('done') || status.includes('заверш')) {
      status = 'done'
    } else if (status.includes('todo') || status.includes('выполн')) {
      status = 'todo'
    }
  }

  // Сохраняем folderId из любого возможного поля
  const folderId =
    taskData.folderId ||
    taskData.folder_id ||
    taskData.folderid ||
    data.folderId ||
    data.folder_id ||
    undefined

  return {
    id,
    title: taskData.title || taskData.name || `Task ${id}`,
    description: taskData.description || '',
    isCompleted: Boolean(taskData.isCompleted || status === 'done'),
    deadline: taskData.deadline || taskData.dueDate || null,
    createdAt: taskData.createdAt || new Date().toISOString(),
    priority,
    status,
    folderId, // Добавляем folderId в результат трансформации
    // Add any additional fields safely
    ...(taskData.assigneeId ? { assigneeId: taskData.assigneeId } : {}),
  }
}

export interface TaskFilters {
  search?: string
  priority?: string
  status?: string
  page?: number
  pageSize?: number
}

interface TasksResponse {
  tasks: Task[]
  total: number
}

interface CreateTaskData {
  title: string
  description: string
  deadline?: string
  priority: number // Ensure this is always a number by the time it reaches the API
  status: string
  isCompleted?: boolean
  folderId?: string | number
}

// Helper function to handle API errors
const handleError = (error: any): never => {
  console.error('API Error:', error)
  const message =
    error.response?.data?.message || error.message || 'Unknown error occurred'
  throw new Error(message)
}

// Tasks API methods
export const tasksApi = {
  // Get all tasks with filtering and pagination
  async getTasks(filters: TaskFilters = {}): Promise<TasksResponse | Task[]> {
    try {
      const response = await api.get(API_ENDPOINTS.TASKS, { params: filters })

      // Handle both array and object responses
      if (Array.isArray(response.data)) {
        const tasks = response.data.map(transformTaskResponse)
        return tasks
      } else if (response.data && response.data.tasks) {
        const tasks = response.data.tasks.map(transformTaskResponse)
        return {
          tasks,
          total: response.data.total || tasks.length,
        }
      } else if (response.data && typeof response.data === 'object') {
        // Single task response
        const task = transformTaskResponse(response.data)
        return [task]
      }

      console.warn(
        'Unexpected response structure from tasks API:',
        response.data
      )
      return { tasks: [], total: 0 }
    } catch (error) {
      return handleError(error)
    }
  },

  // Get a single task
  async getTask(id: string | number): Promise<Task> {
    if (!id) {
      console.error('getTask called with invalid id:', id)
      return {
        id: 'unknown',
        title: 'Unknown Task',
        description: 'Task details unavailable - invalid ID',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        priority: 'medium',
        status: 'todo',
      }
    }

    try {
      console.log(`Getting task ${id}...`)

      // Instead of trying to get a single task by ID (which returns 405),
      // use the getTasks endpoint and filter client-side
      const allTasksResponse = await api.get(API_ENDPOINTS.TASKS)
      console.log('Got all tasks response:', allTasksResponse)

      let matchingTask = null

      // Handle different response formats from the API
      if (Array.isArray(allTasksResponse.data)) {
        matchingTask = allTasksResponse.data.find(
          (t: any) => String(t.id) === String(id)
        )
      } else if (
        allTasksResponse.data?.tasks &&
        Array.isArray(allTasksResponse.data.tasks)
      ) {
        matchingTask = allTasksResponse.data.tasks.find(
          (t: any) => String(t.id) === String(id)
        )
      }

      if (matchingTask) {
        console.log(`Found task ${id} in all tasks:`, matchingTask)
        return transformTaskResponse(matchingTask)
      }

      // If we didn't find the task, log a warning and return a fallback
      console.warn(`Task ${id} not found in all tasks response`)
      return {
        id: String(id),
        title: `Task ${id}`,
        description: 'Task not found in system',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        priority: 'medium',
        status: 'todo',
      }
    } catch (error) {
      console.error(`Error getting task ${id}:`, error)

      // Return a fallback task object for UI resilience
      return {
        id: String(id),
        title: `Task ${id}`,
        description: 'Task details could not be loaded',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        priority: 'medium',
        status: 'todo',
      }
    }
  },

  // Create a new task
  async createTask(data: CreateTaskData): Promise<Task> {
    try {
      console.log('Creating task with data:', {
        ...data,
        folderId: data.folderId ? String(data.folderId) : undefined,
      })

      // Подготовим данные для отправки с всеми возможными форматами folderId
      const requestData = {
        ...data,
        // Передаем все возможные форматы folderId для совместимости
        folderId: data.folderId ? String(data.folderId) : undefined,
        folder_id: data.folderId ? String(data.folderId) : undefined,
        folderid: data.folderId ? String(data.folderId) : undefined,
        // Добавляем новый формат
        folderRef: data.folderId ? String(data.folderId) : undefined,
      }

      const response = await api.post(API_ENDPOINTS.TASKS, requestData)
      console.log('Task API raw response:', response)
      console.log('Task API response type:', typeof response.data)
      console.log('Task API response data:', response.data)

      if (!response.data) {
        console.error('Empty response data from task API')
        throw new Error('Empty response from server')
      }

      // Преобразуем ответ в стандартный формат задачи
      const createdTask = transformTaskResponse(response.data)

      // Принудительно добавляем folderId, если его нет в ответе
      if (data.folderId && !createdTask.folderId) {
        createdTask.folderId = String(data.folderId)
      }

      return createdTask
    } catch (error) {
      console.error('Failed to create task:', error)
      // Improve error logging for debugging
      if (error.response) {
        console.error('Error response status:', error.response.status)
        console.error('Error response headers:', error.response.headers)
        console.error(
          'Error response data:',
          typeof error.response.data === 'string'
            ? error.response.data.substring(0, 200)
            : error.response.data
        )
      }

      // В случае неудачи создадим минимальную задачу с базовыми данными для UI
      if (data.title) {
        return {
          id: `temp-${Date.now()}`,
          title: data.title,
          description: data.description || '',
          isCompleted: false,
          createdAt: new Date().toISOString(),
          priority: data.priority || 'medium',
          status: data.status || 'todo',
          folderId: data.folderId ? String(data.folderId) : undefined,
        }
      }
      return handleError(error)
    }
  },

  // Update a task
  async updateTask(
    id: string | number,
    data: Partial<CreateTaskData>
  ): Promise<Task> {
    try {
      const response = await api.put(`${API_ENDPOINTS.TASKS}/${id}`, data)
      return response.data
    } catch (error) {
      return handleError(error)
    }
  },

  // Toggle task completion
  async toggleTaskCompletion(id: string | number): Promise<Task> {
    try {
      const response = await api.patch(`${API_ENDPOINTS.TASKS}/${id}/toggle`)
      return response.data
    } catch (error) {
      return handleError(error)
    }
  },

  // Delete a task
  async deleteTask(id: string | number): Promise<void> {
    try {
      await api.delete(`${API_ENDPOINTS.TASKS}/${id}`)
    } catch (error) {
      return handleError(error)
    }
  },
}
