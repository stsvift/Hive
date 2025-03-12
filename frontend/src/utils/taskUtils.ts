/**
 * Utility functions for task operations
 */

// Map API numeric priority values to string representations with better fallback handling
export const priorityToString = (
  priority: number | string | undefined | null
): 'low' | 'medium' | 'high' => {
  if (priority === undefined || priority === null) {
    return 'medium'
  }

  if (typeof priority === 'string') {
    priority = priority.toLowerCase()
    if (priority === 'low' || priority === 'medium' || priority === 'high') {
      return priority as 'low' | 'medium' | 'high'
    }
    // Try to convert string number to actual number
    const numPriority = parseInt(priority, 10)
    if (!isNaN(numPriority)) {
      priority = numPriority
    } else {
      return 'medium' // Default if string can't be parsed
    }
  }

  // Now priority is a number
  if (priority === 1) return 'low'
  if (priority === 3) return 'high'
  return 'medium' // Default for 2 or any other value
}

// Map string priority values to API numeric values
export const stringToPriority = (priority: string | number): number => {
  if (typeof priority === 'number') {
    if (priority >= 1 && priority <= 3) return priority
    return 2 // Default to medium
  }

  switch (priority.toLowerCase()) {
    case 'low':
      return 1
    case 'high':
      return 3
    case 'medium':
    default:
      return 2
  }
}

// Map API status values to string representations with improved handling
export const statusToString = (
  status: string | undefined | null
): 'todo' | 'in_progress' | 'done' => {
  if (!status) return 'todo'

  const normalizedStatus = String(status).toLowerCase()

  if (
    normalizedStatus.includes('выполн') ||
    normalizedStatus.includes('todo')
  ) {
    return 'todo'
  } else if (
    normalizedStatus.includes('процесс') ||
    normalizedStatus.includes('progress')
  ) {
    return 'in_progress'
  } else if (
    normalizedStatus.includes('заверш') ||
    normalizedStatus.includes('done')
  ) {
    return 'done'
  }

  // More specific checks for exact matches
  switch (normalizedStatus) {
    case 'к выполнению':
    case 'todo':
      return 'todo'
    case 'в процессе':
    case 'in_progress':
      return 'in_progress'
    case 'завершенные':
    case 'завершено':
    case 'done':
      return 'done'
    default:
      return 'todo'
  }
}

// Map string status values to API values
export const stringToStatus = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'todo':
      return 'К выполнению'
    case 'in_progress':
      return 'В процессе'
    case 'done':
      return 'Завершенные'
    default:
      return 'К выполнению'
  }
}

// Get user-friendly status label in Russian
export const getStatusLabel = (status: string): string => {
  const normalizedStatus = statusToString(status)
  switch (normalizedStatus) {
    case 'todo':
      return 'К выполнению'
    case 'in_progress':
      return 'В процессе'
    case 'done':
      return 'Завершенные'
    default:
      return 'К выполнению'
  }
}

// Format date for display
export const formatDate = (date: string | Date): string => {
  if (!date) return ''

  const dateObj = new Date(date)
  return dateObj.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Format datetime for display with better time formatting
export const formatDateTime = (date: string | Date): string => {
  if (!date) return ''

  const dateObj = new Date(date)

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }

  const now = new Date()
  const isToday =
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear()

  // If the date is today, only show time
  if (isToday) {
    return dateObj.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Otherwise show full date and time
  return dateObj.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Добавим новую функцию для проверки принадлежности задачи к папке
export const isTaskInFolder = (
  task: any,
  folderId: string | number
): boolean => {
  if (!task || !folderId) return false

  // Проверяем разные варианты хранения folderId в задаче
  const taskFolderId =
    task.folderId ||
    task.folder_id ||
    task.folderid ||
    task.folderRef ||
    (task.folder && task.folder.id)

  // Также проверяем parentFolderId, который может использоваться в некоторых API
  const taskParentFolderId = task.parentFolderId || task.parent_folder_id

  // Проверяем все возможные соответствия
  return (
    (taskFolderId && String(taskFolderId) === String(folderId)) ||
    (taskParentFolderId && String(taskParentFolderId) === String(folderId))
  )
}

// Добавим функцию для создания глубокой копии задачи с сохранением всех полей
export const cloneTaskWithFolderId = (
  task: any,
  folderId: string | number
): any => {
  if (!task) return null

  // Создаем копию задачи
  const clonedTask = { ...task }

  // Устанавливаем folderId во всех возможных форматах
  clonedTask.folderId = String(folderId)
  clonedTask.folder_id = String(folderId)
  clonedTask.folderid = String(folderId)
  clonedTask.folderRef = String(folderId)

  return clonedTask
}
