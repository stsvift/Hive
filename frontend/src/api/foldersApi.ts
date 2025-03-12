import { API_ENDPOINTS } from '../config/api'
import api from '../services/api'

export interface FolderItem {
  id: string
  type: 'folder' | 'note' | 'task'
  reference: string
}

export interface Note {
  id: string | number
  title: string
  content: string
  userId: number
  folderId: number | string
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
  description?: string
  color?: string
  userId?: number
  createdAt?: string
  parentFolderId?: string | null
  items?: FolderItem[]
  notes?: Note[]
  subfolders?: Folder[]
  parentId?: string
}

interface CreateFolderData {
  name: string
  description?: string
  color?: string
  parentId?: string
}

// Helper function to handle API errors
const handleError = (error: any): never => {
  console.error('API Error:', error)
  const message =
    error.response?.data?.message || error.message || 'Unknown error occurred'
  throw new Error(message)
}

// Обновляем функцию sanitizeFolderData для правильной обработки иерархии
const sanitizeFolderData = (
  folder: any,
  processedIds: Set<string> = new Set()
): Folder => {
  if (!folder || typeof folder !== 'object') {
    return {
      id: '',
      name: '',
      description: '',
      color: '',
      userId: 0,
      createdAt: '',
      parentFolderId: null,
      items: [],
      notes: [],
      subfolders: [],
      parentId: '',
    }
  }

  // Предотвращаем циклические ссылки
  const folderId = String(folder.id || '')
  if (folderId && processedIds.has(folderId)) {
    console.warn(`Avoiding circular reference for folder ID ${folderId}`)
    return {
      id: '',
      name: '',
      description: '',
      color: '',
      userId: 0,
      createdAt: '',
      parentFolderId: null,
      items: [],
      notes: [],
      subfolders: [],
      parentId: '',
    }
  }

  if (folderId) {
    processedIds.add(folderId)
  }

  console.log('Raw folder data before sanitize:', folder)

  // Проверяем разные варианты полей с подпапками
  const subfolders =
    folder.subfolders ||
    folder.children ||
    folder.childFolders ||
    folder.subFolders ||
    []
  console.log('Found subfolders:', subfolders)

  // Фильтруем подпапки, чтобы избежать циклических ссылок
  const sanitizedSubfolders = Array.isArray(subfolders)
    ? subfolders
        .filter(sub => {
          const subId = sub?.id
          // Удаляем папки, ссылающиеся на себя
          if (subId === folderId) {
            console.warn(`Removing self-reference in subfolder: ${subId}`)
            return false
          }
          return true
        })
        .map(sub => sanitizeFolderData(sub, new Set(processedIds)))
        .filter(Boolean)
    : []

  const sanitizedFolder = {
    id: folderId,
    name: folder.name || '',
    description: folder.description || '',
    parentFolderId: folder.parentFolderId
      ? String(folder.parentFolderId)
      : null,
    createdAt: folder.createdAt || new Date().toISOString(),
    userId: folder.userId,
    color: folder.color,
    notes: Array.isArray(folder.notes) ? folder.notes : [],
    items: Array.isArray(folder.items) ? folder.items : [],
    subfolders: sanitizedSubfolders,
  }

  console.log('Sanitized folder:', sanitizedFolder.id, sanitizedFolder.name)
  return sanitizedFolder
}

// Create a folders API object with methods
export const foldersApi = {
  // Get all folders
  async getFolders(): Promise<Folder[]> {
    try {
      console.log('Fetching folders...')
      const response = await api.get(API_ENDPOINTS.FOLDERS)

      // Handle string response
      let data = response.data
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
          console.log('Parsed string response:', data)
        } catch (e) {
          console.error('Failed to parse response:', data)
          return []
        }
      }

      // Ensure we have an array
      if (!Array.isArray(data)) {
        console.error('Expected array response, got:', typeof data)
        return []
      }

      // Process folders
      const allFolders: Folder[] = data
        .filter(folder => folder && typeof folder === 'object')
        .map(folder => sanitizeFolderData(folder))
        .filter(Boolean)

      console.log('Processed folders:', allFolders.length)

      // Build tree structure
      const { rootFolders } = buildFolderTree(allFolders)
      return rootFolders
    } catch (error: any) {
      console.error('Error fetching folders:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      })
      // Don't throw, return empty array
      return []
    }
  },

  // Get a single folder by ID
  async getFolder(id: string): Promise<Folder> {
    try {
      console.log(`Fetching folder ${id}...`)
      const response = await api.get(`${API_ENDPOINTS.FOLDERS}/${id}`)
      console.log('Main folder response:', response.data)

      // Sanitize and return folder data directly
      const folder = sanitizeFolderData(response.data)

      // If the API doesn't return subfolders, try to fetch them separately
      if (folder && (!folder.subfolders || folder.subfolders.length === 0)) {
        try {
          console.log(`Checking for subfolders of folder ${id}...`)
          // Some APIs provide a separate endpoint for getting subfolders
          const subfoldersResponse = await api.get(
            `${API_ENDPOINTS.FOLDERS}?parentFolderId=${id}`
          )
          if (
            Array.isArray(subfoldersResponse.data) &&
            subfoldersResponse.data.length > 0
          ) {
            folder.subfolders = subfoldersResponse.data
              .map(sub => sanitizeFolderData(sub))
              .filter(Boolean)
            console.log(
              `Found ${folder.subfolders.length} additional subfolders`
            )
          }
        } catch (subfoldersError) {
          console.log(
            'No additional subfolders found or endpoint not supported'
          )
        }
      }

      console.log('Processed folder:', folder)
      return folder
    } catch (error) {
      console.error(`Error fetching folder ${id}:`, error)
      throw error
    }
  },

  // Create a new folder
  async createFolder(data: CreateFolderData): Promise<Folder> {
    try {
      const requestData = {
        name: data.name,
        description: data.description || '',
        // Убедимся, что parentFolderId передается как строка
        ...(data.parentId ? { parentFolderId: String(data.parentId) } : {}),
        // Добавляем поле parentId для API, которые требуют это поле вместо parentFolderId
        ...(data.parentId ? { parentId: String(data.parentId) } : {}),
      }

      console.log('Creating folder with data:', requestData)
      const response = await api.post(API_ENDPOINTS.FOLDERS, requestData)
      return sanitizeFolderData(response.data)
    } catch (error) {
      console.error('Create folder error:', error)
      return handleError(error)
    }
  },

  // Update an existing folder
  async updateFolder(
    id: string,
    data: Partial<CreateFolderData>
  ): Promise<Folder> {
    try {
      const response = await api.put(`${API_ENDPOINTS.FOLDERS}/${id}`, data)
      return response.data
    } catch (error) {
      return handleError(error)
    }
  },

  // Delete a folder
  async deleteFolder(id: string): Promise<void> {
    try {
      await api.delete(`${API_ENDPOINTS.FOLDERS}/${id}`)
    } catch (error) {
      return handleError(error)
    }
  },

  // Add an item (note, task, folder) to a folder
  async addItemToFolder(
    folderId: string,
    item: { type: 'folder' | 'note' | 'task'; referenceId: string | number }
  ): Promise<Folder> {
    try {
      console.log(
        `Adding ${item.type} (ID: ${item.referenceId}) to folder ${folderId}`
      )

      // Пробуем обновить папку напрямую вместо использования специальных эндпоинтов
      // Сначала получим текущую папку
      const currentFolder = await this.getFolder(folderId)
      console.log('Current folder before update:', currentFolder)

      // Создаем или обновляем массив items
      const items = Array.isArray(currentFolder.items)
        ? [...currentFolder.items]
        : []

      // Проверяем, не добавлен ли уже этот элемент
      const existingItem = items.find(
        existing =>
          existing.type === item.type &&
          (existing.reference === String(item.referenceId) ||
            existing.reference === String(item.referenceId))
      )

      if (!existingItem) {
        // Добавляем элемент с уникальным ID и дополнительными полями
        items.push({
          id: `${item.type}-${String(item.referenceId)}`, // Более стабильный ID
          type: item.type,
          reference: String(item.referenceId),
          reference: String(item.referenceId)
        })

        // Обновляем папку с новым списком items
        try {
          console.log('Updating folder with new items list:', items)
          await api.put(`${API_ENDPOINTS.FOLDERS}/${folderId}`, {
            ...currentFolder,
            items,
          })
        } catch (updateError) {
          console.error('Error updating folder directly:', updateError)

          // Если обновление папки не сработало, пробуем старый подход с /content эндпоинтом
          // но используем другой формат данных
          try {
            await api.post(`${API_ENDPOINTS.FOLDERS}/${folderId}/content`, {
              id: String(item.referenceId),
              type: item.type,
              referenceId: String(item.referenceId), // Добавляем для совместимости
            })
          } catch (contentError) {
            console.error('Error with /content endpoint:', contentError)
            // Попытка с альтернативным форматом
            try {
              await api.post(`${API_ENDPOINTS.FOLDERS}/${folderId}/items`, {
                id: String(item.referenceId),
                type: item.type,
                reference: String(item.referenceId),
                referenceId: String(item.referenceId), // Добавляем для совместимости
              })
            } catch (itemsError) {
              console.error('All attempts to add item to folder failed')
              throw itemsError
            }
          }
        }
      } else {
        console.log('Item already exists in folder')
      }

      // Получаем обновленную папку после всех операций
      console.log('Fetching updated folder')
      return await this.getFolder(folderId)
    } catch (error) {
      console.error(`Failed to add ${item.type} to folder:`, {
        folderId,
        item,
        error: (error as any).response?.data || (error as any).message,
      })

      // В случае ошибки добавления - просто возвращаем папку в текущем состоянии
      // вместо выбрасывания исключения, чтобы не прерывать процесс
      try {
        return await this.getFolder(folderId)
      } catch (getFolderError) {
        // Если и эта попытка не удалась, тогда уже выбрасываем исключение
        return handleError(error)
      }
    }
  },

  // Remove an item from a folder
  async removeItemFromFolder(folderId: string, itemId: string): Promise<void> {
    try {
      await api.delete(`${API_ENDPOINTS.FOLDERS}/${folderId}/items/${itemId}`)
    } catch (error) {
      return handleError(error)
    }
  },
}

// Helper function to build folder tree
function buildFolderTree(folders: Folder[]) {
  const folderMap: Record<string, Folder> = {}
  const rootFolders: Folder[] = []

  // First pass: map all folders
  folders.forEach(folder => {
    folderMap[folder.id] = {
      ...folder,
      subfolders: [],
    }
  })

  // Second pass: build tree
  folders.forEach(folder => {
    const current = folderMap[folder.id]
    if (folder.parentFolderId && folderMap[folder.parentFolderId]) {
      const parent = folderMap[folder.parentFolderId]
      if (parent.subfolders) {
        parent.subfolders.push(current)
      }
    } else {
      rootFolders.push(current)
    }
  })

  return { folderMap, rootFolders }
}
