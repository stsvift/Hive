import axios from 'axios'
import { IFolder, INote, ITask } from '../types'
import api from './axios.config'

const API_URL = 'http://localhost:5000/api'

export const memoryService = {
  // Folders
  getFolders: async () => {
    try {
      const response = await axios.get(`${API_URL}/folders`)
      return response.data
    } catch (error) {
      console.error('Error fetching folders:', error)
      throw error
    }
  },

  createFolder: async (data: Partial<IFolder>) => {
    // Убедимся что parentFolderId передается даже если null (важно для бэкенда)
    const folderData = {
      ...data,
      parentFolderId:
        data.parentFolderId !== undefined ? data.parentFolderId : null,
    }
    console.log('Creating folder with data:', folderData)
    const response = await api.post<IFolder>('/folders', folderData)
    return response.data
  },

  updateFolder: async (id: number, data: Partial<IFolder>) => {
    const response = await api.put<IFolder>(`/folders/${id}`, data)
    return response.data
  },

  deleteFolder: async (id: number) => {
    await api.delete(`/folders/${id}`)
  },

  // Notes
  getNotes: async () => {
    const response = await api.get<INote[]>('/notes')
    return response.data
  },

  createNote: async (data: Partial<INote>) => {
    const response = await api.post<INote>('/notes', data)
    return response.data
  },

  updateNote: async (id: number, data: Partial<INote>) => {
    const response = await api.put<INote>(`/notes/${id}`, data)
    return response.data
  },

  deleteNote: async (id: number) => {
    await api.delete(`/notes/${id}`)
  },

  // Tasks
  getTasks: async () => {
    const response = await api.get<ITask[]>('/tasks')
    return response.data
  },

  createTask: async (data: Partial<ITask>) => {
    const response = await api.post<ITask>('/tasks', data) // Verify endpoint matches backend
    return response.data
  },

  updateTask: async (id: number, data: Partial<ITask>) => {
    const response = await api.put<ITask>(`/tasks/${id}`, data)
    return response.data
  },

  deleteTask: async (id: number) => {
    await api.delete(`/tasks/${id}`)
  },

  toggleTaskComplete: async (id: number) => {
    const response = await api.patch<ITask>(`/tasks/${id}/toggle`)
    return response.data
  },

  // New methods for folder navigation
  getFolder: async (folderId: number): Promise<IFolder> => {
    try {
      const response = await axios.get(`${API_URL}/folders/${folderId}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching folder ${folderId}:`, error)
      throw error
    }
  },

  getFolderBreadcrumbs: async (id: number): Promise<IFolder[]> => {
    try {
      console.log(`API call: getFolderBreadcrumbs(${id})`)
      const response = await api.get(`/folders/${id}/breadcrumbs`)
      return response.data
    } catch (error) {
      console.error(
        'Breadcrumbs endpoint not available, using fallback:',
        error
      )
      // Fallback implementation: Just return the current folder as the only breadcrumb
      try {
        const folderResponse = await api.get(`/folders/${id}`)
        return [folderResponse.data]
      } catch (folderError) {
        console.error(
          'Failed to get folder for breadcrumb fallback:',
          folderError
        )
        return [] // Return empty array as last resort
      }
    }
  },

  getFolderChildren: async (folderId: number): Promise<IFolder[]> => {
    try {
      const response = await axios.get(`${API_URL}/folders/${folderId}/children`)
      return response.data
    } catch (error) {
      console.error(`Error fetching folder ${folderId} children:`, error)
      throw error
    }
  },

  getFolderNotes: async (id: number): Promise<INote[]> => {
    try {
      console.log(`API call: getFolderNotes(${id})`)
      const response = await api.get(`/folders/${id}/notes`)
      return response.data
    } catch (error) {
      console.error(
        'Folder notes endpoint not available, using fallback:',
        error
      )
      // Fallback: Filter all notes to find those linked to this folder
      try {
        const notesResponse = await api.get('/notes')
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
      const response = await api.get(`/folders/${id}/tasks`)
      return response.data
    } catch (error) {
      console.error(
        'Folder tasks endpoint not available, using fallback:',
        error
      )
      // Fallback: Filter all tasks to find those linked to this folder
      try {
        const tasksResponse = await api.get('/tasks')
        return tasksResponse.data.filter(
          (task: ITask) => task.folderId === id || task.parentFolderId === id
        )
      } catch (tasksError) {
        console.error('Failed to get tasks for fallback:', tasksError)
        return []
      }
    }
  },

  // Task specific methods
  getTask: async (id: number): Promise<ITask> => {
    const response = await api.get(`/tasks/${id}`)
    return response.data
  },
}

export default memoryService
