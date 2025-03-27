import React from 'react'
import './TaskCard.css'

export interface TaskCardProps {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in-progress' | 'completed'
  dueDate?: string
  tags?: string[]
  icon?: string
  onClick: () => void
}

const TaskCard: React.FC<TaskCardProps> = ({
  id,
  title,
  description,
  priority,
  status,
  dueDate,
  tags = [],
  icon = 'tasks',
  onClick,
}) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return 'var(--color-danger)'
      case 'medium':
        return 'var(--color-warning)'
      case 'low':
        return 'var(--color-success)'
      default:
        return 'var(--color-primary)'
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'todo':
        return { text: 'К выполнению', class: 'badge-todo' }
      case 'in-progress':
        return { text: 'В работе', class: 'badge-progress' }
      case 'completed':
        return { text: 'Завершено', class: 'badge-completed' }
      default:
        return { text: 'К выполнению', class: 'badge-todo' }
    }
  }

  const statusBadge = getStatusBadge()
  const formattedDate = dueDate
    ? new Date(dueDate).toLocaleDateString('ru-RU', {
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <div className="task-card" onClick={onClick} data-id={id}>
      <div className="task-card-header">
        <div className="task-icon">
          <i className={`fas fa-${icon}`}></i>
        </div>
        <div className="task-card-badges">
          <span className={`task-badge ${statusBadge.class}`}>
            {statusBadge.text}
          </span>
          {dueDate && (
            <span className="task-date">
              <i className="far fa-calendar-alt"></i> {formattedDate}
            </span>
          )}
        </div>
      </div>

      <h3 className="task-title">{title}</h3>
      <p className="task-description">{description}</p>

      <div className="task-card-footer">
        {tags.length > 0 && (
          <div className="task-tags">
            {tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="task-tag">
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="task-tag task-tag-more">+{tags.length - 2}</span>
            )}
          </div>
        )}
        <div
          className="task-priority"
          style={{ backgroundColor: getPriorityColor() }}
        ></div>
      </div>
    </div>
  )
}

export default TaskCard
