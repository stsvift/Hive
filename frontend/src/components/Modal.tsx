import { useEffect, useState } from 'react'
import styles from '../styles/Modal.module.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  type: 'folder' | 'note' | 'task'
  mode: 'create' | 'edit'
  initialData?: any
}

export const Modal = ({
  isOpen,
  onClose,
  onSubmit,
  type,
  mode,
  initialData,
}: ModalProps) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setTitle(type === 'folder' ? initialData.name : initialData.title || '')
      setDescription(initialData.description || '')
      setContent(initialData.content || '')
      if (type === 'task') {
        setDueDate(initialData.deadline || '')
        setDueTime(initialData.time || '')
      }
    }
  }, [initialData, mode, type])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      ...(type === 'folder' && {
        name: title,
        description,
      }),
      ...(type === 'note' && {
        title,
        content,
      }),
      ...(type === 'task' && {
        title,
        description,
        deadline: dueDate && dueTime ? `${dueDate}T${dueTime}:00` : undefined,
      }),
    }

    // Для отладки
    console.log('Form data before submit:', data)

    onSubmit(data)
    handleClose()
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setContent('')
    setDueDate('')
    setDueTime('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>
          {mode === 'create' ? 'Создать' : 'Редактировать'} {getTypeLabel(type)}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="title">
              {type === 'folder' ? 'Название папки' : 'Название'}
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {(type === 'folder' || type === 'task') && (
            <div className={styles.formGroup}>
              <label htmlFor="description">Описание</label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          )}

          {type === 'note' && (
            <div className={styles.formGroup}>
              <label htmlFor="content">Содержание</label>
              <textarea
                id="content"
                value={content}
                onChange={e => setContent(e.target.value)}
                required
              />
            </div>
          )}

          {type === 'task' && (
            <div className={styles.formGroup}>
              <label htmlFor="deadline">Срок выполнения</label>
              <div className={styles.dateTimeInputs}>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
                <input
                  type="time"
                  id="dueTime"
                  value={dueTime}
                  onChange={e => setDueTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" onClick={handleClose}>
              Отмена
            </button>
            <button type="submit">
              {mode === 'create' ? 'Создать' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'folder':
      return 'папку'
    case 'note':
      return 'заметку'
    case 'task':
      return 'задачу'
    default:
      return ''
  }
}
