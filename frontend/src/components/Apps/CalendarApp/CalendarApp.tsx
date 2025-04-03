import React, { useEffect, useState } from 'react'
import { taskService } from '../../../services/taskService'
import { eventBus, EVENTS } from '../../../utils/eventBus'
import { apiTaskToTaskModel } from '../../../utils/taskUtils'
import './CalendarApp.css'

interface Event {
  id: string
  title: string
  date: string // ISO string date
  time?: string
  description?: string
  category: 'meeting' | 'task' | 'reminder' | 'personal'
  sourceId?: string // reference to the original source (like task ID)
  sourceType?: 'task' | 'event' // indicates if this came from tasks or is a native calendar event
}

interface Task {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  tags: string[]
  category?: string
  createdAt: string
  startTime?: string
  endTime?: string
  status: 'todo' | 'in_progress' | 'done'
}

// Добавим новую вспомогательную функцию для определения ширины экрана и оптимизации контента
const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowWidth
}

const CalendarApp: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([
    {
      id: 'event1',
      title: 'Встреча команды',
      date: '2023-10-10',
      time: '10:00',
      description: 'Еженедельный обзор прогресса проекта HiveOS',
      category: 'meeting',
    },
    {
      id: 'event2',
      title: 'Завершить разработку главной страницы',
      date: '2023-10-12',
      category: 'task',
    },
    {
      id: 'event3',
      title: 'Презентация клиенту',
      date: '2023-10-15',
      time: '14:30',
      description: 'Презентация новых функций системы для ключевого клиента',
      category: 'meeting',
    },
    {
      id: 'event4',
      title: 'День рождения Александра',
      date: '2023-10-18',
      category: 'personal',
    },
    {
      id: 'event5',
      title: 'Оплатить счет за сервер',
      date: '2023-10-25',
      category: 'reminder',
    },
  ])
  const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>(
    'month'
  )
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Добавляем флаг для отслеживания первоначальной загрузки
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  // Добавляем состояние для минимального времени загрузки
  const [loadingStartTime, setLoadingStartTime] = useState<number>(Date.now())
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)
  const minimumLoadingTime = 2000 // 2 секунды минимального отображения

  // State to track tasks that have been converted to calendar events
  const [syncedTaskIds, setSyncedTaskIds] = useState<Set<string>>(new Set())

  // Добавляем отслеживание ширины экрана
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768

  // Fetch tasks when component mounts
  useEffect(() => {
    setLoadingStartTime(Date.now()) // Запоминаем время начала загрузки
    fetchTasks()
  }, [])

  // Эффект для контроля минимального времени отображения загрузочного экрана
  useEffect(() => {
    if (!isLoading && showLoadingAnimation) {
      const elapsedTime = Date.now() - loadingStartTime

      if (elapsedTime < minimumLoadingTime) {
        // Если прошло меньше минимального времени, устанавливаем таймер
        const remainingTime = minimumLoadingTime - elapsedTime
        const timer = setTimeout(() => {
          setShowLoadingAnimation(false)
        }, remainingTime)

        return () => clearTimeout(timer)
      } else {
        // Если прошло достаточно времени, скрываем анимацию сразу
        setShowLoadingAnimation(false)
      }
    }
  }, [isLoading, loadingStartTime, showLoadingAnimation])

  // Also refresh tasks when the view or date changes
  useEffect(() => {
    // Refresh tasks when changing views or months to ensure proper date matching
    if (!isLoading) fetchTasks()
  }, [activeView, currentDate.getMonth(), currentDate.getFullYear()])

  // Load tasks from the API and convert them to calendar events
  const fetchTasks = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await taskService.getAllTasks()
      const formattedTasks = response.map(apiTask =>
        apiTaskToTaskModel(apiTask)
      )

      console.log('Fetched tasks:', formattedTasks) // Debug log to see available tasks

      // Convert tasks to calendar events
      const taskEvents: Event[] = formattedTasks
        .filter(task => task.dueDate) // Only include tasks with due dates
        .map(task => {
          // Make sure the date format is standardized (YYYY-MM-DD)
          const standardDate = formatDateToStandard(task.dueDate as string)

          console.log(
            `Task ${task.id} with date ${task.dueDate} standardized to ${standardDate}`
          ) // Debug log

          return {
            id: `task-${task.id}`,
            title: task.title,
            date: standardDate,
            time: formatTimeRange(task.startTime, task.endTime),
            description: task.description,
            category: 'task',
            sourceId: task.id,
            sourceType: 'task',
          }
        })

      // Create a new set of synced task IDs
      const newSyncedTasks = new Set<string>()
      formattedTasks
        .filter(task => task.dueDate)
        .forEach(task => newSyncedTasks.add(task.id))

      setSyncedTaskIds(newSyncedTasks)

      // Merge existing calendar events with task events
      // (Keep only non-task events from the current events array)
      const calendarEvents = events.filter(event => event.sourceType !== 'task')

      const mergedEvents = [...calendarEvents, ...taskEvents]
      console.log('All calendar events after merge:', mergedEvents) // Debug log

      setEvents(mergedEvents)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setError('Failed to load tasks. Please try again later.')
    } finally {
      setIsLoading(false)
      // Устанавливаем флаг, что первоначальная загрузка завершена
      setInitialLoadComplete(true)
    }
  }

  // Function to standardize date format
  const formatDateToStandard = (dateString?: string): string => {
    if (!dateString) return ''

    try {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString
      }

      // Parse the date - handle different formats
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString)
        return ''
      }

      // Format as YYYY-MM-DD
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')

      return `${year}-${month}-${day}`
    } catch (error) {
      console.error('Error formatting date:', error)
      return ''
    }
  }

  // Update the function for finding events for a specific day to be more robust and sort by time
  const getEventsForDay = (date: Date) => {
    // Format the date as YYYY-MM-DD for comparison
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`

    // Filter events for this date
    const matchingEvents = events.filter(event => {
      const match = event.date === dateString
      if (dateString === '2024-03-29' || event.date === '2024-03-29') {
        console.log(
          `Comparing: ${event.date} with ${dateString}, match: ${match}`,
          event
        )
      }
      return match
    })

    // Sort events by time
    return matchingEvents.sort((a, b) => {
      // If no time is set, put the event at the end
      if (!a.time && !b.time) return 0
      if (!a.time) return 1
      if (!b.time) return -1

      // Get numeric start times for comparison
      const [aStart] = getEventStartAndEndTime(a)
      const [bStart] = getEventStartAndEndTime(b)

      return aStart - bStart
    })
  }

  // Fix the task event update function to ensure dates are standardized
  const updateTaskEvent = (task: Task) => {
    if (!task.dueDate) {
      // If the task no longer has a due date, remove it from calendar
      removeTaskEvent(task.id)
      return
    }

    const standardDate = formatDateToStandard(task.dueDate)
    if (!standardDate) {
      console.warn(`Invalid date for task ${task.id}: ${task.dueDate}`)
      return
    }

    setEvents(prev => {
      // Find if the task is already in the calendar
      const eventIndex = prev.findIndex(
        e => e.sourceId === task.id && e.sourceType === 'task'
      )

      if (eventIndex >= 0) {
        // Update existing event
        const newEvents = [...prev]
        newEvents[eventIndex] = {
          ...newEvents[eventIndex],
          title: task.title,
          date: standardDate,
          time: formatTimeRange(task.startTime, task.endTime),
          description: task.description,
        }
        return newEvents
      } else {
        // Add new event for this task
        const newEvent: Event = {
          id: `task-${task.id}`,
          title: task.title,
          date: standardDate,
          time: formatTimeRange(task.startTime, task.endTime),
          description: task.description,
          category: 'task',
          sourceId: task.id,
          sourceType: 'task',
        }

        // Add to synced tasks set
        setSyncedTaskIds(prev => new Set(prev).add(task.id))

        return [...prev, newEvent]
      }
    })
  }

  // Update the addTaskAsEvent function to use standardized dates
  const addTaskAsEvent = (task: Task) => {
    if (!task.dueDate) return // Skip tasks without due dates

    const standardDate = formatDateToStandard(task.dueDate)
    if (!standardDate) {
      console.warn(`Invalid date for task ${task.id}: ${task.dueDate}`)
      return
    }

    if (syncedTaskIds.has(task.id)) {
      // Task is already in the calendar, update it instead
      updateTaskEvent(task)
      return
    }

    // Convert task to event
    const newEvent: Event = {
      id: `task-${task.id}`,
      title: task.title,
      date: standardDate,
      time: formatTimeRange(task.startTime, task.endTime),
      description: task.description,
      category: 'task',
      sourceId: task.id,
      sourceType: 'task',
    }

    // Add to events and mark as synced
    setEvents(prev => [...prev, newEvent])
    setSyncedTaskIds(prev => new Set(prev).add(task.id))
  }

  // Subscribe to task updates
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(EVENTS.TASKS_UPDATED, data => {
      handleTasksUpdated(data)
    })

    // Clean up subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [events, syncedTaskIds])

  // Handle task updates from the event bus
  const handleTasksUpdated = (data: any) => {
    switch (data.action) {
      case 'create':
        addTaskAsEvent(data.task)
        break
      case 'update':
        updateTaskEvent(data.task)
        break
      case 'delete':
        removeTaskEvent(data.task.id)
        break
      case 'batch-update':
        if (Array.isArray(data.tasks)) {
          data.tasks.forEach((task: Task) => updateTaskEvent(task))
        }
        break
    }
  }

  // Remove a task event
  const removeTaskEvent = (taskId: string) => {
    setEvents(prev =>
      prev.filter(e => !(e.sourceId === taskId && e.sourceType === 'task'))
    )
    setSyncedTaskIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(taskId)
      return newSet
    })
  }

  // Helper function to format time range
  const formatTimeRange = (startTime?: string, endTime?: string): string => {
    if (startTime && endTime) {
      // Both start and end time exist, format as range
      return `${formatTimeOnly(startTime)} - ${formatTimeOnly(endTime)}`
    } else if (startTime) {
      // Only start time exists
      return formatTimeOnly(startTime)
    }
    return ''
  }

  // Helper function to format time as HH:MM
  const formatTimeOnly = (timeString?: string): string => {
    if (!timeString) return ''

    try {
      // If already in HH:MM format, return as is
      if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        return timeString
      }

      // If in HH:MM:SS format, remove seconds
      if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeString)) {
        return timeString.substring(0, 5)
      }

      // Try to parse as a date+time string
      const date = new Date(timeString)
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      }

      return timeString
    } catch (error) {
      console.error('Error formatting time:', error)
      return timeString
    }
  }

  // Calculate event duration in hours
  const calculateEventDuration = (
    startTime?: string,
    endTime?: string
  ): number => {
    if (!startTime || !endTime) return 1 // Default to 1 hour if no time range specified

    try {
      const startHours = getHoursFromTimeString(startTime)
      const endHours = getHoursFromTimeString(endTime)

      // Ensure we have valid times
      if (isNaN(startHours) || isNaN(endHours)) return 1

      // Calculate duration (minimum of 15 minutes)
      const duration = Math.max(endHours - startHours, 0.25)
      return duration
    } catch (error) {
      console.error('Error calculating event duration:', error)
      return 1 // Default duration
    }
  }

  // Helper to extract hours as decimal from time string
  const getHoursFromTimeString = (timeString: string): number => {
    // Handle time range format by extracting first time
    if (timeString.includes(' - ')) {
      timeString = timeString.split(' - ')[0].trim()
    }

    // Extract hours and minutes
    const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    const match = timeString.match(timeRegex)

    if (match) {
      const hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      return hours + minutes / 60
    }

    // Try alternative parsing as fallback
    const [hours, minutes] = timeString.split(':').map(Number)
    if (!isNaN(hours) && !isNaN(minutes)) {
      return hours + minutes / 60
    }

    throw new Error(`Invalid time format: ${timeString}`)
  }

  // Group events that overlap in time - improved algorithm
  const groupOverlappingEvents = (events: Event[]): Event[][] => {
    if (events.length === 0) return []

    // Sort events by start time, then by duration (shorter events first)
    const sortedEvents = [...events].sort((a, b) => {
      const aTime = a.time ? getHoursFromTimeString(a.time) : 0
      const bTime = b.time ? getHoursFromTimeString(b.time) : 0

      if (aTime !== bTime) return aTime - bTime

      // If same start time, sort by duration (shorter first)
      const [, aEndTime] = getEventStartAndEndTime(a)
      const [, bEndTime] = getEventStartAndEndTime(b)
      const aDuration = aEndTime - aTime
      const bDuration = bTime - aTime

      return aDuration - bDuration
    })

    // For advanced collision detection, we track overlapping events
    const groups: Event[][] = []
    const eventTimeRanges = new Map<string, [number, number]>()

    // Get time ranges for all events
    sortedEvents.forEach(event => {
      const [start, end] = getEventStartAndEndTime(event)
      eventTimeRanges.set(event.id, [start, end])
    })

    // For each event, find all events it overlaps with
    const overlapSets: Event[][] = []

    sortedEvents.forEach((event, i) => {
      const [eventStart, eventEnd] = eventTimeRanges.get(event.id) || [0, 0]

      // Check if this event belongs to any existing set
      let foundSet = false
      for (const set of overlapSets) {
        // Check if this event overlaps with any event in the set
        const overlapsWithSet = set.some(setEvent => {
          const [setEventStart, setEventEnd] = eventTimeRanges.get(
            setEvent.id
          ) || [0, 0]
          return eventStart < setEventEnd && setEventStart < eventEnd
        })

        if (overlapsWithSet) {
          set.push(event)
          foundSet = true
          break
        }
      }

      // If no existing set contains this event, create a new set
      if (!foundSet) {
        overlapSets.push([event])
      }
    })

    // Merge sets that have common events
    let changed = true
    while (changed) {
      changed = false
      for (let i = 0; i < overlapSets.length; i++) {
        for (let j = i + 1; j < overlapSets.length; j++) {
          // Check if sets share any events
          const setA = overlapSets[i]
          const setB = overlapSets[j]

          const hasCommonEvent = setA.some(eventA =>
            setB.some(eventB => eventA.id === eventB.id)
          )

          if (hasCommonEvent) {
            // Merge sets
            overlapSets[i] = Array.from(new Set([...setA, ...setB]))
            // Remove the second set
            overlapSets.splice(j, 1)
            changed = true
            break
          }
        }
        if (changed) break
      }
    }

    return overlapSets
  }

  // Check if two events overlap in time
  const eventsOverlap = (event1: Event, event2: Event): boolean => {
    if (!event1.time || !event2.time) return false

    try {
      // Extract start and end times
      const [startTime1, endTime1] = getEventStartAndEndTime(event1)
      const [startTime2, endTime2] = getEventStartAndEndTime(event2)

      // Events overlap if one starts before the other ends
      return startTime1 < endTime2 && startTime2 < endTime1
    } catch (error) {
      console.error('Error checking event overlap:', error)
      return false
    }
  }

  // Extract start and end times from an event
  const getEventStartAndEndTime = (event: Event): [number, number] => {
    if (!event.time) return [0, 1] // Default 1 hour duration

    // Handle time range format: "11:00 - 12:00"
    if (event.time.includes(' - ')) {
      const [startStr, endStr] = event.time.split(' - ').map(t => t.trim())
      const start = getHoursFromTimeString(startStr)
      const end = getHoursFromTimeString(endStr)
      return [start, end]
    }

    // Single time format: "11:00" - assume 1 hour duration
    const start = getHoursFromTimeString(event.time)
    return [start, start + 1]
  }

  // Получаем время события для отображения в сетке с улучшенным форматированием
  const getEventTimePosition = (time?: string) => {
    if (!time) return 0

    try {
      // Check for time range format like "11:00 - 12:00"
      if (time.includes(' - ')) {
        // Use the start time from the range
        time = time.split(' - ')[0].trim()
      }

      return getHoursFromTimeString(time)
    } catch (error) {
      console.error('Error parsing time for event positioning:', error, time)
      return 0
    }
  }

  // Получение количества дней в месяце
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Получение названия месяца
  const getMonthName = (date: Date) => {
    return date.toLocaleString('ru-RU', { month: 'long' })
  }

  // Получение дня недели для первого дня месяца (0 - воскресенье, 1 - понедельник и т.д.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Построение массива дней для календаря
  const buildCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    // Преобразуем день недели так, чтобы понедельник был первым днем (0)
    const firstDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

    // Дни предыдущего месяца
    const daysInPrevMonth = getDaysInMonth(year, month - 1)

    const days = []

    // Добавляем дни из предыдущего месяца
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i)
      // Create date at noon to avoid timezone issues
      prevDate.setHours(12, 0, 0, 0)
      days.push({
        date: prevDate,
        isCurrentMonth: false,
      })
    }

    // Добавляем дни текущего месяца
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i)
      // Create date at noon to avoid timezone issues
      currentDate.setHours(12, 0, 0, 0)
      days.push({
        date: currentDate,
        isCurrentMonth: true,
      })
    }

    // Добавляем дни следующего месяца, чтобы заполнить сетку
    const remainingDays = 42 - days.length // 6 рядов по 7 дней
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i)
      // Create date at noon to avoid timezone issues
      nextDate.setHours(12, 0, 0, 0)
      days.push({
        date: nextDate,
        isCurrentMonth: false,
      })
    }

    return days
  }

  // Форматирование даты в строку
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Форматирование даты для недельного и дневного представления
  const formatViewDate = () => {
    if (activeView === 'month') {
      return `${getMonthName(currentDate)} ${currentDate.getFullYear()}`
    } else if (activeView === 'week') {
      // Находим первый и последний день недели
      const startOfWeek = new Date(currentDate)
      const day = currentDate.getDay()
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1) // Коррекция для недели, начинающейся с понедельника
      startOfWeek.setDate(diff)

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      // Форматируем даты
      const startMonth = startOfWeek.toLocaleString('ru-RU', { month: 'long' })
      const endMonth = endOfWeek.toLocaleString('ru-RU', { month: 'long' })

      if (startMonth === endMonth) {
        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${startMonth} ${currentDate.getFullYear()}`
      } else {
        return `${startOfWeek.getDate()} ${startMonth} - ${endOfWeek.getDate()} ${endMonth} ${currentDate.getFullYear()}`
      }
    } else {
      // Day view
      return formatDate(currentDate)
    }
  }

  // Переключение на предыдущий период (месяц/неделя/день)
  const prevPeriod = () => {
    const newDate = new Date(currentDate)
    if (activeView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (activeView === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
    if (activeView === 'day') {
      setSelectedDay(newDate)
    }
  }

  // Переключение на следующий период (месяц/неделя/день)
  const nextPeriod = () => {
    const newDate = new Date(currentDate)
    if (activeView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (activeView === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
    if (activeView === 'day') {
      setSelectedDay(newDate)
    }
  }

  // Переключение на текущий день
  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDay(today)
  }

  // Получение дней недели
  const buildWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    const day = currentDate.getDay()
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1) // Корректируем для недели с понедельника
    startOfWeek.setDate(diff)

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }

    return days
  }

  // Получение массива часов для дневного представления - вернем к простому формату
  const getHoursArray = () => {
    const hours = []
    for (let i = 0; i < 24; i++) {
      hours.push(i)
    }
    return hours
  }

  // Получение класса для категории события
  const getCategoryClass = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'event-meeting'
      case 'task':
        return 'event-task'
      case 'reminder':
        return 'event-reminder'
      case 'personal':
        return 'event-personal'
      default:
        return ''
    }
  }

  // Получение иконки для категории события
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meeting':
        return 'users'
      case 'task':
        return 'tasks'
      case 'reminder':
        return 'bell'
      case 'personal':
        return 'user'
      default:
        return 'calendar'
    }
  }

  // Проверка на текущий день
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Модифицируем функцию для отображения названий дней недели с учетом мобильного устройства
  const getWeekdayLabel = (day: string, index: number) => {
    // На мобильных устройствах используем более короткие обозначения для дней недели
    if (isMobile) {
      const shortDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
      return shortDays[index]
    }
    return day
  }

  const calendarDays = buildCalendarDays()
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  const weekDays = buildWeekDays()
  const hours = getHoursArray()

  // Формат времени для отображения
  const formatTimeLabel = (hour: number) => {
    return `${hour}:00`
  }

  // Улучшенная функция для расположения событий рядом, как в Google Calendar
  const layoutEventsInGroup = (
    eventGroup: Event[]
  ): { event: Event; col: number; cols: number }[] => {
    if (eventGroup.length === 0) return []
    if (eventGroup.length === 1)
      return [{ event: eventGroup[0], col: 0, cols: 1 }]

    // Сортируем события по времени начала
    const sortedEvents = [...eventGroup].sort((a, b) => {
      const [aStart, aEnd] = getEventStartAndEndTime(a)
      const [bStart, bEnd] = getEventStartAndEndTime(b)

      // Сначала по времени начала
      if (aStart !== bStart) return aStart - bStart

      // Если начало одинаковое, более длинные события идут первыми
      return bEnd - bStart - (aEnd - aStart)
    })

    // Отслеживаем, до какого времени занята каждая колонка
    const columns: number[] = []
    const layout: { event: Event; col: number; cols: number }[] = []

    // Размещаем каждое событие в первой доступной колонке
    for (const event of sortedEvents) {
      const [start, end] = getEventStartAndEndTime(event)
      let placed = false

      // Пробуем разместить в существующих колонках
      for (let col = 0; col < columns.length; col++) {
        if (start >= columns[col]) {
          // Размещаем событие в этой колонке
          columns[col] = end
          layout.push({ event, col, cols: 0 }) // Количество колонок установим позже
          placed = true
          break
        }
      }

      // Если не смогли разместить в существующих колонках, создаем новую
      if (!placed) {
        columns.push(end)
        layout.push({ event, col: columns.length - 1, cols: 0 })
      }
    }

    // Устанавливаем общее количество колонок для каждого события
    layout.forEach(item => {
      item.cols = columns.length
    })

    return layout
  }

  // Полностью новый алгоритм для размещения событий в сетке календаря
  const layoutEvents = (
    events: Event[]
  ): { event: Event; column: number; totalColumns: number }[] => {
    if (events.length === 0) return []
    if (events.length === 1)
      return [{ event: events[0], column: 0, totalColumns: 1 }]

    // Сортируем по времени начала, затем по продолжительности
    const sortedEvents = [...events].sort((a, b) => {
      const [aStart] = getEventStartAndEndTime(a)
      const [bStart] = getEventStartAndEndTime(b)

      // Сначала сортировка по времени начала
      if (aStart !== bStart) return aStart - bStart

      // Затем по продолжительности (длинные первыми)
      const [, aEnd] = getEventStartAndEndTime(a)
      const [, bEnd] = getEventStartAndEndTime(b)

      return bEnd - bStart - (aEnd - aStart)
    })

    // Определяем временные интервалы для размещения событий
    type TimeSlot = {
      start: number
      end: number
      events: Event[]
    }

    // Определяем наложения для создания интервалов
    let timeSlots: TimeSlot[] = []
    let eventTimeRanges = new Map<string, [number, number]>()

    // Получаем диапазоны времени для всех событий
    sortedEvents.forEach(event => {
      const [start, end] = getEventStartAndEndTime(event)
      eventTimeRanges.set(event.id, [start, end])
    })

    // Определяем все точки изменения (начало или конец любого события)
    let changePoints = new Set<number>()
    eventTimeRanges.forEach(([start, end]) => {
      changePoints.add(start)
      changePoints.add(end)
    })

    // Сортируем точки изменения
    const sortedPoints = Array.from(changePoints).sort((a, b) => a - b)

    // Создаем временные слоты между точками изменения
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const start = sortedPoints[i]
      const end = sortedPoints[i + 1]

      // Находим все события, которые активны в этом интервале
      const activeEvents = sortedEvents.filter(event => {
        const [eventStart, eventEnd] = eventTimeRanges.get(event.id) || [0, 0]
        // Событие активно, если оно начинается до конца интервала и заканчивается после начала интервала
        return eventStart < end && eventEnd > start
      })

      if (activeEvents.length > 0) {
        timeSlots.push({ start, end, events: activeEvents })
      }
    }

    // Определяем, сколько событий максимально происходит одновременно
    const maxConcurrent = Math.max(...timeSlots.map(slot => slot.events.length))

    // Создаем сетку для размещения событий
    const grid: (string | null)[][] = Array(maxConcurrent)
      .fill(null)
      .map(() => Array(timeSlots.length).fill(null))

    // Размещаем события в сетке
    const eventPositions = new Map<string, { column: number; span: number }>()

    // Для каждого события находим подходящую колонку
    sortedEvents.forEach(event => {
      const [eventStart, eventEnd] = eventTimeRanges.get(event.id) || [0, 0]

      // Найдем все слоты, в которых присутствует это событие
      const eventSlots = timeSlots.filter(slot =>
        slot.events.some(e => e.id === event.id)
      )

      if (eventSlots.length === 0) return

      // Найдем первую свободную колонку для этого события
      let columnIndex = 0
      let found = false

      while (!found && columnIndex < maxConcurrent) {
        // Проверяем, свободна ли эта колонка во всех слотах события
        const isFree = eventSlots.every((_, slotIndex) => {
          const slotEventIds = timeSlots[slotIndex].events.map(e => e.id)
          const slotContainsEvent = slotEventIds.includes(event.id)

          // Если слот содержит событие, проверяем, свободна ли колонка
          if (slotContainsEvent) {
            return (
              grid[columnIndex][slotIndex] === null ||
              grid[columnIndex][slotIndex] === event.id
            )
          }
          return true
        })

        if (isFree) {
          found = true
        } else {
          columnIndex++
        }
      }

      // Если нашли колонку, размещаем событие
      if (found) {
        eventSlots.forEach((_, index) => {
          const slotIndex = timeSlots.findIndex(slot =>
            slot.events.some(e => e.id === event.id)
          )
          if (slotIndex >= 0) {
            grid[columnIndex][slotIndex] = event.id
          }
        })

        eventPositions.set(event.id, { column: columnIndex, span: 1 })
      }
    })

    return sortedEvents.map(event => ({
      event,
      column: eventPositions.get(event.id)?.column || 0,
      totalColumns: maxConcurrent,
    }))
  }

  // Полностью новая функция для определения пересечений событий по времени
  const doEventsOverlap = (event1: Event, event2: Event): boolean => {
    if (!event1.time || !event2.time) return false

    const [start1, end1] = getEventStartAndEndTime(event1)
    const [start2, end2] = getEventStartAndEndTime(event2)

    // События пересекаются, если одно начинается до того, как другое заканчивается
    // Добавляем буфер в 1 минуту (0.016 часа), чтобы события, идущие почти встык, не считались пересекающимися
    const buffer = 0.016 // ~1 минута
    return start1 < end2 - buffer && start2 < end1 - buffer
  }

  // Новая функция для группировки событий
  const organizeEvents = (events: Event[]): Event[][] => {
    if (events.length === 0) return []

    // Сортируем события по времени начала
    const sortedEvents = [...events].sort((a, b) => {
      const [aStart] = getEventStartAndEndTime(a)
      const [bStart] = getEventStartAndEndTime(b)
      return aStart - bStart
    })

    // Группы непересекающихся событий (колонки)
    const columns: Event[][] = []

    // Для каждого события ищем подходящую колонку
    sortedEvents.forEach(event => {
      // Попробуем найти существующую колонку, где нет пересечений
      let placed = false

      for (const column of columns) {
        // Проверяем, пересекается ли текущее событие с последним событием в колонке
        const lastEvent = column[column.length - 1]
        if (!doEventsOverlap(lastEvent, event)) {
          column.push(event)
          placed = true
          break
        }
      }

      // Если не нашли подходящую колонку, создаем новую
      if (!placed) {
        columns.push([event])
      }
    })

    return columns
  }

  // Функция для точного расчета времени и продолжительности события
  const calculateEventTiming = (
    event: Event
  ): { top: number; height: number } => {
    const [start, end] = getEventStartAndEndTime(event)

    // Вычисляем точную позицию и высоту в пикселях
    const top = start * 60 // 60px на час
    const height = Math.max((end - start) * 60, 20) // минимальная высота 20px

    return { top, height }
  }

  // Полностью переработанная функция размещения событий в каскадном стиле
  const createCascadingEventLayout = (
    events: Event[]
  ): { event: Event; offset: number; total: number }[] => {
    if (events.length === 0) return []
    if (events.length === 1) return [{ event: events[0], offset: 0, total: 1 }]

    // Сортируем события по времени начала, затем по продолжительности
    const sortedEvents = [...events].sort((a, b) => {
      const [aStart, aEnd] = getEventStartAndEndTime(a)
      const [bStart, bEnd] = getEventStartAndEndTime(b)

      // Сначала по времени начала
      if (aStart !== bStart) return aStart - bStart

      // Если время начала одинаковое, сортируем по продолжительности (короткие первыми)
      return aEnd - aStart - (bEnd - bStart)
    })

    // Группируем близкие по времени события (разница менее 10 минут)
    const cascadingGroups: Event[][] = []
    let currentGroup: Event[] = [sortedEvents[0]]

    for (let i = 1; i < sortedEvents.length; i++) {
      const prevEvent = sortedEvents[i - 1]
      const currentEvent = sortedEvents[i]

      const [, prevEnd] = getEventStartAndEndTime(prevEvent)
      const [currentStart] = getEventStartAndEndTime(currentEvent)

      // Если между событиями меньше 10 минут (0.167 часа), считаем их последовательными
      const timeDiff = currentStart - prevEnd
      if (timeDiff < 0.167 && timeDiff > -0.167) {
        // Добавляем в текущую каскадную группу
        currentGroup.push(currentEvent)
      } else {
        // Если разрыв больше, начинаем новую группу
        cascadingGroups.push([...currentGroup])
        currentGroup = [currentEvent]
      }
    }

    // Добавляем последнюю группу
    if (currentGroup.length > 0) {
      cascadingGroups.push(currentGroup)
    }

    // Создаем финальный макет с учетом смещений для каскадного отображения
    const layout: { event: Event; offset: number; total: number }[] = []

    cascadingGroups.forEach(group => {
      group.forEach((event, index) => {
        layout.push({
          event,
          offset: index, // Порядковый номер в группе определяет смещение
          total: group.length, // Общее количество событий в группе
        })
      })
    })

    return layout
  }

  // Функция для расчета фактических пикселей и CSS-свойств для событий
  const getCascadingEventStyle = (
    event: Event,
    offset: number,
    total: number
  ) => {
    const [start, end] = getEventStartAndEndTime(event)
    const duration = end - start

    // Базовая высота и позиция
    const top = start * 60 // 60px на час

    // Минимальная высота 24px для всех типов событий
    const height = Math.max(duration * 60, 24)

    // Каскадное смещение только для не-задач
    const offsetStep = 12 // Шаг смещения в пикселях
    const marginLeft = event.category === 'task' ? 0 : offset * offsetStep

    // Ширина для задач фиксированная
    const width =
      event.category === 'task'
        ? '60%' // Задачи будут занимать 60% от ширины колонки
        : `calc(100% - ${marginLeft + 16}px)`

    // Затемнение только для не-задач
    const opacity = event.category === 'task' ? 1 : 1 - offset * 0.07

    // Z-index, чтобы последние события были поверх
    const zIndex = 10 + (total - offset)

    return {
      top: `${top}px`,
      height: `${height}px`, // Используем динамическую высоту для всех типов событий
      marginLeft: `${marginLeft}px`,
      width,
      opacity,
      zIndex,
    }
  }

  // Новая функция для расчета высоты часа в зависимости от масштаба
  const getHourHeight = () => {
    return 60 // Always 60px fixed height
  }

  // Новая функция для группировки событий по временным слотам
  const groupEventsByTimeSlots = (
    events: Event[]
  ): { slot: number; events: Event[] }[] => {
    // Если нет событий, возвращаем пустой массив
    if (events.length === 0) return []

    // Сортируем события по времени начала
    const sortedEvents = [...events].sort((a, b) => {
      const [aStart] = getEventStartAndEndTime(a)
      const [bStart] = getEventStartAndEndTime(b)
      return aStart - bStart
    })

    // Группируем события в 30-минутные слоты (0.5 часа)
    const slots: { [key: string]: Event[] } = {}

    // Для каждого события определяем временной слот
    sortedEvents.forEach(event => {
      const [startTime] = getEventStartAndEndTime(event)
      // Округляем до ближайшего получаса для группировки
      const slotKey = Math.floor(startTime * 2) / 2

      if (!slots[slotKey]) {
        slots[slotKey] = []
      }

      slots[slotKey].push(event)
    })

    // Преобразуем объект в массив с сортировкой по времени слота
    return Object.entries(slots)
      .map(([slotKey, events]) => ({
        slot: parseFloat(slotKey),
        events,
      }))
      .sort((a, b) => a.slot - b.slot)
  }

  // Обновленная функция для рендеринга событий без наложений
  const renderEvents = (dayEvents: Event[]) => {
    if (dayEvents.length === 0) return null

    // Сортируем события по времени начала
    const sortedEvents = [...dayEvents].sort((a, b) => {
      const [aStart] = getEventStartAndEndTime(a)
      const [bStart] = getEventStartAndEndTime(b)
      return aStart - bStart
    })

    // Создаем временные слоты для более чистого отображения
    const timeSlots: { [key: number]: Event[] } = {}

    // Группируем события по дискретным временным слотам (с шагом в 15 минут = 0.25 часа)
    sortedEvents.forEach(event => {
      const [startTime] = getEventStartAndEndTime(event)
      // Округляем до ближайших 15 минут для группировки
      const slotKey = Math.floor(startTime * 4) / 4

      if (!timeSlots[slotKey]) {
        timeSlots[slotKey] = []
      }

      timeSlots[slotKey].push(event)
    })

    // Функция для проверки, пересекается ли событие с каким-либо из уже созданных визуальных блоков
    const intersectsWithExisting = (
      event: Event,
      timePosition: number,
      existingBlocks: { end: number }[]
    ) => {
      const [start, end] = getEventStartAndEndTime(event)
      return existingBlocks.some(
        block =>
          // Проверяем перекрытие времени + учитываем визуальную высоту блока
          timePosition < block.end &&
          timePosition + (end - start) * getHourHeight() > block.end - 30
      )
    }

    // Очередь блоков, которые мы уже отрисовали (хранит конечное время + визуальную высоту)
    const renderedBlocks: { end: number }[] = []
    const elements: JSX.Element[] = []

    // Проходим по всем временным слотам
    Object.entries(timeSlots).forEach(([slotKey, events]) => {
      const slotTime = parseFloat(slotKey)
      const basePosition = slotTime * getHourHeight()

      // Отрендерим события внутри слота
      events.forEach((event, index) => {
        const [startTime, endTime] = getEventStartAndEndTime(event)
        const duration = endTime - startTime

        // Рассчитываем визуальную высоту (минимум 30px)
        const height = Math.max(duration * getHourHeight(), 30)

        // Начальная позиция события с учетом времени
        let top = basePosition

        // Смещаем события в слоте, чтобы избежать наложений
        if (intersectsWithExisting(event, top, renderedBlocks)) {
          // Найдем подходящую позицию ниже последнего пересекающегося блока
          const lastIntersecting = renderedBlocks
            .filter(block => top < block.end)
            .sort((a, b) => b.end - a.end)[0]

          if (lastIntersecting) {
            top = lastIntersecting.end + 5 // 5px для разделения
          }
        }

        // Добавляем этот блок в очередь отрисованных
        renderedBlocks.push({
          end: top + height,
        })

        // Определяем, короткое ли это событие
        const isShortEvent = duration <= 0.33 // 20 минут = 0.33 часа

        elements.push(
          <div
            key={event.id}
            className={`compact-event ${getCategoryClass(event.category)} ${
              isShortEvent ? 'short-event' : ''
            }`}
            style={{
              top: `${top}px`,
              left: '2%',
              width: '96%',
              height: `${height}px`,
              zIndex: 10 + index, // Более поздние события выше
            }}
            title={`${event.title} (${event.time || ''})`}
          >
            <span className="compact-event-time">{event.time || ''}</span>
            <span className="compact-event-title">{event.title}</span>
            {event.description && !isShortEvent && (
              <span className="compact-event-description">
                {event.description}
              </span>
            )}
          </div>
        )
      })
    })

    return elements
  }

  // Функция для рендеринга временной сетки в зависимости от масштаба
  const renderTimeGrid = () => {
    // Обычная часовая сетка
    return hours.map(hour => (
      <div
        key={hour}
        className="day-hour-cell"
        style={{ height: `${getHourHeight()}px` }}
      ></div>
    ))
  }

  // Добавьте этот useEffect для синхронизации прокрутки
  useEffect(() => {
    if (activeView === 'week') {
      // Горизонтальная синхронизация (заголовки дней)
      const headerScroll = document.querySelector('.week-headers-scroll')
      const contentScroll = document.querySelector('.week-days-scroll')

      if (headerScroll && contentScroll) {
        const syncHorizontalScroll = (event: Event) => {
          const source = (event as UIEvent).target as HTMLElement
          if (source.classList.contains('week-headers-scroll')) {
            contentScroll.scrollLeft = source.scrollLeft
          } else if (source.classList.contains('week-days-scroll')) {
            headerScroll.scrollLeft = source.scrollLeft
          }
        }

        headerScroll.addEventListener('scroll', syncHorizontalScroll)
        contentScroll.addEventListener('scroll', syncHorizontalScroll)

        // Вертикальная синхронизация (часы и сетка дней)
        const hoursContainer = document.querySelector('.week-hours-container')

        if (hoursContainer) {
          const syncVerticalScroll = (event: Event) => {
            const source = event.target as HTMLElement
            if (source.classList.contains('week-days-scroll')) {
              hoursContainer.scrollTop = source.scrollTop
            } else if (source.classList.contains('week-hours-container')) {
              contentScroll.scrollTop = source.scrollTop
            }
          }

          contentScroll.addEventListener('scroll', syncVerticalScroll)
          hoursContainer.addEventListener('scroll', syncVerticalScroll)

          return () => {
            headerScroll.removeEventListener('scroll', syncHorizontalScroll)
            contentScroll.removeEventListener('scroll', syncHorizontalScroll)
            contentScroll.removeEventListener('scroll', syncVerticalScroll)
            hoursContainer.removeEventListener('scroll', syncVerticalScroll)
          }
        }

        return () => {
          headerScroll.removeEventListener('scroll', syncHorizontalScroll)
          contentScroll.removeEventListener('scroll', syncHorizontalScroll)
        }
      }
    }
  }, [activeView])

  return (
    <div className="calendar-app">
      {/* Изменяем условие отображения анимации загрузки */}
      {showLoadingAnimation && (
        <div className="calendar-loading-overlay">
          <div className="calendar-loading-content">
            <div className="calendar-animation-container">
              <div className="calendar-cube">
                <div className="cube-face face-front">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="calendar-cell"></div>
                  ))}
                </div>
                <div className="cube-face face-back">
                  <div className="calendar-month">ПН</div>
                </div>
                <div className="cube-face face-right">
                  <div className="calendar-day">24</div>
                </div>
                <div className="cube-face face-left">
                  <i
                    className="fas fa-calendar-alt"
                    style={{ fontSize: '3rem' }}
                  ></i>
                </div>
                <div className="cube-face face-top">
                  <div className="calendar-month">МАЙ</div>
                </div>
                <div className="cube-face face-bottom">
                  <i className="fas fa-sync" style={{ fontSize: '2.5rem' }}></i>
                </div>
              </div>
            </div>
            <div className="loading-text">Загрузка календаря</div>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        </div>
      )}

      {/* Удаляем отдельный индикатор загрузки, используя только один загрузочный экран */}
      {/* {isLoading && initialLoadComplete && (
        <div className="simple-loading-indicator">
          <i className="fas fa-circle-notch fa-spin"></i>
        </div>
      )} */}

      {/* Display error message if there is one */}
      {error && (
        <div className="calendar-error">
          <p>{error}</p>
          <button onClick={fetchTasks}>Try Again</button>
        </div>
      )}

      {/* Rest of the component... */}
      <div className="calendar-header">
        <div className="calendar-title">
          <h2>{formatViewDate()}</h2>
        </div>

        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={prevPeriod}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <button className="calendar-nav-btn today-btn" onClick={goToToday}>
            Сегодня
          </button>
          <button className="calendar-nav-btn" onClick={nextPeriod}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        <div className="calendar-views">
          <button
            className={`view-btn ${activeView === 'month' ? 'active' : ''}`}
            onClick={() => setActiveView('month')}
          >
            Месяц
          </button>
          <button
            className={`view-btn ${activeView === 'week' ? 'active' : ''}`}
            onClick={() => setActiveView('week')}
          >
            Неделя
          </button>
          <button
            className={`view-btn ${activeView === 'day' ? 'active' : ''}`}
            onClick={() => setActiveView('day')}
          >
            День
          </button>
        </div>
      </div>

      {activeView === 'month' && (
        <div className="calendar-container">
          <div className="calendar-weekdays">
            {weekdays.map((day, index) => (
              <div key={day} className="weekday">
                {getWeekdayLabel(day, index)}
              </div>
            ))}
          </div>

          <div className="calendar-days">
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDay(day.date)
              return (
                <div
                  key={index}
                  className={`calendar-day ${
                    !day.isCurrentMonth ? 'other-month' : ''
                  } ${isToday(day.date) ? 'today' : ''} ${
                    selectedDay &&
                    day.date.toDateString() === selectedDay.toDateString()
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() => setSelectedDay(day.date)}
                >
                  <div className="day-number">{day.date.getDate()}</div>
                  <div className="day-events">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`day-event ${getCategoryClass(
                          event.category
                        )}`}
                        title={event.title}
                      >
                        <i
                          className={`fas fa-${getCategoryIcon(
                            event.category
                          )}`}
                        ></i>
                        <span className="event-title">{event.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="more-events">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Модифицируем недельное представление для поддержки горизонтальной прокрутки на мобильных устройствах */}
      {activeView === 'week' && (
        <div className="calendar-container week-view">
          <div className="week-outer-container">
            {/* Фиксированный левый верхний угол */}
            <div className="week-fixed-corner">
              <div className="hour-header-cell"></div>
            </div>

            {/* Прокручиваемая строка с заголовками дней */}
            <div className="week-headers-scroll">
              <div className="week-days-header">
                {weekDays.map((day, index) => (
                  <div
                    key={index}
                    className={`weekday-full ${isToday(day) ? 'today' : ''}`}
                    onClick={() => {
                      setSelectedDay(day)
                      setActiveView('day')
                      setCurrentDate(day)
                    }}
                  >
                    <div className="weekday-name">
                      {getWeekdayLabel(weekdays[index], index)}
                    </div>
                    <div className="weekday-date">{day.getDate()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Фиксированная колонка с часами */}
            <div className="week-hours-container">
              <div className="week-hours">
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="week-hour"
                    style={{ height: `${getHourHeight()}px` }}
                  >
                    <div className="hour-label">{`${hour}:00`}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Прокручиваемая область с ячейками дней */}
            <div className="week-days-scroll">
              <div className="week-days-content">
                {weekDays.map((day, dayIndex) => (
                  <div key={dayIndex} className="week-day-column">
                    {hours.map(hour => (
                      <div
                        key={`hour-${hour}`}
                        className="week-hour-cell"
                        style={{ height: `${getHourHeight()}px` }}
                      ></div>
                    ))}
                    {renderEvents(getEventsForDay(day))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'day' && (
        <div className="calendar-container day-view">
          <div className="day-header">
            <div className={`day-title ${isToday(currentDate) ? 'today' : ''}`}>
              <div className="day-name">
                {currentDate.toLocaleDateString('ru-RU', { weekday: 'long' })}
              </div>
              <div className="day-date">{currentDate.getDate()}</div>
            </div>
          </div>

          <div className="day-grid">
            <div className="day-hours">
              {hours.map(hour => (
                <div
                  key={hour}
                  className="day-hour"
                  style={{ height: `${getHourHeight()}px` }}
                >
                  <div className="hour-label">{`${hour}:00`}</div>
                </div>
              ))}
            </div>

            <div className="day-events-grid">
              {/* Render grid */}
              {renderTimeGrid()}

              {/* Render events */}
              {renderEvents(getEventsForDay(currentDate))}
            </div>
          </div>
        </div>
      )}

      {selectedDay && activeView === 'month' && (
        <div className="day-details">
          <h3>{formatDate(selectedDay)}</h3>
          <div className="day-events-list">
            {getEventsForDay(selectedDay).length === 0 ? (
              <div className="no-events">Нет событий на этот день</div>
            ) : (
              getEventsForDay(selectedDay).map(event => (
                <div
                  key={event.id}
                  className={`event-item ${getCategoryClass(event.category)}`}
                >
                  <div className="event-time">{event.time || '•'}</div>
                  <div className="event-content">
                    <div className="event-title-row">
                      <i
                        className={`fas fa-${getCategoryIcon(event.category)}`}
                      ></i>
                      <h4>{event.title}</h4>
                    </div>
                    {event.description && (
                      <div className="event-description">
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarApp
