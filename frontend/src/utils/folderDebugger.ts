/**
 * Debugging utilities for folder contents and task relationships
 * These are only active when NODE_ENV is 'development'
 */

import { Folder } from '../api/foldersApi'
import { Task } from '../api/tasksApi'

// Helper to determine if we should log
const isDev = () => process.env.NODE_ENV === 'development'

export const folderDebugger = {
  /**
   * Analyze folder contents and identify potential issues
   */
  analyzeFolderTasks(folder: Folder | null): void {
    if (!isDev()) return
    // Implementation removed to eliminate logging
  },

  /**
   * Check if a task is properly linked to a folder
   */
  checkTaskFolderLink(taskId: string, folder: Folder | null): boolean {
    if (!folder) return false

    // Check in items array
    const inItems =
      Array.isArray(folder.items) &&
      folder.items.some(
        item =>
          item.type === 'task' &&
          (item.reference === taskId || String(item.id) === taskId)
      )

    // Check in alternative sources
    const inAlternative =
      (Array.isArray(folder.tasks) &&
        folder.tasks.some((t: any) => String(t.id) === taskId)) ||
      (Array.isArray(folder.taskItems) &&
        folder.taskItems.some((t: any) => String(t.id) === taskId)) ||
      (Array.isArray((folder as any).content) &&
        (folder as any).content.some(
          (i: any) => i.type === 'task' && String(i.id) === taskId
        ))

    return inItems || inAlternative
  },

  /**
   * Log detailed task information
   */
  logTaskDetails(task: Task | null): void {
    if (!isDev()) return
    // Implementation removed to eliminate logging
  },

  checkFolderTaskConsistency: (folder: any) => {
    if (!folder) {
      return { hasItems: false, issues: ['Folder is null or undefined'] }
    }

    const issues: string[] = []

    // Check items array
    if (!folder.items || !Array.isArray(folder.items)) {
      issues.push('No items array')
    } else {
      // Check tasks
      const tasks = folder.items.filter((item: any) => item.type === 'task')

      // Check for potential issues with task references
      tasks.forEach((task: any) => {
        if (!task.reference && !task.referenceId) {
          issues.push(`Task ${task.id} has no reference or referenceId`)
        }
      })
    }

    return {
      hasItems: folder.items?.length > 0,
      tasks: folder.items?.filter((item: any) => item.type === 'task') || [],
      issues,
    }
  },

  fixMissingItems: (folder: any) => {
    if (!folder) return folder

    const fixedFolder = { ...folder }

    // Ensure items array exists
    if (!fixedFolder.items) {
      fixedFolder.items = []
    }

    return fixedFolder
  },

  // Add this new function to help diagnose why tasks aren't displaying
  findMissingTasks: (folder: any) => {
    if (!folder) {
      return {
        hasItems: false,
        tasks: [],
        issues: ['Folder is null or undefined'],
      }
    }

    const issues: string[] = []
    let allTaskReferences: any[] = []

    // Return basic info without logging
    return {
      hasItems: Array.isArray(folder.items) && folder.items.length > 0,
      tasks: Array.isArray(folder.items)
        ? folder.items.filter(item => item.type === 'task')
        : [],
      issues,
    }
  },

  ensureTasksVisibility: (folder: any) => {
    // Implementation for task visibility preservation
    if (!folder) return folder
    return folder
  },
}
