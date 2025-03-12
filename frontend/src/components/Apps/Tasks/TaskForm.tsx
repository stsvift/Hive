import React, { useEffect, useState } from 'react'
import { Task } from '../../../api/tasksApi'

interface TaskFormProps {
  task: Task | null
  onSubmit: (task: any) => void
  onCancel: () => void
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    deadline: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (task) {
      // Convert deadline from ISO string to input date format if present
      let deadlineValue = ''
      if (task.deadline) {
        try {
          const date = new Date(task.deadline)
          deadlineValue = date.toISOString().split('T')[0]
        } catch (e) {
          console.error('Error parsing deadline:', e)
        }
      }

      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority:
          typeof task.priority === 'number'
            ? task.priority === 3
              ? 'high'
              : task.priority === 1
              ? 'low'
              : 'medium'
            : task.priority || 'medium',
        deadline: deadlineValue,
      })
    }
  }, [task])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear errors when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Название задачи обязательно'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSubmit(formData)
  }

  return (
    <>
      <h2 className="form-title">
        {task ? 'Редактировать задачу' : 'Новая задача'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-content">
          <div className="form-group">
            <label htmlFor="title">Название</label>
            <input
              type="text"
              id="title"
              name="title"
              className={`form-control ${errors.title ? 'error' : ''}`}
              value={formData.title}
              onChange={handleChange}
              placeholder="Введите название задачи"
            />
            {errors.title && (
              <span className="error-message">{errors.title}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              placeholder="Введите описание задачи (необязательно)"
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Статус</label>
              <select
                id="status"
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="todo">К выполнению</option>
                <option value="in_progress">В процессе</option>
                <option value="done">Завершено</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Приоритет</label>
              <select
                id="priority"
                name="priority"
                className="form-control"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="deadline">Срок выполнения (необязательно)</label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              className="form-control"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="button-cancel" onClick={onCancel}>
            <i className="fas fa-times"></i> Отмена
          </button>
          <button type="submit" className="button-submit">
            <i className="fas fa-save"></i> {task ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </>
  )
}
