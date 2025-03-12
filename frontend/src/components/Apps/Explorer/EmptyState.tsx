import React from 'react'

interface EmptyStateProps {
  type: 'folder' | 'task' | 'note'
  onCreateItem?: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onCreateItem }) => {
  const getIcon = () => {
    switch (type) {
      case 'folder':
        return 'fa-folder-open'
      case 'task':
        return 'fa-clipboard-check'
      case 'note':
        return 'fa-sticky-note'
    }
  }

  const getMessage = () => {
    switch (type) {
      case 'folder':
        return 'В этой папке пока нет элементов'
      case 'task':
        return 'В этой папке нет задач'
      case 'note':
        return 'В этой папке нет заметок'
    }
  }

  const getActionText = () => {
    switch (type) {
      case 'folder':
        return 'Создайте новую папку, задачу или заметку с помощью кнопок вверху'
      case 'task':
        return 'Создайте новую задачу с помощью кнопки "Задача" вверху'
      case 'note':
        return 'Создайте новую заметку с помощью кнопки "Заметка" вверху'
    }
  }

  return (
    <div className={`empty-${type}`}>
      <i className={`fas ${getIcon()}`}></i>
      <h3>{getMessage()}</h3>
      <p>{getActionText()}</p>

      {onCreateItem && (
        <button className="explorer-button primary" onClick={onCreateItem}>
          <i
            className={`fas ${
              type === 'folder'
                ? 'fa-folder-plus'
                : type === 'task'
                ? 'fa-tasks'
                : 'fa-sticky-note'
            }`}
          ></i>
          {type === 'folder'
            ? 'Создать папку'
            : type === 'task'
            ? 'Создать задачу'
            : 'Создать заметку'}
        </button>
      )}
    </div>
  )
}

export default EmptyState
