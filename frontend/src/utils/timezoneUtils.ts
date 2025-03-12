/**
 * More accurate timezone handling utilities
 */

/**
 * Creates an ISO string that preserves the specified local time
 * by compensating for timezone offset
 *
 * @param dateStr Date string in YYYY-MM-DD format
 * @param timeStr Time string in HH:MM format (optional)
 * @returns ISO string for the specified time that will display correctly when converted back to local time
 */
export const createTimezoneCompensatedDate = (
  dateStr: string,
  timeStr?: string
): string => {
  if (!dateStr) return ''

  try {
    // Parse the date parts
    const [year, month, day] = dateStr.split('-').map(Number)

    // Parse time or use end of day
    let hours = 23
    let minutes = 59

    if (timeStr) {
      const timeParts = timeStr.split(':').map(Number)
      hours = timeParts[0]
      minutes = timeParts[1]
    }

    // Create a UTC date string with explicit UTC markers
    const utcDateStr = `${year}-${String(month).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(
      minutes
    ).padStart(2, '0')}:00.000Z`

    // Get the timezone offset
    const timezoneOffset = new Date().getTimezoneOffset() // minutes
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60)
    const offsetMinutes = Math.abs(timezoneOffset) % 60

    // Create date with compensation
    const localDate = new Date(utcDateStr)

    // Apply timezone compensation
    if (timezoneOffset > 0) {
      // UTC is behind local time
      localDate.setHours(localDate.getHours() + offsetHours)
      localDate.setMinutes(localDate.getMinutes() + offsetMinutes)
    } else if (timezoneOffset < 0) {
      // UTC is ahead of local time
      localDate.setHours(localDate.getHours() - offsetHours)
      localDate.setMinutes(localDate.getMinutes() - offsetMinutes)
    }

    // Return the ISO string
    return localDate.toISOString()
  } catch (error) {
    console.error('Error in timezone compensation:', error)
    return ''
  }
}

/**
 * Format a date object for display with the user's timezone
 */
export const formatDateTimeWithTimezone = (date: Date | string): string => {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  return dateObj.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}
