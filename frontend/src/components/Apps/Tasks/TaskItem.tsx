import { useState } from 'react'
import { Task } from '../../../api/tasksApi'
import { isDeadlinePast } from '../../../utils/dateUtils'
import { priorityToString } from '../../../utils/taskUtils'

interface TaskItemProps {
  task: Task
  onEdit: () => void
  onDelete: () => void
  onDragStart: () => void
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onEdit,
  onDelete,
  onDragStart,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  console.log('Raw task received in TaskItem:', task)

  // Basic task validation
  if (!task || typeof task !== 'object') {
    console.error('Invalid task data:', task)
    return null
  }

  // Создаем безопасную копию объекта задачи
  const safeTask = {
    ...task,
    id: task.id?.toString() || Math.random().toString(),
    title: task.title || task.name || 'Без названия', // Handle both title and name fields
    status: task.status || 'todo',
    priority: task.priority || 'medium',
    description: task.description || '',
    createdAt: task.createdAt || new Date().toISOString(),
  }

  console.log('Processed task:', safeTask)

  // Безопасное получение приоритета
  const priority =
    typeof safeTask.priority === 'number'
      ? priorityToString(safeTask.priority)
      : priorityToString(safeTask.priority || 'medium')

  const priorityClass = `priority-${priority}`
  const priorityLabel = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
  }[priority]

  // Check if deadline is past
  const isPastDue = safeTask.deadline
    ? isDeadlinePast(safeTask.deadline)
    : false

  // Additional classes for the task item
  const taskItemClasses = [
    'task-item',
    isExpanded ? 'expanded' : '',
    priorityClass,
    isPastDue ? 'deadline-past' : '',
  ].join(' ')

  // Format date to local format
  const formatDate = (dateStringOrDate: string | Date) => {
    if (!dateStringOrDate) return ''
    try {
      const date = new Date(dateStringOrDate)
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch (e) {
      console.error('Error formatting date:', e)
      return ''
    }
  }

  // Format deadline with time if available
  const formatDeadline = (deadline: Date | string) => {
    if (!deadline) return null

    try {
      const date = new Date(deadline)

      const dateStr = date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })

      const timeStr = date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })

      return `${dateStr} ${timeStr}`
    } catch (e) {
      console.error('Error formatting deadline:', e)
      return String(deadline)
    }
  }

  // Get priority icon
  const getPriorityIcon = () => {
    switch (priority) {
      case 'high':
        return <i className="fas fa-exclamation"></i>
      case 'medium':
        return <i className="fas fa-equals"></i>
      case 'low':
        return <i className="fas fa-minus"></i>
      default:
        return null
    }
  }

  const toggleExpand = (e: React.MouseEvent) => {
    // Prevent expanding when clicking action buttons
    if (
      e.target instanceof Element &&
      (e.target.closest('.task-action-button') ||
        e.target.closest('.task-indicators'))
    ) {
      return
    }
    setIsExpanded(!isExpanded)
  }

  return (
    <div
      className={taskItemClasses}
      draggable={true}
      onDragStart={onDragStart}
      onClick={toggleExpand}
    >
      {/* Overdue indicator banner */}
      {isPastDue && (
        <div className="overdue-banner">
          <i className="fas fa-exclamation-triangle"></i> Просрочено
        </div>
      )}

      <div className="task-header">
        <div className="task-title-row">
          <h4 className="task-title">{safeTask.title}</h4>

          <div className="task-indicators">
            {/* Priority indicator */}
            <div
              className="priority-indicator"
              title={`Приоритет: ${priorityLabel}`}
              style={{
                color:
                  priority === 'high'
                    ? 'var(--priority-high)'
                    : priority === 'low'
                    ? 'var(--priority-low)'
                    : 'var(--priority-medium)',
              }}
            >
              {getPriorityIcon()}
            </div>

            {/* Past due indicator */}
            {isPastDue && (
              <div className="past-due-indicator" title="Задача просрочена">
                <i className="fas fa-clock"></i>
              </div>
            )}
          </div>
        </div>

        <div className="task-meta">
          <span className="task-date">
            <i className="far fa-calendar-alt"></i>{' '}
            {formatDate(safeTask.createdAt)}
          </span>

          {safeTask.deadline && (
            <span
              className={`task-deadline ${isPastDue ? 'deadline-past' : ''}`}
            >
              <i className="fas fa-clock"></i>{' '}
              {formatDeadline(safeTask.deadline)}
            </span>
          )}
        </div>

        {/* Hint that task is expandable */}
        {!isExpanded && (
          <div className="expand-hint">
            <i className="fas fa-chevron-down"></i>
            <span>Нажмите, чтобы показать детали</span>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="task-details" onClick={e => e.stopPropagation()}>
          {safeTask.description ? (
            <div className="task-description">
              <p>{safeTask.description}</p>
            </div>
          ) : (
            <p className="no-description">Описание отсутствует</p>
          )}

          <div className="task-actions">
            <button
              className="task-action-button edit-button"
              onClick={e => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <i className="fas fa-edit"></i> Изменить
            </button>
            <button
              className="task-action-button delete-button"
              onClick={e => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <i className="fas fa-trash"></i> Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
