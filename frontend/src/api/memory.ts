import axios from 'axios'
import { IFolder, INote, ITask } from '../types'

const API_URL = 'http://localhost:5000/api'

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor для обработки ошибок авторизации и автоматического обновления токена
axiosInstance.interceptors.response.use(
  response => {
    return response
  },
  async error => {
    const originalRequest = error.config

    // Если ошибка 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Пытаемся получить новый токен (refreshToken должен быть сохранен)
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          // Если refreshToken отсутствует, перенаправляем на страницу логина
          window.location.href = '/login'
          return Promise.reject(error)
        }

        const tokenResponse = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        })

        const { token, refreshToken: newRefreshToken } = tokenResponse.data

        // Сохраняем новый токен и refreshToken
        localStorage.setItem('token', token)
        localStorage.setItem('refreshToken', newRefreshToken)

        // Обновляем заголовок Authorization для всех будущих запросов
        axiosInstance.defaults.headers.common['Authorization'] =
          'Bearer ' + token

        // Повторяем исходный запрос с новым токеном
        originalRequest.headers['Authorization'] = 'Bearer ' + token
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Если не удалось обновить токен, перенаправляем на страницу логина
        console.error('Ошибка при обновлении токена:', refreshError)
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const memoryService = {
  // Folders
  getFolders: async () => {
    try {
      const response = await axiosInstance.get('/folders')
      return response.data
    } catch (error) {
      console.error('Error fetching folders:', error)
      throw error
    }
  },

  createFolder: async (data: Partial<IFolder>) => {
    const folderData = {
      ...data,
      folderId: data.parentFolderId, // Добавляем это поле
      parentFolderId:
        data.parentFolderId !== undefined ? data.parentFolderId : null,
    }
    console.log('Creating folder with data:', folderData)
    const response = await axiosInstance.post('/folders', folderData)
    return response.data
  },

  updateFolder: async (id: number, data: Partial<IFolder>) => {
    const response = await axiosInstance.put(`/folders/${id}`, data)
    return response.data
  },

  deleteFolder: async (id: number) => {
    await axiosInstance.delete(`/folders/${id}`)
  },

  // Notes
  getNotes: async () => {
    const response = await axiosInstance.get('/notes')
    return response.data
  },

  createNote: async (data: Partial<INote>) => {
    const noteData = {
      ...data,
      folderId: data.parentFolderId, // Используем parentFolderId как folderId
    }
    const response = await axiosInstance.post('/notes', noteData)
    return response.data
  },

  updateNote: async (id: number, data: Partial<INote>) => {
    const response = await axiosInstance.put(`/notes/${id}`, data)
    return response.data
  },

  deleteNote: async (id: number) => {
    await axiosInstance.delete(`/notes/${id}`)
  },

  // Tasks
  getTasks: async () => {
    const response = await axiosInstance.get('/tasks')
    return response.data
  },

  createTask: async (data: Partial<ITask>) => {
    const taskData = {
      ...data,
      folderId: data.parentFolderId, // Используем parentFolderId как folderId
    }
    const response = await axiosInstance.post('/tasks', taskData)
    return response.data
  },

  updateTask: async (id: number, data: Partial<ITask>) => {
    const response = await axiosInstance.put(`/tasks/${id}`, data)
    return response.data
  },

  deleteTask: async (id: number) => {
    await axiosInstance.delete(`/tasks/${id}`)
  },

  toggleTaskComplete: async (id: number) => {
    const response = await axiosInstance.patch(`/tasks/${id}/toggle`)
    return response.data
  },

  // New methods for folder navigation
  getFolder: async (folderId: number): Promise<IFolder> => {
    try {
      console.log(`API call: getFolder(${folderId})`)
      const response = await axiosInstance.get(`/folders/${folderId}`)
      return response.data
    } catch (error: any) {
      console.error(`Error fetching folder ${folderId}:`, error)
      throw error // Preserve the original error for proper handling
    }
  },

  getFolderBreadcrumbs: async (id: number): Promise<IFolder[]> => {
    try {
      console.log(`API call: getFolderBreadcrumbs(${id})`)
      const response = await axiosInstance.get(`/folders/${id}/breadcrumbs`)
      return response.data
    } catch (error: any) {
      console.warn('Using fallback breadcrumbs implementation:', error)
      
      // Implement manual breadcrumb building
      const breadcrumbs: IFolder[] = []
      let currentId = id

      while (currentId) {
        try {
          const folderResponse = await axiosInstance.get(`/folders/${currentId}`)
          const folder = folderResponse.data
          breadcrumbs.unshift(folder)
          
          if (!folder.parentFolderId) break
          currentId = folder.parentFolderId
        } catch (folderError) {
          console.error('Error in fallback breadcrumbs:', folderError)
          break
        }
      }

      return breadcrumbs.length > 0 ? breadcrumbs : [] // Return empty array if nothing found
    }
  },

  getFolderChildren: async (folderId: number): Promise<IFolder[]> => {
    try {
      const response = await axiosInstance.get(`/folders/${folderId}/children`)
      return response.data
    } catch (error) {
      console.error(`Error fetching folder ${folderId} children:`, error)
      throw error
    }
  },

  getFolderNotes: async (id: number): Promise<INote[]> => {
    try {
      console.log(`API call: getFolderNotes(${id})`)
      const response = await axiosInstance.get(`/folders/${id}/notes`)
      return response.data
    } catch (error) {
      console.error(
        'Folder notes endpoint not available, using fallback:',
        error
      )
      // Fallback: Filter all notes to find those linked to this folder
      try {
        const notesResponse = await axiosInstance.get('/notes')
        return notesResponse.data.filter(
          (note: INote) => note.folderId === id || note.parentFolderId === id
        )
      } catch (notesError) {
        console.error('Failed to get notes for fallback:', notesError)
        return []
      }
    }
  },

  getFolderTasks: async (id: number): Promise<ITask[]> => {
    try {
      console.log(`API call: getFolderTasks(${id})`)
      const response = await axiosInstance.get(`/folders/${id}/tasks`)
      return response.data
    } catch (error) {
      console.error(
        'Folder tasks endpoint not available, using fallback:',
        error
      )
      // Fallback: Filter all tasks to find those linked to this folder
      try {
        const tasksResponse = await axiosInstance.get('/tasks')
        return tasksResponse.data.filter(
          (task: ITask) => task.folderId === id || task.parentFolderId === id
        )
      } catch (tasksError) {
        console.error('Failed to get tasks for fallback:', tasksError)
        return []
      }
    }
  },

  getFolderContentsCount: async (id: number) => {
    const response = await axiosInstance.get(`/folders/${id}/contents-count`);
    return response.data;
  },

  // Task specific methods
  getTask: async (id: number): Promise<ITask> => {
    const response = await axiosInstance.get(`/tasks/${id}`)
    return response.data
  },
}

export default memoryService
