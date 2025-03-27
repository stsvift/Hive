import React, { useState } from 'react'
import './CalendarApp.css'

interface Event {
  id: string
  title: string
  date: string // ISO string date
  time?: string
  description?: string
  category: 'meeting' | 'task' | 'reminder' | 'personal'
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

  // Получение названия месяца
  const getMonthName = (date: Date) => {
    return date.toLocaleString('ru-RU', { month: 'long' })
  }

  // Получение дней в месяце
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
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
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      })
    }

    // Добавляем дни текущего месяца
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    // Добавляем дни следующего месяца, чтобы заполнить сетку
    const remainingDays = 42 - days.length // 6 рядов по 7 дней
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }

    return days
  }

  // Получение событий для конкретного дня
  const getEventsForDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateString)
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

  // Получение массива часов для дневного представления
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

  const calendarDays = buildCalendarDays()
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  const weekDays = buildWeekDays()
  const hours = getHoursArray()

  // Формат времени для отображения
  const formatTimeLabel = (hour: number) => {
    return `${hour}:00`
  }

  // Получаем время события для отображения в сетке
  const getEventTimePosition = (time?: string) => {
    if (!time) return 0
    const [hours, minutes] = time.split(':').map(Number)
    return hours + minutes / 60
  }

  return (
    <div className="calendar-app">
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
            {weekdays.map(day => (
              <div key={day} className="weekday">
                {day}
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

      {activeView === 'week' && (
        <div className="calendar-container week-view">
          <div className="calendar-weekdays week-header">
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
                <div className="weekday-name">{weekdays[index]}</div>
                <div className="weekday-date">{day.getDate()}</div>
              </div>
            ))}
          </div>

          <div className="week-grid">
            <div className="week-hours">
              {hours.map(hour => (
                <div key={hour} className="week-hour">
                  <div className="hour-label">{formatTimeLabel(hour)}</div>
                </div>
              ))}
            </div>

            <div className="week-days-grid">
              {weekDays.map((day, dayIndex) => (
                <div key={dayIndex} className="week-day-column">
                  {hours.map(hour => (
                    <div key={hour} className="week-hour-cell"></div>
                  ))}

                  {/* События в недельном представлении */}
                  {getEventsForDay(day).map(event => {
                    const timePosition = getEventTimePosition(event.time)
                    return (
                      <div
                        key={event.id}
                        className={`week-event ${getCategoryClass(
                          event.category
                        )}`}
                        style={{
                          top: `calc(${timePosition} * var(--hour-height))`,
                          height: 'var(--hour-height)',
                        }}
                        title={event.description}
                      >
                        <div className="week-event-time">
                          {event.time || ''}
                        </div>
                        <div className="week-event-title">{event.title}</div>
                      </div>
                    )
                  })}
                </div>
              ))}
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
                <div key={hour} className="day-hour">
                  <div className="hour-label">{formatTimeLabel(hour)}</div>
                </div>
              ))}
            </div>

            <div className="day-events-grid">
              {hours.map(hour => (
                <div key={hour} className="day-hour-cell"></div>
              ))}

              {/* События в дневном представлении */}
              {getEventsForDay(currentDate).map(event => {
                const timePosition = getEventTimePosition(event.time)
                return (
                  <div
                    key={event.id}
                    className={`day-view-event ${getCategoryClass(
                      event.category
                    )}`}
                    style={{
                      top: `calc(${timePosition} * var(--hour-height))`,
                      height: 'var(--hour-height)',
                    }}
                    title={event.description}
                  >
                    <div className="day-event-time">{event.time || ''}</div>
                    <div className="day-event-title">{event.title}</div>
                    {event.description && (
                      <div className="day-event-description">
                        {event.description}
                      </div>
                    )}
                    <div className="day-event-category">
                      <i
                        className={`fas fa-${getCategoryIcon(event.category)}`}
                      ></i>
                    </div>
                  </div>
                )
              })}
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
