/**
 * API Compatibility Helper Functions
 *
 * This file provides functions to handle differences in API implementations
 * and make the frontend more resilient against API changes/inconsistencies.
 */

import { API_ENDPOINTS } from '../config/api'
import api from '../services/api'

/**
 * Creates a cache of API data to avoid repeated API calls
 * that might fail with specific HTTP methods
 */
export class ApiDataCache {
  private static cache: Record<string, any> = {}
  private static timestamps: Record<string, number> = {}
  private static expiryTime = 5 * 60 * 1000 // 5 minutes

  /**
   * Check if cache is valid
   */
  static isValid(key: string): boolean {
    if (!this.cache[key]) return false

    const now = Date.now()
    const timestamp = this.timestamps[key] || 0
    return now - timestamp < this.expiryTime
  }

  /**
   * Get item from cache
   */
  static get(key: string): any {
    return this.isValid(key) ? this.cache[key] : null
  }

  /**
   * Set item in cache
   */
  static set(key: string, data: any): void {
    this.cache[key] = data
    this.timestamps[key] = Date.now()
  }

  /**
   * Clear specific item from cache
   */
  static clear(key: string): void {
    delete this.cache[key]
    delete this.timestamps[key]
  }

  /**
   * Clear entire cache
   */
  static clearAll(): void {
    this.cache = {}
    this.timestamps = {}
  }
}

/**
 * Functions for working with tasks while handling API inconsistencies
 */
export const taskCompat = {
  /**
   * Find a task by ID without using direct GET endpoint
   */
  async findTaskById(id: string): Promise<any> {
    const cacheKey = `task-${id}`

    // Check cache first
    const cachedTask = ApiDataCache.get(cacheKey)
    if (cachedTask) {
      console.log(`Using cached task data for ID ${id}`)
      return cachedTask
    }

    console.log(`Finding task ${id} from all tasks endpoint...`)

    try {
      // Get all tasks and find the matching one
      const response = await api.get(API_ENDPOINTS.TASKS)

      let tasks = []
      if (Array.isArray(response.data)) {
        tasks = response.data
      } else if (response.data?.tasks && Array.isArray(response.data.tasks)) {
        tasks = response.data.tasks
      } else {
        console.warn('Unexpected response format from tasks API')
        return null
      }

      // Find task with matching ID
      const foundTask = tasks.find(task => String(task.id) === String(id))

      if (foundTask) {
        console.log(`Found task ${id} in all tasks response`)
        ApiDataCache.set(cacheKey, foundTask)
        return foundTask
      }

      console.warn(`Task ${id} not found in all tasks response`)
      return null
    } catch (error) {
      console.error(`Error finding task ${id}:`, error)
      return null
    }
  },

  /**
   * Find tasks by folder ID
   */
  async findTasksByFolder(folderId: string): Promise<any[]> {
    const cacheKey = `folder-tasks-${folderId}`

    // Check cache first
    const cachedTasks = ApiDataCache.get(cacheKey)
    if (cachedTasks) {
      console.log(`Using cached tasks for folder ${folderId}`)
      return cachedTasks
    }

    console.log(`Finding tasks for folder ${folderId}...`)

    try {
      // Try dedicated endpoint first
      try {
        const folderTasksResponse = await api.get(`${API_ENDPOINTS.TASKS}`, {
          params: { folderId },
        })

        if (
          Array.isArray(folderTasksResponse.data) &&
          folderTasksResponse.data.length > 0
        ) {
          console.log(
            `Found ${folderTasksResponse.data.length} tasks for folder ${folderId}`
          )
          ApiDataCache.set(cacheKey, folderTasksResponse.data)
          return folderTasksResponse.data
        }
      } catch (specificError) {
        console.warn(`Specific folder tasks query failed:`, specificError)
      }

      // Fall back to filtering all tasks
      const allTasksResponse = await api.get(API_ENDPOINTS.TASKS)

      let tasks = []
      if (Array.isArray(allTasksResponse.data)) {
        tasks = allTasksResponse.data
      } else if (allTasksResponse.data?.tasks) {
        tasks = allTasksResponse.data.tasks
      }

      // Filter tasks by folder ID, checking all possible field names
      const folderTasks = tasks.filter((task: any) => {
        const taskFolderId = task.folderId || task.folder_id || task.folderid
        return String(taskFolderId) === String(folderId)
      })

      console.log(
        `Found ${folderTasks.length} tasks for folder ${folderId} by filtering`
      )
      ApiDataCache.set(cacheKey, folderTasks)
      return folderTasks
    } catch (error) {
      console.error(`Error finding tasks for folder ${folderId}:`, error)
      return []
    }
  },
}

export default { ApiDataCache, taskCompat }
