import { useCallback, useEffect, useState } from 'react'
import { Task, tasksApi } from '../../../api/tasksApi'
import { TaskForm } from './TaskForm'
import { TaskList } from './TaskList'
import './Tasks.css' // Import our new CSS

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<any>({
    page: 1,
    pageSize: 10,
  })
  const [totalTasks, setTotalTasks] = useState(0)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isCreatingAnimation, setIsCreatingAnimation] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Fetch tasks based on current filters
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await tasksApi.getTasks(filters)
      console.log('Raw API response:', response)

      // Handle both array response and object response with tasks property
      const tasksArray = Array.isArray(response)
        ? response
        : response?.tasks || []
      console.log('Tasks array:', tasksArray)

      // Process each task individually with better error handling
      const processedTasks = tasksArray
        .map(task => {
          if (!task) return null

          return {
            ...task,
            id: task.id?.toString() || Math.random().toString(),
            title: task.title || task.name || 'Без названия', // Handle both title and name fields
            status: task.status || 'todo',
            priority: task.priority || 'medium',
          }
        })
        .filter(Boolean) // Remove any null tasks

      console.log('Final processed tasks:', processedTasks)
      setTasks(processedTasks)
      setTotalTasks(processedTasks.length)
    } catch (err: any) {
      console.error('Error fetching tasks:', err)
      setError(err.message || 'Failed to fetch tasks')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleCreateTask = async (task: any) => {
    try {
      setIsCreating(true)
      setIsCreatingAnimation(true)

      // Send the task data with explicit field values and numeric priority
      const taskData = {
        title: task.title,
        description: task.description || '',
        priority:
          typeof task.priority === 'string'
            ? stringToPriority(task.priority)
            : task.priority,
        status: stringToStatus(task.status || 'todo'),
        isCompleted: task.status === 'done',
        deadline: task.deadline,
      }

      await tasksApi.createTask(taskData)
      setNotification({
        message: 'Задача успешно создана!',
        type: 'success',
      })

      // Force refresh tasks after creation
      setTimeout(() => {
        fetchTasks()
      }, 300)

      setIsFormOpen(false)
    } catch (err: any) {
      console.error('Error in handleCreateTask:', err)
      setNotification({
        message: err.message || 'Ошибка при создании задачи',
        type: 'error',
      })
    } finally {
      // Delay hiding animation for better UX
      setTimeout(() => {
        setIsCreating(false)
        setIsCreatingAnimation(false)
      }, 800)
    }
  }

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      setLoading(true)

      // Format the updates properly for the API with numeric priority
      const updatesData = {
        title: updates.title,
        description: updates.description || '',
        priority:
          typeof updates.priority === 'string'
            ? stringToPriority(updates.priority)
            : updates.priority,
        status: stringToStatus(updates.status),
        isCompleted: updates.status === 'done',
        deadline: updates.deadline,
      }

      // Send the update request
      await tasksApi.updateTask(taskId, updatesData)

      setNotification({
        message: 'Задача успешно обновлена!',
        type: 'success',
      })
      fetchTasks()
      setEditingTask(null)
      setIsFormOpen(false)
    } catch (err: any) {
      console.error('Error updating task:', err)
      setNotification({
        message: err.message || 'Ошибка при обновлении задачи',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту задачу?')) return

    try {
      setLoading(true)
      await tasksApi.deleteTask(taskId)
      setNotification({
        message: 'Задача успешно удалена!',
        type: 'success',
      })
      fetchTasks()
    } catch (err: any) {
      setNotification({
        message: err.message || 'Ошибка при удалении задачи',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (
    taskId: string,
    newStatus: 'todo' | 'in_progress' | 'done'
  ) => {
    try {
      // First get the existing task to preserve all data
      const existingTask = tasks.find(task => task.id === taskId)

      if (!existingTask) {
        console.error('Task not found:', taskId)
        return
      }

      // Only update the status and isCompleted fields, preserve all other data
      const updateData = {
        status: newStatus,
        isCompleted: newStatus === 'done',
      }

      await tasksApi.updateTask(taskId, updateData)

      // Update task status locally to avoid refetching
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus, isCompleted: newStatus === 'done' }
            : task
        )
      )

      setNotification({
        message: 'Статус задачи обновлен!',
        type: 'success',
      })
    } catch (err: any) {
      console.error('Error changing status:', err)
      setNotification({
        message: err.message || 'Ошибка при изменении статуса',
        type: 'error',
      })
    }
  }

  // Helper functions to standardize status and priority values
  function stringToStatus(status: string): string {
    status = String(status).toLowerCase()
    if (status.includes('progress') || status === 'in_progress') {
      return 'in_progress'
    } else if (
      status.includes('done') ||
      status === 'completed' ||
      status.includes('finish')
    ) {
      return 'done'
    }
    return 'todo'
  }

  function stringToPriority(priority: string | number): number {
    if (typeof priority === 'number') {
      return priority >= 1 && priority <= 3 ? priority : 2
    }

    priority = String(priority).toLowerCase()
    if (priority === 'high' || priority === '3') return 3
    if (priority === 'low' || priority === '1') return 1
    return 2 // Medium is default
  }

  // Calculate statistics
  const completedTasks = tasks.filter(
    task => task.status === 'done' || task.isCompleted
  ).length
  const totalTaskCount = tasks.length
  const completionPercentage =
    totalTaskCount > 0 ? Math.round((completedTasks / totalTaskCount) * 100) : 0

  return (
    <div className="tasks-container">
      <div className="tasks-sidebar">
        <div className="tasks-sidebar-header">
          <h1>Задачи</h1>
          <button
            className={`create-task-btn ${isCreating ? 'creating' : ''}`}
            onClick={() => setIsFormOpen(true)}
            disabled={isCreating}
          >
            {isCreating ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-plus"></i>
            )}
          </button>
        </div>

        <div className="tasks-search">
          <input
            type="text"
            placeholder="Поиск задач..."
            value={filters.search || ''}
            onChange={e =>
              setFilters(prev => ({ ...prev, search: e.target.value }))
            }
          />
          <i className="fas fa-search search-icon"></i>
        </div>

        {/* Enhanced task counters with icons */}
        <div className="task-counters">
          <div className="counter-title">
            <i className="fas fa-chart-pie"></i>
            Сводка задач
          </div>
          <div className="counter-grid">
            <div className="counter-item">
              <div className="counter-icon">
                <i className="fas fa-tasks"></i>
              </div>
              <div className="counter-value">{totalTaskCount}</div>
              <div className="counter-label">Всего</div>
            </div>
            <div className="counter-item">
              <div className="counter-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="counter-value">{completedTasks}</div>
              <div className="counter-label">Готово</div>
            </div>
            <div className="counter-item">
              <div className="counter-icon">
                <i className="fas fa-spinner"></i>
              </div>
              <div className="counter-value">
                {totalTaskCount - completedTasks}
              </div>
              <div className="counter-label">Активных</div>
            </div>
          </div>
        </div>

        {/* Remove duplicate task summary component */}
      </div>

      <div className="tasks-main">
        <div className="tasks-header">
          <h2 className="tasks-title">Доска задач</h2>
          <div className="tasks-actions">
            <button className="task-action" onClick={() => setIsFormOpen(true)}>
              <i className="fas fa-plus"></i>
              Новая задача
            </button>
          </div>
        </div>

        {loading && tasks.length === 0 ? (
          <div className="task-loading">
            <i className="fas fa-spinner"></i>
            <p>Загрузка задач...</p>
          </div>
        ) : error ? (
          <div className="task-error">
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="no-tasks">
            <div className="no-tasks-icon">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <h3>У вас пока нет задач</h3>
            <p>Создайте новую задачу, чтобы начать работу</p>
            <button
              className="new-task-btn"
              onClick={() => setIsFormOpen(true)}
            >
              <i className="fas fa-plus"></i>
              Создать новую задачу
            </button>
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
            loading={loading}
          />
        )}
      </div>

      {/* Task Form Modal */}
      {isFormOpen && (
        <div
          className="task-form-container"
          onClick={() => !isCreating && setIsFormOpen(false)}
        >
          <div className="task-form" onClick={e => e.stopPropagation()}>
            <TaskForm
              task={editingTask}
              onSubmit={
                editingTask
                  ? updates =>
                      handleUpdateTask(editingTask.id.toString(), updates)
                  : handleCreateTask
              }
              onCancel={() => {
                setIsFormOpen(false)
                setEditingTask(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Creating task animation */}
      {isCreatingAnimation && (
        <div className="task-creating-overlay">
          <div className="task-creating-animation">
            <i className="fas fa-tasks task-icon-animated"></i>
            <p>Создание задачи...</p>
          </div>
        </div>
      )}

      {/* Notification component */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <i
            className={`fas fa-${
              notification.type === 'success'
                ? 'check-circle'
                : 'exclamation-circle'
            }`}
          ></i>
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  )
}

export default Tasks
