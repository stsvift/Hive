import React, { useState } from 'react'
import { Folder } from '../../../api/foldersApi'
import './CreateTaskModal.css'

interface CreateTaskModalProps {
  onClose: () => void
  onCreateTask: (
    title: string,
    description: string,
    priority: string,
    deadline?: string
  ) => Promise<void>
  currentFolder: Folder | null
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  onClose,
  onCreateTask,
  currentFolder,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [deadline, setDeadline] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Gets the color for priority visualization
  const getPriorityColor = (priorityValue: string): string => {
    switch (priorityValue) {
      case 'high':
        return 'var(--priority-high, #e74c3c)'
      case 'medium':
        return 'var(--priority-medium, #f39c12)'
      case 'low':
        return 'var(--priority-low, #2ecc71)'
      default:
        return 'var(--priority-medium, #f39c12)'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('Название задачи обязательно')
      return
    }

    try {
      setIsSubmitting(true)
      await onCreateTask(title, description, priority, deadline)
      onClose()
    } catch (err) {
      setError('Не удалось создать задачу. Пожалуйста, попробуйте снова.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>
            <i
              className="fas fa-tasks"
              style={{ color: 'var(--todo-color)' }}
            ></i>
            Новая задача{' '}
            {currentFolder ? `в папке "${currentFolder.name}"` : ''}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && (
            <div className="modal-error">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="taskTitle">Название *</label>
            <input
              type="text"
              id="taskTitle"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Введите название задачи"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="taskDescription">Описание</label>
            <textarea
              id="taskDescription"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Введите описание задачи (опционально)"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="taskPriority">Приоритет</label>
            <div className="priority-selector">
              <select
                id="taskPriority"
                value={priority}
                onChange={e => setPriority(e.target.value)}
                style={{
                  borderLeft: `4px solid ${getPriorityColor(priority)}`,
                }}
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
              <div
                className="priority-indicator"
                style={{ backgroundColor: getPriorityColor(priority) }}
              ></div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="taskDeadline">
              <i className="far fa-clock" style={{ marginRight: '6px' }}></i>
              Срок выполнения (опционально)
            </label>
            <input
              type="datetime-local"
              id="taskDeadline"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="datetime-input"
            />
            <small className="form-helper">
              Оставьте пустым, если срок не ограничен
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-button secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <i className="fas fa-times"></i> Отмена
            </button>
            <button
              type="submit"
              className="modal-button primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Создание...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i> Создать задачу
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTaskModal
