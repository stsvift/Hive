import axios from 'axios'
import { API_BASE_URL } from '../config/api'
import { getAuthToken } from './auth'

// Only enable in development mode
const isDev = process.env.NODE_ENV === 'development'

// Function to manually test API endpoints - kept but without console logging
export const debugAPI = {
  // Test folder creation
  async testCreateFolder(name: string, parentId?: string) {
    if (!isDev()) return null
    try {
      const token = getAuthToken()
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const data: any = { name }
      if (parentId) {
        data.parentFolderId = parentId
      }

      const response = await axios.post(`${API_BASE_URL}/folders`, data, {
        headers,
      })
      return response.data
    } catch (error) {
      return null
    }
  },

  // Get folders (root level)
  async testGetFolders() {
    if (!isDev()) return []
    try {
      const token = getAuthToken()
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const response = await axios.get(`${API_BASE_URL}/folders`, { headers })
      return response.data
    } catch (error) {
      return []
    }
  },

  // Get specific folder
  async testGetFolder(folderId: string) {
    if (!isDev()) return null
    try {
      const token = getAuthToken()
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const response = await axios.get(`${API_BASE_URL}/folders/${folderId}`, {
        headers,
      })
      return response.data
    } catch (error) {
      return null
    }
  },

  // Добавим специальный метод для проверки parentFolderId
  async testParentFolderCreation(name: string, parentId: string) {
    if (!isDev()) return null
    try {
      const token = getAuthToken()
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      // Тестируем различные варианты отправки parentFolderId

      // Вариант 1: parentFolderId как строка
      const data1 = { name: `${name}-string`, parentFolderId: String(parentId) }
      const response1 = await axios.post(`${API_BASE_URL}/folders`, data1, {
        headers,
      })

      // Вариант 2: parentId вместо parentFolderId
      const data2 = { name: `${name}-parentId`, parentId: parentId }
      const response2 = await axios.post(`${API_BASE_URL}/folders`, data2, {
        headers,
      })

      return {
        test1: response1.data,
        test2: response2.data,
      }
    } catch (error) {
      return null
    }
  },

  // Специальная функция для получения структуры папок
  async getFolderTree() {
    if (!isDev()) return null
    try {
      const token = getAuthToken()
      const headers = { Authorization: `Bearer ${token}` }

      // Получаем все корневые папки
      const rootFolders = await axios.get(`${API_BASE_URL}/folders`, {
        headers,
      })

      // Обходим дерево папок для поиска проблемных записей
      const checkForIssues = (
        folders: any[]
      ): {
        folder: string
        id: string
        parentFolderId: any
        type: string
      }[] => {
        const issues = []

        for (const folder of folders) {
          if (
            folder.parentFolderId &&
            typeof folder.parentFolderId !== 'string'
          ) {
            issues.push({
              folder: folder.name,
              id: folder.id,
              parentFolderId: folder.parentFolderId,
              type: typeof folder.parentFolderId,
            })
          }

          if (folder.subfolders && folder.subfolders.length > 0) {
            issues.push(...checkForIssues(folder.subfolders))
          }
        }

        return issues
      }

      const issues = checkForIssues(rootFolders.data)

      return {
        rootFolders: rootFolders.data,
        issues,
      }
    } catch (error) {
      return null
    }
  },

  // New method to diagnose task-folder relationships
  async checkTaskInFolders(taskId: string) {
    if (!isDev()) return null
    try {
      const token = getAuthToken()
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      // First get the task details
      const taskResponse = await axios.get(`${API_BASE_URL}/tasks/${taskId}`, {
        headers,
      })

      // Then get all folders to search through them
      const foldersResponse = await axios.get(`${API_BASE_URL}/folders`, {
        headers,
      })

      // Recursive function to check all folders and subfolders
      const findTaskInFolder = (
        folder: any
      ): { found: boolean; path: string[] } => {
        let result = { found: false, path: [] }

        // Check items array
        if (Array.isArray(folder.items)) {
          const hasTask = folder.items.some(
            (item: any) =>
              item.type === 'task' &&
              (item.reference === taskId ||
                item.referenceId === taskId ||
                String(item.id) === taskId)
          )

          if (hasTask) {
            return { found: true, path: [folder.name] }
          }
        }

        // Check subfolders recursively
        if (Array.isArray(folder.subfolders)) {
          for (const subfolder of folder.subfolders) {
            const subResult = findTaskInFolder(subfolder)
            if (subResult.found) {
              return {
                found: true,
                path: [folder.name, ...subResult.path],
              }
            }
          }
        }

        return result
      }

      // Search all folders
      const results: { folderId: string; name: string; path: string[] }[] = []

      if (Array.isArray(foldersResponse.data)) {
        for (const folder of foldersResponse.data) {
          const searchResult = findTaskInFolder(folder)
          if (searchResult.found) {
            results.push({
              folderId: folder.id,
              name: folder.name,
              path: searchResult.path,
            })
          }
        }
      }

      return {
        taskId,
        foundInFolders: results,
      }
    } catch (error) {
      return null
    }
  },

  // Method to diagnose and fix tasks in a folder
  async checkAndFixFolderTasks(folderId: string) {
    if (!isDev()) return null
    try {
      const token = getAuthToken()
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      // Step 1: Get the folder data
      const folderResponse = await axios.get(
        `${API_BASE_URL}/folders/${folderId}`,
        {
          headers,
        }
      )

      // Step 2: Count tasks in items array
      const items = folderResponse.data.items || []
      const taskItems = items.filter((item: any) => item.type === 'task')

      // Step 3: Get all tasks and check which ones have this folder ID
      const tasksResponse = await axios.get(`${API_BASE_URL}/tasks`, {
        headers,
      })

      // Find tasks that belong to this folder
      const folderTasks = Array.isArray(tasksResponse.data)
        ? tasksResponse.data.filter(
            (task: any) =>
              task.folderId === folderId ||
              task.folder_id === folderId ||
              task.folderid === folderId
          )
        : []

      // Step 4: Check if these tasks are in the items array
      const missingTasks = folderTasks.filter(
        (task: any) =>
          !taskItems.some(
            item =>
              item.reference === String(task.id) ||
              item.referenceId === String(task.id)
          )
      )

      // Step 5: Try to fix the folder by adding missing tasks
      if (missingTasks.length > 0) {
        for (const task of missingTasks) {
          try {
            await axios.post(
              `${API_BASE_URL}/folders/${folderId}/items`,
              {
                type: 'task',
                referenceId: String(task.id),
              },
              { headers }
            )
          } catch (linkError) {}
        }

        // Check if fix worked
        const updatedFolderResponse = await axios.get(
          `${API_BASE_URL}/folders/${folderId}`,
          {
            headers,
          }
        )

        const updatedItems = updatedFolderResponse.data.items || []
        const updatedTaskItems = updatedItems.filter(
          (item: any) => item.type === 'task'
        )
      }

      return {
        folderTaskCount: folderTasks.length,
        itemsTaskCount: taskItems.length,
        missingTaskCount: missingTasks.length,
        tasks: folderTasks,
      }
    } catch (error) {
      return null
    }
  },
}

export default debugAPI
