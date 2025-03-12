/**
 * Utility functions for handling dates with proper timezone awareness
 */

/**
 * Creates an ISO string from date and time inputs while preserving the intended local time
 * This prevents timezone offset conversions from changing the user-specified time
 *
 * @param dateStr Date string in YYYY-MM-DD format
 * @param timeStr Time string in HH:MM format (optional)
 * @returns ISO string representing the specified local time
 */
export const createLocalISOString = (
  dateStr: string,
  timeStr?: string
): string => {
  if (!dateStr) return ''

  try {
    // Parse the date
    const dateParts = dateStr.split('-').map(Number)

    // Create a date object treating the time as local
    const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])

    // If time is provided, set hours and minutes
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number)
      localDate.setHours(hours, minutes, 0, 0)
    } else {
      // Default to end of day if only date is provided
      localDate.setHours(23, 59, 59, 0)
    }

    // Return ISO string
    return localDate.toISOString()
  } catch (error) {
    console.error('Error creating ISO string from local date:', error)
    return ''
  }
}

/**
 * Extracts the date part from a date object or string for input element
 */
export const formatDateForInput = (date: Date | string): string => {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Get the local date parts
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Extracts the time part from a date object for input element
 */
export const formatTimeForInput = (date: Date | string): string => {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Get local time parts
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

/**
 * Displays a date in user's local format
 */
export const formatDateForDisplay = (date: Date | string | null): string => {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString()
}

/**
 * Displays a date and time in user's local format
 */
export const formatDateTimeForDisplay = (
  date: Date | string | null
): string => {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date
  return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString(
    undefined,
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  )}`
}


// Format date in a readable format
export const formatDate = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date)

  return dateObj.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Get time ago string from date
export const getTimeAgo = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date)
  const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000)

  let interval = seconds / 31536000 // years
  if (interval > 1) {
    return Math.floor(interval) + ' лет назад'
  }

  interval = seconds / 2592000 // months
  if (interval > 1) {
    return Math.floor(interval) + ' месяцев назад'
  }

  interval = seconds / 86400 // days
  if (interval > 1) {
    return Math.floor(interval) + ' дней назад'
  }

  interval = seconds / 3600 // hours
  if (interval > 1) {
    return Math.floor(interval) + ' часов назад'
  }

  interval = seconds / 60 // minutes
  if (interval > 1) {
    return Math.floor(interval) + ' минут назад'
  }

  return 'только что'
}

/**
 * Check if a deadline date is past the current time
 */
export const isDeadlinePast = (deadlineStr: string | Date): boolean => {
  if (!deadlineStr) return false

  try {
    const deadline = new Date(deadlineStr)
    const now = new Date()
    return deadline < now
  } catch (err) {
    console.error('Error comparing deadline dates:', err)
    return false
  }
}

/**
 * Format a date string with the given locale
 */
export const formatLocaleDate = (
  dateStr: string | Date,
  locale: string = 'ru-RU'
): string => {
  if (!dateStr) return ''

  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch (err) {
    console.error('Error formatting date:', err)
    return String(dateStr)
  }
}
