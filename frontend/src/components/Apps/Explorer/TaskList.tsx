import React, { useEffect, useState } from 'react'
import { taskCompat } from '../../../utils/apiCompat'
import { formatDateTime, priorityToString } from '../../../utils/taskUtils'
import './TaskList.css'

interface Task {
  id: string
  title: string
  description?: string
  priority: string | number
  status: string
  deadline?: string
  reference?: string
  type?: string
  folderId?: string
}

interface TaskListProps {
  tasks: Task[]
  folderId: string
}

// Map status strings to human-readable labels
const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    todo: 'К выполнению',
    in_progress: 'В процессе',
    done: 'Завершено',
  }

  return statusMap[status] || 'К выполнению'
}

// Status string normalization
const normalizeStatus = (status: any): 'todo' | 'in_progress' | 'done' => {
  if (!status) return 'todo'

  const statusStr = String(status).toLowerCase()

  if (statusStr.includes('progress') || statusStr.includes('процесс')) {
    return 'in_progress'
  } else if (statusStr.includes('done') || statusStr.includes('заверш')) {
    return 'done'
  }

  return 'todo'
}

// Priority value normalization
const normalizePriority = (priority: any): 'low' | 'medium' | 'high' => {
  if (!priority) return 'medium'

  if (typeof priority === 'number') {
    if (priority === 1) return 'low'
    if (priority === 3) return 'high'
    return 'medium'
  }

  const priorityStr = String(priority).toLowerCase()
  if (priorityStr === 'low' || priorityStr === '1') return 'low'
  if (priorityStr === 'high' || priorityStr === '3') return 'high'

  return 'medium'
}

// Get color for priority
const getPriorityColor = (priority: any): string => {
  const normalizedPriority = normalizePriority(priority)

  switch (normalizedPriority) {
    case 'high':
      return 'var(--priority-high, #e74c3c)'
    case 'medium':
      return 'var(--priority-medium, #f39c12)'
    case 'low':
      return 'var(--priority-low, #2ecc71)'
    default:
      return 'var(--text-secondary, #95a5a6)'
  }
}

// Check if deadline is soon
const isDeadlineSoon = (deadlineStr?: string): boolean => {
  if (!deadlineStr) return false

  const deadline = new Date(deadlineStr)
  const now = new Date()

  // Calculate difference in hours
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)

  // Return true if deadline is within next 24 hours and not passed
  return diffHours > 0 && diffHours <= 24
}

// Check if deadline is past
const isDeadlinePast = (deadlineStr?: string): boolean => {
  if (!deadlineStr) return false

  const deadline = new Date(deadlineStr)
  const now = new Date()

  return deadline < now
}

const TaskList: React.FC<TaskListProps> = ({ tasks, folderId }) => {
  const [tasksByStatus, setTasksByStatus] = useState<{
    todo: Task[]
    in_progress: Task[]
    done: Task[]
  }>({ todo: [], in_progress: [], done: [] })

  useEffect(() => {
    // Group tasks by status
    const processTasks = (tasksToProcess: Task[]) => {
      // Group tasks by normalized status
      const grouped = {
        todo: [] as Task[],
        in_progress: [] as Task[],
        done: [] as Task[],
      }

      // In empty folders, we should be more lenient about folder ID matching
      const isEmptyFolder = tasks.length === 0

      tasksToProcess.forEach(task => {
        // For empty folders or when folderId is missing in the task, show all tasks
        // Otherwise, strictly verify the task belongs to this folder
        const shouldIncludeTask =
          isEmptyFolder ||
          !task.folderId ||
          String(task.folderId) === String(folderId)

        if (shouldIncludeTask) {
          const status = normalizeStatus(task.status)
          grouped[status].push({ ...task, folderId: folderId }) // Ensure folderId is set
        }
      })

      setTasksByStatus(grouped)
    }

    // If folder exists but is empty, and we have an empty task list:
    if (tasks.length === 0 && folderId) {
      // If no tasks provided but we have a folder ID, try to load tasks directly
      const loadTasks = async () => {
        try {
          const folderTasks = await taskCompat.findTasksByFolder(folderId)
          if (folderTasks.length > 0) {
            // Check that tasks actually belong to the current folder
            const filteredTasks = folderTasks.filter(
              task =>
                String(task.folderId || task.folder_id || '') ===
                String(folderId)
            )

            // Process the tasks the same way as provided tasks
            processTasks(
              filteredTasks.map(task => ({
                id: String(task.id),
                title: task.title || task.name || `Task ${task.id}`,
                description: task.description || '',
                priority: task.priority || 'medium',
                status: task.status || 'todo',
                deadline: task.deadline,
                reference: String(task.id),
                type: 'task',
                folderId: String(folderId), // Explicitly add folderId
              }))
            )
            return
          }
        } catch (error) {
          // Silent error handling
        }

        // If tasks couldn't be loaded or there are none, process an empty array
        processTasks([])
      }

      loadTasks()
    } else {
      // Check received tasks for belonging to the current folder,
      // but for empty folders allow all tasks
      const filteredTasks = tasks.filter(task => {
        const taskFolderId = task.folderId || ''
        return !taskFolderId || String(taskFolderId) === String(folderId)
      })

      // Process filtered tasks
      processTasks(filteredTasks)
    }
  }, [tasks, folderId])

  // Render a single task item
  const renderTaskItem = (task: Task) => {
    const normalizedStatus = normalizeStatus(task.status)
    const normalizedPriority = normalizePriority(task.priority)
    const isPast = isDeadlinePast(task.deadline)
    const isSoon = isDeadlineSoon(task.deadline)

    return (
      <div
        key={`task-${task.id || task.reference || Math.random().toString()}`}
        className="folder-item task-item"
        style={
          {
            '--folder-color': getPriorityColor(task.priority),
          } as React.CSSProperties
        }
      >
        <div
          className={`priority-indicator priority-${normalizedPriority}`}
        ></div>
        <div className="folder-icon">
          <i className="fas fa-tasks"></i>
        </div>
        <div className="folder-info">
          <div className="folder-name">{task.title}</div>
          <div className="folder-description">
            {task.description
              ? task.description.substring(0, 80) +
                (task.description.length > 80 ? '...' : '')
              : 'Описание отсутствует'}

            {task.deadline && (
              <div className={`task-deadline ${isPast ? 'deadline-past' : ''}`}>
                <i
                  className={`fas fa-${
                    isPast
                      ? 'exclamation-circle'
                      : isSoon
                      ? 'hourglass-half'
                      : 'clock'
                  }`}
                ></i>{' '}
                <span>
                  {formatDateTime(task.deadline)}
                  {(isPast || isSoon) && (
                    <span className="deadline-warning">
                      {isPast ? ' (просрочено)' : ' (скоро)'}
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="task-properties">
              <span
                className="task-priority"
                style={{ color: getPriorityColor(task.priority) }}
              >
                <i className="fas fa-flag"></i>{' '}
                {priorityToString(task.priority) === 'low'
                  ? 'Низкий'
                  : priorityToString(task.priority) === 'medium'
                  ? 'Средний'
                  : 'Высокий'}
              </span>
            </div>
          </div>
        </div>
        <div className="task-status">
          <span className={`status-badge status-${normalizedStatus}`}>
            {getStatusLabel(normalizedStatus)}
          </span>
        </div>
      </div>
    )
  }

  // Get icons for column headers
  const getColumnIcon = (status: string): string => {
    switch (status) {
      case 'todo':
        return 'fa-clipboard-list'
      case 'in_progress':
        return 'fa-spinner'
      case 'done':
        return 'fa-check-circle'
      default:
        return 'fa-tasks'
    }
  }

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <div className="task-list-title">
          <i className="fas fa-tasks"></i>
          Задачи
        </div>
        <span className="task-count">{tasks.length} всего</span>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-task-list">
          <i className="fas fa-clipboard-check"></i>
          <p>В этой папке нет задач</p>
          <p className="hint">
            Создайте новую задачу с помощью кнопки "Создать задачу" вверху.
          </p>
        </div>
      ) : (
        <div className="task-columns-container">
          <div className="task-column todo-column">
            <h3 className="column-header">
              <i className={`fas ${getColumnIcon('todo')}`}></i>К выполнению
            </h3>
            <div className="task-column-items">
              {tasksByStatus.todo.map(renderTaskItem)}
              {tasksByStatus.todo.length === 0 && (
                <div className="empty-column-message">
                  Нет задач к выполнению
                </div>
              )}
            </div>
          </div>

          <div className="task-column in-progress-column">
            <h3 className="column-header">
              <i className={`fas ${getColumnIcon('in_progress')}`}></i>В
              процессе
            </h3>
            <div className="task-column-items">
              {tasksByStatus.in_progress.map(renderTaskItem)}
              {tasksByStatus.in_progress.length === 0 && (
                <div className="empty-column-message">Нет задач в процессе</div>
              )}
            </div>
          </div>

          <div className="task-column done-column">
            <h3 className="column-header">
              <i className={`fas ${getColumnIcon('done')}`}></i>
              Завершено
            </h3>
            <div className="task-column-items">
              {tasksByStatus.done.map(renderTaskItem)}
              {tasksByStatus.done.length === 0 && (
                <div className="empty-column-message">
                  Нет завершенных задач
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskList
