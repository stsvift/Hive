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
export const stringToPriority = (
  priority: string | undefined | null
): number => {
  if (!priority) return 2 // Default to medium (2)

  const lowerPriority =
    typeof priority === 'string' ? priority.toLowerCase() : ''

  switch (lowerPriority) {
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
      return 'Todo'
    case 'in_progress':
      return 'InProgress'
    case 'done':
      return 'Done'
    default:
      return 'Todo'
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

// Format tags string from the API into an array
export const formatTags = (tagsString: string | null | undefined): string[] => {
  if (!tagsString) return []
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
}

// Join tag array into a string for API submission
export const joinTags = (tags: string[]): string => {
  return tags.join(', ')
}

// Get category icon based on task category
export const getCategoryIcon = (
  category: string | null | undefined
): string => {
  if (!category) return 'tasks'

  switch (category.toLowerCase()) {
    case 'development':
      return 'code'
    case 'design':
      return 'paint-brush'
    case 'bug':
      return 'bug'
    case 'documentation':
      return 'book'
    case 'meeting':
      return 'users'
    case 'planning':
      return 'calendar-alt'
    case 'personal':
      return 'user'
    default:
      return 'tasks'
  }
}

// List of available task categories
export const taskCategories = [
  { id: 'development', name: 'Разработка', icon: 'code' },
  { id: 'design', name: 'Дизайн', icon: 'paint-brush' },
  { id: 'bug', name: 'Баг', icon: 'bug' },
  { id: 'documentation', name: 'Документация', icon: 'book' },
  { id: 'meeting', name: 'Встреча', icon: 'users' },
  { id: 'planning', name: 'Планирование', icon: 'calendar-alt' },
  { id: 'personal', name: 'Личное', icon: 'user' },
  { id: 'other', name: 'Прочее', icon: 'tasks' },
]

// Convert API task model to frontend Task model
export const apiTaskToTaskModel = (apiTask: any): any => {
  if (!apiTask) return null

  let status = statusToString(apiTask.status)
  if (apiTask.isCompleted) {
    status = 'done'
  }

  return {
    id: apiTask.id.toString(),
    title: apiTask.title || '',
    description: apiTask.description || '',
    status,
    priority: priorityToString(apiTask.priority),
    dueDate: apiTask.taskDate,
    tags: formatTags(apiTask.tags),
    category: apiTask.category || 'other',
    createdAt: apiTask.createdAt || new Date().toISOString(),
    folderId: apiTask.folderId,
    estimatedHours: apiTask.estimatedHours,
    actualHours: apiTask.actualHours,
    startTime: apiTask.startTime,
    endTime: apiTask.endTime,
  }
}

// Convert frontend Task model to API task model for create/update operations
export const taskModelToApiTask = (task: any): any => {
  const isCompleted = task.status === 'done'

  // Исправлен метод преобразования статуса
  let status = 'Todo'
  if (task.status === 'in_progress') status = 'InProgress'
  else if (task.status === 'done') status = 'Done'

  // Корректное преобразование приоритета
  let priority = 'Medium'
  if (task.priority === 'low') priority = 'Low'
  else if (task.priority === 'high') priority = 'High'

  // Объединение тегов в строку
  const tags = Array.isArray(task.tags) ? task.tags.join(', ') : task.tags || ''

  // Форматирование даты
  const taskDate = task.dueDate ? task.dueDate : null

  // Добавлено логирование для отладки
  console.log('Converting task to API format:', {
    id: task.id,
    title: task.title,
    status: status,
    priority: priority,
    taskDate: taskDate,
    tags: tags,
    startTime: task.startTime,
    endTime: task.endTime,
  })

  return {
    title: task.title.trim(),
    description: task.description || '',
    isCompleted,
    taskDate,
    status,
    priority,
    category: task.category || null,
    tags,
    folderId: task.folderId || null,
    estimatedHours: task.estimatedHours || null,
    actualHours: task.actualHours || null,
    startTime: task.startTime || null,
    endTime: task.endTime || null,
  }
}

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str: string | null | undefined): string => {
  if (!str) return 'Todo'
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Function to normalize status
export const normalizedStatus = (status: string): string => {
  const statusLower = status.toLowerCase()
  if (statusLower === 'to do' || statusLower === 'todo') return 'todo'
  if (statusLower === 'in progress' || statusLower === 'in_progress')
    return 'in_progress'
  if (
    statusLower === 'done' ||
    statusLower === 'completed' ||
    statusLower === 'complete'
  )
    return 'done'
  return 'todo' // Default to 'todo' if status is unknown
}

// Add new utility functions for validation

// Convert time string (HH:MM) to minutes
export const timeStringToMinutes = (
  timeString: string | null | undefined
): number => {
  if (!timeString) return 0

  const parts = timeString.split(':').map(Number)
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0

  return parts[0] * 60 + parts[1]
}

// Enhanced time validation functions

// Check if an end time is before a start time with more robust checking
export const isEndTimeBeforeStartTime = (
  startTime: string | null | undefined,
  endTime: string | null | undefined
): boolean => {
  // If either time is missing, we can't validate
  if (!startTime || !endTime) return false

  // Parse time strings to get minutes
  const startMinutes = timeStringToMinutes(startTime)
  const endMinutes = timeStringToMinutes(endTime)

  // Return true if end time is earlier than start time
  return endMinutes < startMinutes
}

// Helper function to get readable time format from minutes
export const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}`
}

// Function to suggest valid end time based on start time
export const suggestEndTime = (startTime: string): string => {
  if (!startTime) return ''

  const startMinutes = timeStringToMinutes(startTime)
  // Default meeting/task length: 60 minutes
  const suggestedEndMinutes = startMinutes + 60

  return formatMinutesToTime(suggestedEndMinutes)
}

// More robust date validation function
export const isValidDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false

  try {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  } catch (error) {
    console.error('Invalid date format:', dateString, error)
    return false
  }
}

// Improved function to check if a date is in the past
export const isDateInPast = (
  dateString: string | null | undefined
): boolean => {
  if (!dateString) return false

  try {
    const inputDate = new Date(dateString)
    if (isNaN(inputDate.getTime())) {
      console.warn('Invalid date provided to isDateInPast:', dateString)
      return false
    }

    // Reset time to midnight for proper day comparison
    inputDate.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    console.log('Date comparison:', {
      inputDate: inputDate.toISOString(),
      today: today.toISOString(),
      isPast: inputDate < today,
    })

    return inputDate < today
  } catch (error) {
    console.error('Error in isDateInPast:', error)
    return false
  }
}
