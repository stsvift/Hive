import React, { useEffect, useState } from 'react'
import { taskService } from '../../../services/taskService'
import { eventBus, EVENTS } from '../../../utils/eventBus'
import {
  apiTaskToTaskModel,
  taskModelToApiTask,
} from '../../../utils/taskUtils'
import './TasksApp.css'

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
  isDirty?: boolean // Add flag to track unsaved changes
}

const TasksApp: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  const [activeFilter, setActiveFilter] = useState<
    'all' | 'todo' | 'in_progress' | 'done'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    tags: [],
    dueDate: undefined,
    startTime: '', // Add default empty string
    endTime: '', // Add default empty string
  })
  // Add new state to track if we're in mobile mode and if the details panel is showing
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showMobileDetails, setShowMobileDetails] = useState(false)

  // Добавляем состояние для отслеживания несохраненных изменений
  const [isDirty, setIsDirty] = useState(false)
  const [editedTask, setEditedTask] = useState<Task | null>(null)

  // Инициализируем editedTask когда selectedTask меняется
  useEffect(() => {
    if (selectedTask) {
      setEditedTask(selectedTask)
      setIsDirty(false)
    } else {
      setEditedTask(null)
      setIsDirty(false)
    }
  }, [selectedTask])

  // Fetch tasks from API when component mounts
  useEffect(() => {
    fetchTasks()
  }, [])

  // Enhanced fetch tasks function with better error messaging
  const fetchTasks = async () => {
    setIsLoading(true)
    setApiError(null)

    try {
      const response = await taskService.getAllTasks()
      const formattedTasks = response.map(apiTask =>
        apiTaskToTaskModel(apiTask)
      )
      setTasks(formattedTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setApiError(
        error instanceof Error
          ? `Failed to load tasks: ${error.message}`
          : 'Failed to connect to the server. Please check your connection and try again.'
      )
      // Set empty tasks array on error
      setTasks([])
    } finally {
      setIsLoading(false)
      setInitialLoadComplete(true)
    }
  }

  // Add a resize listener to detect mobile vs desktop mode
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      // If transitioning from mobile to desktop, make sure details are visible
      if (!mobile && !showMobileDetails) {
        setShowMobileDetails(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showMobileDetails])

  // When a task is selected in mobile mode, show the details
  const handleTaskSelect = (task: Task) => {
    if (isDirty && editedTask) {
      if (window.confirm('У вас есть несохраненные изменения. Сохранить?')) {
        handleSaveTaskChanges().then(() => {
          setSelectedTask(task)
        })
      } else {
        setSelectedTask(task)
      }
    } else {
      setSelectedTask(task)
    }

    if (isMobile) {
      setShowMobileDetails(true)
    }
  }

  // Handle back button in mobile view
  const handleBackToList = () => {
    setShowMobileDetails(false)
  }

  // Фильтрация задач
  const filteredTasks = tasks.filter(task => {
    // Фильтр по статусу
    if (activeFilter !== 'all' && task.status !== activeFilter) {
      return false
    }

    // Поиск по названию или описанию
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return true
  })

  // Сортировка задач: сначала приоритетные, потом по дате
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Сначала приоритетные
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }

    // Затем по дате (если есть)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }

    // По дате создания
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // Создание новой задачи
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      return
    }

    setIsUpdating(true)
    setApiError(null)

    try {
      // Prepare the task data
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description || '',
        status: newTask.status || 'todo',
        priority: newTask.priority,
        taskDate: newTask.dueDate || null,
        startTime: newTask.startTime || null,
        endTime: newTask.endTime || null,
        tags: newTask.tags.length > 0 ? newTask.tags.join(', ') : '',
        isCompleted: newTask.status === 'done',
        assigneeId: null,
        category: null,
        estimatedHours: null,
        actualHours: null,
        folderId: null,
      }

      console.log('Sending task data:', taskData)

      const createdTask = await taskService.createTask(taskData)
      const formattedTask = apiTaskToTaskModel(createdTask)
      setTasks([formattedTask, ...tasks])
      setIsAddingTask(false)
      resetNewTaskForm()

      // Notify other components about the new task
      eventBus.publish(EVENTS.TASKS_UPDATED, {
        action: 'create',
        task: formattedTask,
      })
    } catch (error) {
      console.error('Error creating task:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create task'
      setApiError(`Failed to create task: ${errorMessage}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const resetNewTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      tags: [],
      dueDate: undefined,
      startTime: '',
      endTime: '',
    })
  }

  // Обновление задачи
  const handleUpdateTask = async (updatedTask: Task) => {
    setIsUpdating(true)
    setApiError(null)

    // Mark the task as dirty
    updatedTask.isDirty = true
    setTasks(
      tasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
    )
    setHasUnsavedChanges(true)
  }

  // Save all changes
  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) {
      console.log('No changes to save')
      return
    }

    setIsUpdating(true)
    setApiError(null)

    try {
      // Find all tasks that have been modified
      const dirtyTasks = tasks.filter(task => task.isDirty)
      console.log('Saving dirty tasks:', dirtyTasks)

      if (dirtyTasks.length === 0) {
        console.log('No dirty tasks found')
        setIsUpdating(false)
        return // Nothing to save
      }

      // Save each modified task
      for (const task of dirtyTasks) {
        console.log(`Saving task ${task.id}:`, task)
        const apiTask = taskModelToApiTask(task)
        const updatedTask = await taskService.updateTask(task.id, apiTask)
        console.log('Task updated successfully:', updatedTask)

        // Remove the dirty flag
        task.isDirty = false
      }

      // Update local state to reflect saved changes
      setTasks([...tasks])
      setHasUnsavedChanges(false)

      // Notify other components about batch updates
      eventBus.publish(EVENTS.TASKS_UPDATED, {
        action: 'batch-update',
        tasks: dirtyTasks,
      })

      // Remove the alert notification
      // alert('Задачи успешно сохранены')
    } catch (error) {
      console.error('Error saving tasks:', error)
      setApiError(
        error instanceof Error
          ? `Ошибка сохранения: ${error.message}`
          : 'Ошибка соединения с сервером. Пожалуйста, проверьте подключение.'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  // Сохранение изменений задачи на сервер
  const handleSaveTaskChanges = async () => {
    if (!editedTask || !isDirty) return

    setIsUpdating(true)
    setApiError(null)

    try {
      // Подготовка данных для API
      const taskData = {
        title: editedTask.title,
        description: editedTask.description || '',
        status: editedTask.status || 'todo',
        priority: editedTask.priority,
        taskDate: editedTask.dueDate || null,
        startTime: editedTask.startTime || null,
        endTime: editedTask.endTime || null,
        tags: editedTask.tags.length > 0 ? editedTask.tags.join(', ') : '',
        isCompleted: editedTask.status === 'done',
        assigneeId: null,
        category: null,
        estimatedHours: null,
        actualHours: null,
        folderId: null,
      }

      // Обновление задачи через API
      const updatedApiTask = await taskService.updateTask(
        editedTask.id,
        taskData
      )
      const formattedTask = apiTaskToTaskModel(updatedApiTask)

      // Обновление списка задач
      setTasks(
        tasks.map(task => (task.id === formattedTask.id ? formattedTask : task))
      )

      // Обновляем выбранную задачу
      setSelectedTask(formattedTask)
      setEditedTask(formattedTask)
      setIsDirty(false)
      setHasUnsavedChanges(false)

      // Notify other components about the updated task
      eventBus.publish(EVENTS.TASKS_UPDATED, {
        action: 'update',
        task: formattedTask,
      })
    } catch (error) {
      console.error('Failed to save task changes:', error)
      setApiError(
        error instanceof Error
          ? `Failed to save task: ${error.message}`
          : 'Failed to connect to the server. Please check your connection and try again.'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  // Удаление задачи
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }

    setIsUpdating(true)
    setApiError(null)

    try {
      // Store task for event publishing before deletion
      const deletedTask = tasks.find(task => task.id === taskId)

      // Call API to delete task
      await taskService.deleteTask(taskId)

      // Update local state
      setTasks(tasks.filter(task => task.id !== taskId))
      if (selectedTask?.id === taskId) {
        setSelectedTask(null)
      }

      // Notify other components about the deleted task
      if (deletedTask) {
        eventBus.publish(EVENTS.TASKS_UPDATED, {
          action: 'delete',
          task: deletedTask,
        })
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      setApiError('Failed to delete task. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  // Добавление тега к новой задаче
  const handleAddTag = (tag: string) => {
    if (!tag.trim() || newTask.tags.includes(tag)) {
      return
    }
    setNewTask({ ...newTask, tags: [...newTask.tags, tag] })
  }

  // Получение класса для приоритета:
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'priority-high'
      case 'medium':
        return 'priority-medium'
      case 'low':
        return 'priority-low'
      default:
        return ''
    }
  }

  // Получение класса для статуса
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'todo':
        return 'status-todo'
      case 'in_progress':
        return 'status-progress'
      case 'done':
        return 'status-completed'
      default:
        return ''
    }
  }

  // Форматирование даты - more robust implementation
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''

    try {
      // Check if dateString is a valid date
      if (isNaN(new Date(dateString).getTime())) {
        console.warn('Invalid date string:', dateString)
        return ''
      }

      // Parse the date using split to avoid timezone issues
      let [year, month, day] = dateString
        .split('-')
        .map(num => parseInt(num, 10))

      // Month is 0-indexed in JavaScript Date
      if (month) month -= 1

      const date = new Date(year, month, day)

      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        console.warn('Invalid date after parsing:', dateString)
        return ''
      }

      // Format with locale
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return ''
    }
  }

  // Format date for input fields - more robust implementation
  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return ''

    try {
      // Check if the string already has the right format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString
      }

      // Parse the date using split to avoid timezone issues
      let [year, month, day] = dateString
        .split('-')
        .map(num => parseInt(num, 10))

      // Check if we have valid parts
      if (!year || !month || !day) {
        // Try as a regular Date object
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
          console.warn('Invalid date for input:', dateString)
          return ''
        }

        year = date.getFullYear()
        // Month is 0-indexed in JavaScript Date
        month = date.getMonth() + 1
        day = date.getDate()
      }

      // Format as YYYY-MM-DD for input[type="date"]
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
        2,
        '0'
      )}`
    } catch (error) {
      console.error('Error formatting date for input:', error, dateString)
      return ''
    }
  }

  // Update the renderSaveButton function to remove the has-changes class and save-indicator
  const renderSaveButton = () => {
    return (
      <button
        className="task-save-btn"
        onClick={handleSaveChanges}
        disabled={isUpdating || !hasUnsavedChanges}
        title="Сохранить изменения"
      >
        {isUpdating ? (
          <i className="fas fa-spinner fa-spin"></i>
        ) : (
          <i className="fas fa-save"></i>
        )}
      </button>
    )
  }

  // When a user makes changes to a task, make sure to set hasUnsavedChanges
  const handleLocalTaskChange = (field: string, value: any) => {
    if (!selectedTask) return

    console.log(`Changing field '${field}' to:`, value)

    // Create a new task object with the updated field
    const updatedTask = { ...selectedTask, [field]: value }

    // Mark the task as dirty
    updatedTask.isDirty = true

    // Update the selected task
    setSelectedTask(updatedTask)

    // Set the global flag to show we have unsaved changes
    setHasUnsavedChanges(true)

    // Also update the task in the tasks array
    setTasks(
      tasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
    )

    console.log('Task updated locally, hasUnsavedChanges set to true')
  }

  // Обновление задачи локально (без отправки на сервер)
  const handleUpdateTaskLocally = (updatedFields: Partial<Task>) => {
    if (!editedTask) return

    // Обновляем локальное состояние
    const updatedTask = { ...editedTask, ...updatedFields }
    setEditedTask(updatedTask)
    setIsDirty(true)
  }

  // В коде рендеринга для деталей задачи (Task Details) добавляем кнопку сохранения
  const renderTaskDetails = () => {
    if (!editedTask) {
      return (
        <div className="no-task-selected">
          <div className="no-task-icon">
            <i className="fas fa-tasks"></i>
          </div>
          <p>Выберите задачу из списка или создайте новую</p>
          <button
            className="btn-create-task"
            onClick={() => setIsAddingTask(true)}
          >
            <i className="fas fa-plus"></i> Создать задачу
          </button>
        </div>
      )
    }

    return (
      <div className="task-details">
        <div className="task-header">
          <div className="task-status-selector">
            <select
              value={editedTask.status}
              onChange={e => {
                // Update locally without triggering a save
                handleUpdateTaskLocally({
                  status: e.target.value as Task['status'],
                })
                // Mark as dirty to enable the save button
                setIsDirty(true)
              }}
              className={`status-select ${getStatusClass(editedTask.status)}`}
              disabled={isUpdating}
            >
              <option value="todo">Нужно сделать</option>
              <option value="in_progress">В работе</option>
              <option value="done">Выполнено</option>
            </select>
          </div>

          <div className="task-actions">
            {isDirty && (
              <button
                className="task-save-btn"
                onClick={handleSaveTaskChanges}
                disabled={isUpdating || !isDirty}
                title="Сохранить"
              >
                <i className="fas fa-save"></i>
              </button>
            )}
            <button
              className="task-delete-btn"
              onClick={() => handleDeleteTask(editedTask.id)}
              disabled={isUpdating}
            >
              <i className="fas fa-trash-alt"></i> Удалить
            </button>
          </div>
        </div>

        <div className="task-title-container">
          <input
            type="text"
            className="task-title-input"
            value={editedTask.title}
            onChange={e => handleUpdateTaskLocally({ title: e.target.value })}
            placeholder="Название задачи"
            disabled={isUpdating}
          />
        </div>

        <div className="task-meta">
          <div className="task-meta-item">
            <label>Приоритет</label>
            <select
              value={editedTask.priority}
              onChange={e =>
                handleUpdateTaskLocally({
                  priority: e.target.value as Task['priority'],
                })
              }
              className={getPriorityClass(editedTask.priority)}
              disabled={isUpdating}
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>

          <div className="task-meta-item">
            <label>Срок выполнения</label>
            <input
              type="date"
              value={formatDateForInput(editedTask.dueDate)}
              onChange={e =>
                handleUpdateTaskLocally({
                  dueDate: e.target.value || undefined,
                })
              }
              disabled={isUpdating}
            />
          </div>

          <div className="task-meta-item">
            <label>Начало</label>
            <input
              type="time"
              value={editedTask.startTime || ''}
              onChange={e =>
                handleUpdateTaskLocally({
                  startTime: e.target.value || '',
                })
              }
              disabled={isUpdating}
            />
          </div>

          <div className="task-meta-item">
            <label>Окончание</label>
            <input
              type="time"
              value={editedTask.endTime || ''}
              onChange={e =>
                handleUpdateTaskLocally({
                  endTime: e.target.value || '',
                })
              }
              disabled={isUpdating}
            />
          </div>
        </div>

        <div className="task-description-container">
          <label>Описание</label>
          <textarea
            className="task-description-input"
            value={editedTask.description || ''}
            onChange={e =>
              handleUpdateTaskLocally({ description: e.target.value })
            }
            placeholder="Описание задачи"
            disabled={isUpdating}
          />
        </div>

        <div className="task-tags-container">
          <label>Теги</label>
          <div className="task-tags-list">
            {editedTask.tags.map((tag, index) => (
              <div key={index} className="task-detail-tag">
                {tag}
                <button
                  className="remove-tag-btn"
                  onClick={() => {
                    const updatedTags = [...editedTask.tags]
                    updatedTags.splice(index, 1)
                    handleUpdateTaskLocally({ tags: updatedTags })
                  }}
                  disabled={isUpdating}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}

            <input
              type="text"
              className="add-tag-input"
              placeholder="Добавить тег..."
              onKeyDown={e => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const newTag = e.currentTarget.value.trim()
                  if (!editedTask.tags.includes(newTag)) {
                    handleUpdateTaskLocally({
                      tags: [...editedTask.tags, newTag],
                    })
                  }
                  e.currentTarget.value = ''
                }
              }}
              disabled={isUpdating}
            />
          </div>
        </div>

        {apiError && <div className="task-error-message">{apiError}</div>}
      </div>
    )
  }

  return (
    <div className="tasks-app">
      {/* Анимация загрузки при первом входе */}
      {isLoading && (
        <div className="tasks-loading-overlay">
          <div className="tasks-loading-content">
            <div className="tasks-animation-container">
              {/* Плавающие частицы */}
              <div className="task-particle"></div>
              <div className="task-particle"></div>
              <div className="task-particle"></div>
              <div className="task-particle"></div>

              {/* Плавающие иконки */}
              <div className="floating-task-icon">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <div className="floating-task-icon">
                <i className="fas fa-tasks"></i>
              </div>
              <div className="floating-task-icon">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div className="floating-task-icon">
                <i className="fas fa-check-circle"></i>
              </div>

              {/* Анимация доски задач */}
              <div className="task-board">
                <div className="task-board-bg"></div>
                <div className="task-board-content">
                  <div className="task-list-header">
                    <div className="task-list-title"></div>
                    <div className="task-list-actions"></div>
                  </div>

                  <div className="task-list">
                    <div className="task-item">
                      <div className="task-checkbox checked"></div>
                      <div className="task-content checked"></div>
                    </div>

                    <div className="task-item">
                      <div className="task-checkbox"></div>
                      <div className="task-content"></div>
                    </div>

                    <div className="task-item">
                      <div className="task-checkbox checked"></div>
                      <div className="task-content checked"></div>
                    </div>

                    <div className="task-item">
                      <div className="task-checkbox"></div>
                      <div className="task-content"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="loading-text">Загружаем ваши задачи</div>

            <div className="progress-container">
              <div className="progress-bar"></div>
            </div>

            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        </div>
      )}

      {/* Show API error if exists */}
      {apiError && (
        <div className="api-error-message">
          <i className="fas fa-exclamation-circle"></i> {apiError}
          <button className="retry-btn" onClick={fetchTasks}>
            <i className="fas fa-sync-alt"></i> Retry
          </button>
        </div>
      )}

      {/* In mobile mode, conditionally show either the list or the details */}
      {isMobile && showMobileDetails && selectedTask ? (
        <div className="tasks-mobile-details">
          <div className="mobile-header">
            <button className="back-button" onClick={handleBackToList}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <h2>{selectedTask.title}</h2>
          </div>
          <div className="tasks-content mobile-content">
            <div className="task-details">
              <div className="task-header">
                <div className="task-status-selector">
                  <select
                    value={selectedTask.status}
                    onChange={e => {
                      // Create updated task
                      const updatedTask = {
                        ...selectedTask,
                        status: e.target.value as
                          | 'todo'
                          | 'in_progress'
                          | 'done',
                        isDirty: true, // Mark as dirty to enable the save button
                      }
                      // Update the task in state
                      setSelectedTask(updatedTask)

                      // Also update in the tasks array
                      setTasks(
                        tasks.map(task =>
                          task.id === updatedTask.id ? updatedTask : task
                        )
                      )

                      // Set global flag to show we have unsaved changes
                      setHasUnsavedChanges(true)
                    }}
                    className={getStatusClass(selectedTask.status)}
                    disabled={isUpdating}
                  >
                    <option value="todo">К выполнению</option>
                    <option value="in_progress">В процессе</option>
                    <option value="done">Завершено</option>
                  </select>
                </div>

                <div className="task-actions">
                  <button
                    className="task-delete-btn"
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-trash"></i>
                    )}
                  </button>
                  {renderSaveButton()}
                </div>
              </div>

              <div className="task-title-container">
                <input
                  type="text"
                  className="task-title-input"
                  value={selectedTask.title}
                  onChange={e => handleLocalTaskChange('title', e.target.value)}
                  disabled={isUpdating}
                />
              </div>

              <div className="task-meta">
                <div className="task-meta-item">
                  <label>Приоритет:</label>
                  <select
                    value={selectedTask.priority}
                    onChange={e =>
                      handleLocalTaskChange(
                        'priority',
                        e.target.value as 'low' | 'medium' | 'high'
                      )
                    }
                    className={getPriorityClass(selectedTask.priority)}
                    disabled={isUpdating}
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>

                <div className="task-meta-item">
                  <label>Срок:</label>
                  <input
                    type="date"
                    value={formatDateForInput(selectedTask.dueDate)}
                    onChange={e =>
                      handleLocalTaskChange('dueDate', e.target.value)
                    }
                    disabled={isUpdating}
                  />
                </div>
              </div>

              {/* Add new row for time fields */}
              <div className="task-meta">
                <div className="task-meta-item">
                  <label>Время начала:</label>
                  <input
                    type="time"
                    value={selectedTask.startTime || ''}
                    onChange={e =>
                      handleLocalTaskChange('startTime', e.target.value)
                    }
                    disabled={isUpdating}
                  />
                </div>
                <div className="task-meta-item">
                  <label>Время окончания:</label>
                  <input
                    type="time"
                    value={selectedTask.endTime || ''}
                    onChange={e =>
                      handleLocalTaskChange('endTime', e.target.value)
                    }
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div className="task-description-container">
                <label>Описание:</label>
                <textarea
                  className="task-description-input"
                  value={selectedTask.description}
                  onChange={e =>
                    handleLocalTaskChange('description', e.target.value)
                  }
                  placeholder="Описание задачи..."
                  disabled={isUpdating}
                ></textarea>
              </div>

              <div className="task-tags-container">
                <label>Теги:</label>
                <div className="task-tags-list">
                  {selectedTask.tags.map((tag, index) => (
                    <span key={index} className="task-detail-tag">
                      {tag}
                      <button
                        className="remove-tag-btn"
                        onClick={() =>
                          handleLocalTaskChange(
                            'tags',
                            selectedTask.tags.filter((_, i) => i !== index)
                          )
                        }
                        disabled={isUpdating}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="add-tag-input"
                    placeholder="Добавить тег..."
                    disabled={isUpdating}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement
                        if (input.value.trim()) {
                          handleLocalTaskChange('tags', [
                            ...selectedTask.tags,
                            input.value.trim(),
                          ])
                          input.value = ''
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isMobile && isAddingTask ? (
        <div className="tasks-mobile-details">
          <div className="mobile-header">
            <button
              className="back-button"
              onClick={() => setIsAddingTask(false)}
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <h2>Новая задача</h2>
          </div>
          <div className="tasks-content mobile-content">
            <div className="create-task-form">
              <div className="form-group">
                <label>Название:</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="Название задачи"
                  className="form-control"
                  disabled={isUpdating}
                />
              </div>

              <div className="form-group">
                <label>Описание:</label>
                <textarea
                  value={newTask.description}
                  onChange={e =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Описание задачи"
                  className="form-control"
                  rows={4}
                  disabled={isUpdating}
                ></textarea>
              </div>

              {/* First row with priority and due date only */}
              <div className="form-row">
                <div className="form-group half">
                  <label>Приоритет:</label>
                  <select
                    value={newTask.priority}
                    onChange={e =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value as 'low' | 'medium' | 'high',
                      })
                    }
                    className={`form-control ${getPriorityClass(
                      newTask.priority
                    )}`}
                    disabled={isUpdating}
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>

                <div className="form-group half">
                  <label>Срок:</label>
                  <input
                    type="date"
                    value={newTask.dueDate || ''}
                    onChange={e =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className="form-control"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              {/* Separate row for time inputs */}
              <div className="form-row">
                <div className="form-group half">
                  <label>Время начала:</label>
                  <input
                    type="time"
                    value={newTask.startTime || ''}
                    onChange={e =>
                      setNewTask({
                        ...newTask,
                        startTime: e.target.value,
                      })
                    }
                    className="form-control"
                    disabled={isUpdating}
                  />
                </div>
                <div className="form-group half">
                  <label>Время окончания:</label>
                  <input
                    type="time"
                    value={newTask.endTime || ''}
                    onChange={e =>
                      setNewTask({ ...newTask, endTime: e.target.value })
                    }
                    className="form-control"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Теги:</label>
                <div className="tags-input-container">
                  <div className="tags-list">
                    {newTask.tags.map((tag, index) => (
                      <span key={index} className="task-detail-tag">
                        {tag}
                        <button
                          className="remove-tag-btn"
                          onClick={() =>
                            setNewTask({
                              ...newTask,
                              tags: newTask.tags.filter((_, i) => i !== index),
                            })
                          }
                          disabled={isUpdating}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Добавить тег и нажать Enter"
                    disabled={isUpdating}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement
                        handleAddTag(input.value)
                        input.value = ''
                      }
                    }}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setIsAddingTask(false)}
                  disabled={isUpdating}
                >
                  Отмена
                </button>
                <button
                  className="btn-create"
                  onClick={handleCreateTask}
                  disabled={isUpdating || !newTask.title.trim()}
                >
                  {isUpdating ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Создание...
                    </>
                  ) : (
                    'Создать задачу'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile list view */}
          {isMobile && (
            <div className="tasks-mobile-list">
              <div className="mobile-header">
                <h2>Задачи</h2>
                <button
                  className="add-task-mobile-btn"
                  onClick={() => setIsAddingTask(true)}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <div className="tasks-search">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Поиск задач..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="tasks-filters mobile-filters">
                <button
                  className={`filter-btn ${
                    activeFilter === 'all' ? 'active' : ''
                  }`}
                  onClick={() => setActiveFilter('all')}
                >
                  Все задачи
                </button>
                <button
                  className={`filter-btn ${
                    activeFilter === 'todo' ? 'active' : ''
                  }`}
                  onClick={() => setActiveFilter('todo')}
                >
                  К выполнению
                </button>
                <button
                  className={`filter-btn ${
                    activeFilter === 'in_progress' ? 'active' : ''
                  }`}
                  onClick={() => setActiveFilter('in_progress')}
                >
                  В процессе
                </button>
                <button
                  className={`filter-btn ${
                    activeFilter === 'done' ? 'active' : ''
                  }`}
                  onClick={() => setActiveFilter('done')}
                >
                  Завершенные
                </button>
              </div>

              <div className="tasks-list mobile-list">
                {isLoading ? (
                  <div className="loading-tasks">
                    <i className="fas fa-spinner fa-spin"></i> Загрузка задач...
                  </div>
                ) : sortedTasks.length === 0 ? (
                  <div className="no-tasks">
                    {searchQuery
                      ? 'Нет задач, соответствующих поиску'
                      : 'Нет задач в этой категории'}
                  </div>
                ) : (
                  sortedTasks.map(task => (
                    <div
                      key={task.id}
                      className={`task-item ${
                        selectedTask?.id === task.id ? 'active' : ''
                      }`}
                      onClick={() => handleTaskSelect(task)}
                    >
                      <div className="task-item-header">
                        <div className="task-status-container">
                          <div
                            className={`task-priority ${getPriorityClass(
                              task.priority
                            )}`}
                          ></div>
                          <div
                            className={`task-status ${getStatusClass(
                              task.status
                            )}`}
                          >
                            {task.status === 'todo' && 'К выполнению'}
                            {task.status === 'in_progress' && 'В работе'}
                            {task.status === 'done' && 'Завершено'}
                          </div>
                        </div>

                        {task.dueDate && (
                          <div className="task-due-date-time">
                            <i className="far fa-calendar-alt"></i>
                            <span>{formatDate(task.dueDate)}</span>
                          </div>
                        )}
                      </div>

                      <div className="task-item-content">
                        <div className="task-item-title">{task.title}</div>

                        {task.startTime && (
                          <div className="task-time">
                            <i className="far fa-clock"></i>
                            <span>
                              {task.startTime}
                              {task.endTime && ` - ${task.endTime}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="task-item-footer">
                        <div className="task-tags">
                          {task.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="task-tag">
                              {tag}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className="task-tag task-tag-more">
                              +{task.tags.length - 3}
                            </span>
                          )}
                        </div>

                        {task.isDirty && (
                          <div
                            className="task-modified-indicator"
                            title="Несохраненные изменения"
                          >
                            <i className="fas fa-pen"></i>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Desktop version - show both sidebar and content */}
          {!isMobile && (
            <>
              <div className="tasks-sidebar">
                <div className="tasks-search">
                  <i className="fas fa-search search-icon"></i>
                  <input
                    type="text"
                    placeholder="Поиск задач..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="tasks-filters">
                  <button
                    className={`filter-btn ${
                      activeFilter === 'all' ? 'active' : ''
                    }`}
                    onClick={() => setActiveFilter('all')}
                  >
                    Все задачи
                  </button>
                  <button
                    className={`filter-btn ${
                      activeFilter === 'todo' ? 'active' : ''
                    }`}
                    onClick={() => setActiveFilter('todo')}
                  >
                    К выполнению
                  </button>
                  <button
                    className={`filter-btn ${
                      activeFilter === 'in_progress' ? 'active' : ''
                    }`}
                    onClick={() => setActiveFilter('in_progress')}
                  >
                    В процессе
                  </button>
                  <button
                    className={`filter-btn ${
                      activeFilter === 'done' ? 'active' : ''
                    }`}
                    onClick={() => setActiveFilter('done')}
                  >
                    Завершенные
                  </button>
                </div>

                <div className="tasks-list">
                  {isLoading ? (
                    <div className="loading-tasks">
                      <i className="fas fa-spinner fa-spin"></i> Загрузка
                      задач...
                    </div>
                  ) : sortedTasks.length === 0 ? (
                    <div className="no-tasks">
                      {searchQuery
                        ? 'Нет задач, соответствующих поиску'
                        : 'Нет задач в этой категории'}
                    </div>
                  ) : (
                    sortedTasks.map(task => (
                      <div
                        key={task.id}
                        className={`task-item ${
                          selectedTask?.id === task.id ? 'active' : ''
                        }`}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="task-item-header">
                          <div className="task-status-container">
                            <div
                              className={`task-priority ${getPriorityClass(
                                task.priority
                              )}`}
                            ></div>
                            <div
                              className={`task-status ${getStatusClass(
                                task.status
                              )}`}
                            >
                              {task.status === 'todo' && 'К выполнению'}
                              {task.status === 'in_progress' && 'В работе'}
                              {task.status === 'done' && 'Завершено'}
                            </div>
                          </div>

                          {task.dueDate && (
                            <div className="task-due-date-time">
                              <i className="far fa-calendar-alt"></i>
                              <span>{formatDate(task.dueDate)}</span>
                            </div>
                          )}
                        </div>

                        <div className="task-item-content">
                          <div className="task-item-title">{task.title}</div>

                          {task.startTime && (
                            <div className="task-time">
                              <i className="far fa-clock"></i>
                              <span>
                                {task.startTime}
                                {task.endTime && ` - ${task.endTime}`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="task-item-footer">
                          <div className="task-tags">
                            {task.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="task-tag">
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 3 && (
                              <span className="task-tag task-tag-more">
                                +{task.tags.length - 3}
                              </span>
                            )}
                          </div>

                          {task.isDirty && (
                            <div
                              className="task-modified-indicator"
                              title="Несохраненные изменения"
                            >
                              <i className="fas fa-pen"></i>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add create task button to sidebar */}
                <button
                  className="add-task-btn"
                  onClick={() => setIsAddingTask(true)}
                  disabled={isUpdating}
                >
                  <i className="fas fa-plus"></i> Создать задачу
                </button>
              </div>

              <div className="tasks-content">
                {selectedTask ? (
                  <div className="task-details">
                    <div className="task-header">
                      <div className="task-status-selector">
                        <select
                          value={selectedTask.status}
                          onChange={e => {
                            // Create updated task
                            const updatedTask = {
                              ...selectedTask,
                              status: e.target.value as
                                | 'todo'
                                | 'in_progress'
                                | 'done',
                              isDirty: true, // Mark as dirty to enable the save button
                            }
                            // Update the task in state
                            setSelectedTask(updatedTask)

                            // Also update in the tasks array
                            setTasks(
                              tasks.map(task =>
                                task.id === updatedTask.id ? updatedTask : task
                              )
                            )

                            // Set global flag to show we have unsaved changes
                            setHasUnsavedChanges(true)
                          }}
                          className={getStatusClass(selectedTask.status)}
                          disabled={isUpdating}
                        >
                          <option value="todo">К выполнению</option>
                          <option value="in_progress">В процессе</option>
                          <option value="done">Завершено</option>
                        </select>
                      </div>

                      <div className="task-actions">
                        <button
                          className="task-delete-btn"
                          onClick={() => handleDeleteTask(selectedTask.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-trash"></i>
                          )}
                        </button>
                        {renderSaveButton()}
                      </div>
                    </div>

                    <div className="task-title-container">
                      <input
                        type="text"
                        className="task-title-input"
                        value={selectedTask.title}
                        onChange={e =>
                          handleLocalTaskChange('title', e.target.value)
                        }
                        disabled={isUpdating}
                      />
                    </div>

                    <div className="task-meta">
                      <div className="task-meta-item">
                        <label>Приоритет:</label>
                        <select
                          value={selectedTask.priority}
                          onChange={e =>
                            handleLocalTaskChange(
                              'priority',
                              e.target.value as 'low' | 'medium' | 'high'
                            )
                          }
                          className={getPriorityClass(selectedTask.priority)}
                          disabled={isUpdating}
                        >
                          <option value="low">Низкий</option>
                          <option value="medium">Средний</option>
                          <option value="high">Высокий</option>
                        </select>
                      </div>

                      <div className="task-meta-item">
                        <label>Срок:</label>
                        <input
                          type="date"
                          value={formatDateForInput(selectedTask.dueDate)}
                          onChange={e =>
                            handleLocalTaskChange('dueDate', e.target.value)
                          }
                          disabled={isUpdating}
                        />
                      </div>
                    </div>

                    {/* Add new row for time fields */}
                    <div className="task-meta">
                      <div className="task-meta-item">
                        <label>Время начала:</label>
                        <input
                          type="time"
                          value={selectedTask.startTime || ''}
                          onChange={e =>
                            handleLocalTaskChange('startTime', e.target.value)
                          }
                          disabled={isUpdating}
                        />
                      </div>
                      <div className="task-meta-item">
                        <label>Время окончания:</label>
                        <input
                          type="time"
                          value={selectedTask.endTime || ''}
                          onChange={e =>
                            handleLocalTaskChange('endTime', e.target.value)
                          }
                          disabled={isUpdating}
                        />
                      </div>
                    </div>

                    <div className="task-description-container">
                      <label>Описание:</label>
                      <textarea
                        className="task-description-input"
                        value={selectedTask.description}
                        onChange={e =>
                          handleLocalTaskChange('description', e.target.value)
                        }
                        placeholder="Описание задачи..."
                        disabled={isUpdating}
                      ></textarea>
                    </div>

                    <div className="task-tags-container">
                      <label>Теги:</label>
                      <div className="task-tags-list">
                        {selectedTask.tags.map((tag, index) => (
                          <span key={index} className="task-detail-tag">
                            {tag}
                            <button
                              className="remove-tag-btn"
                              onClick={() =>
                                handleLocalTaskChange(
                                  'tags',
                                  selectedTask.tags.filter(
                                    (_, i) => i !== index
                                  )
                                )
                              }
                              disabled={isUpdating}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          className="add-tag-input"
                          placeholder="Добавить тег..."
                          disabled={isUpdating}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement
                              if (input.value.trim()) {
                                handleLocalTaskChange('tags', [
                                  ...selectedTask.tags,
                                  input.value.trim(),
                                ])
                                input.value = ''
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : isAddingTask ? (
                  <div className="create-task-form">
                    <h2>Создать новую задачу</h2>

                    <div className="form-group">
                      <label>Название:</label>
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={e =>
                          setNewTask({ ...newTask, title: e.target.value })
                        }
                        placeholder="Название задачи"
                        className="form-control"
                        disabled={isUpdating}
                      />
                    </div>

                    <div className="form-group">
                      <label>Описание:</label>
                      <textarea
                        value={newTask.description}
                        onChange={e =>
                          setNewTask({
                            ...newTask,
                            description: e.target.value,
                          })
                        }
                        placeholder="Описание задачи"
                        className="form-control"
                        rows={4}
                        disabled={isUpdating}
                      ></textarea>
                    </div>

                    {/* First row with priority and due date only */}
                    <div className="form-row">
                      <div className="form-group half">
                        <label>Приоритет:</label>
                        <select
                          value={newTask.priority}
                          onChange={e =>
                            setNewTask({
                              ...newTask,
                              priority: e.target.value as
                                | 'low'
                                | 'medium'
                                | 'high',
                            })
                          }
                          className={`form-control ${getPriorityClass(
                            newTask.priority
                          )}`}
                          disabled={isUpdating}
                        >
                          <option value="low">Низкий</option>
                          <option value="medium">Средний</option>
                          <option value="high">Высокий</option>
                        </select>
                      </div>

                      <div className="form-group half">
                        <label>Срок:</label>
                        <input
                          type="date"
                          value={newTask.dueDate || ''}
                          onChange={e =>
                            setNewTask({ ...newTask, dueDate: e.target.value })
                          }
                          className="form-control"
                          disabled={isUpdating}
                        />
                      </div>
                    </div>

                    {/* Separate row for time inputs */}
                    <div className="form-row">
                      <div className="form-group half">
                        <label>Время начала:</label>
                        <input
                          type="time"
                          value={newTask.startTime || ''}
                          onChange={e =>
                            setNewTask({
                              ...newTask,
                              startTime: e.target.value,
                            })
                          }
                          className="form-control"
                          disabled={isUpdating}
                        />
                      </div>
                      <div className="form-group half">
                        <label>Время окончания:</label>
                        <input
                          type="time"
                          value={newTask.endTime || ''}
                          onChange={e =>
                            setNewTask({ ...newTask, endTime: e.target.value })
                          }
                          className="form-control"
                          disabled={isUpdating}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Теги:</label>
                      <div className="tags-input-container">
                        <div className="tags-list">
                          {newTask.tags.map((tag, index) => (
                            <span key={index} className="task-detail-tag">
                              {tag}
                              <button
                                className="remove-tag-btn"
                                onClick={() =>
                                  setNewTask({
                                    ...newTask,
                                    tags: newTask.tags.filter(
                                      (_, i) => i !== index
                                    ),
                                  })
                                }
                                disabled={isUpdating}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Добавить тег и нажать Enter"
                          disabled={isUpdating}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement
                              handleAddTag(input.value)
                              input.value = ''
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        className="btn-cancel"
                        onClick={() => setIsAddingTask(false)}
                        disabled={isUpdating}
                      >
                        Отмена
                      </button>
                      <button
                        className="btn-create"
                        onClick={handleCreateTask}
                        disabled={isUpdating || !newTask.title.trim()}
                      >
                        {isUpdating ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>{' '}
                            Создание...
                          </>
                        ) : (
                          'Создать задачу'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  renderTaskDetails()
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default TasksApp
