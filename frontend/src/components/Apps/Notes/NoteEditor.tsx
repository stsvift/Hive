import React, { useEffect, useState } from 'react'
import { Note } from '../../../types/Note'

interface NoteEditorProps {
  note: Note
  onUpdateNote: (
    id: number,
    data: { title?: string; content?: string; color?: string }
  ) => Promise<void>
  onDeleteNote: (id: number) => Promise<void>
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [selectedColor, setSelectedColor] = useState(note.color || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isEdited, setIsEdited] = useState(false)

  // Color options
  const colors = [
    { value: '#f28b82', name: 'Red' },
    { value: '#fbbc04', name: 'Orange' },
    { value: '#fff475', name: 'Yellow' },
    { value: '#ccff90', name: 'Green' },
    { value: '#a7ffeb', name: 'Teal' },
    { value: '#cbf0f8', name: 'Blue' },
    { value: '#aecbfa', name: 'Dark blue' },
    { value: '#d7aefb', name: 'Purple' },
    { value: '#fdcfe8', name: 'Pink' },
  ]

  // Update local state when note prop changes
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    setSelectedColor(note.color || '')
    setIsEdited(false)
  }, [note])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    setIsEdited(true)
  }

  // Простая обработка изменения контента через textarea
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setIsEdited(true)
  }

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    setShowColorPicker(false)
    setIsEdited(true)
  }

  const handleSave = async () => {
    if (!isEdited) {
      console.log('No changes to save')
      return
    }

    try {
      setIsSaving(true)
      console.log(
        `Saving note ${note.id} with title: ${title}, content length: ${content.length}`
      )

      // Создаем payload для обновления
      const updateData = {
        title,
        content,
        color: selectedColor,
      }

      // Вызываем функцию обновления из props
      await onUpdateNote(note.id, updateData)
      console.log('Save successful')
      setIsEdited(false)
    } catch (error) {
      console.error('Failed to save note:', error)
      // Мы не сбрасываем isEdited, чтобы пользователь мог попробовать снова
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save functionality - save after 2 seconds of inactivity
  useEffect(() => {
    if (!isEdited) return

    const autoSaveTimer = setTimeout(() => {
      console.log('Auto-saving changes...')
      handleSave()
    }, 2000)

    return () => clearTimeout(autoSaveTimer)
  }, [title, content, selectedColor, isEdited])

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        {/* Make sure buttons are visible with proper styling */}
        <div
          className="note-actions"
          style={{ display: 'flex', visibility: 'visible' }}
        >
          {isSaving && (
            <span className="saving-indicator">
              <i className="fas fa-sync-alt fa-spin"></i> Сохранение...
            </span>
          )}

          <button
            className="note-action-button save-button"
            onClick={handleSave}
            disabled={!isEdited}
            title="Сохранить изменения"
            style={{ display: 'flex' }}
          >
            <i className="fas fa-save"></i>
          </button>

          <div className="note-color-picker-container">
            <button
              className="note-action-button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Выбрать цвет заметки"
              style={{
                color: selectedColor || 'var(--text-color)',
                backgroundColor: selectedColor
                  ? selectedColor + '33'
                  : undefined,
                display: 'flex',
              }}
            >
              <i className="fas fa-palette"></i>
            </button>

            {showColorPicker && (
              <div className="color-picker-dropdown">
                {colors.map(color => (
                  <div
                    key={color.value}
                    className={`color-option ${
                      selectedColor === color.value ? 'selected' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleColorChange(color.value)}
                    title={color.name}
                  />
                ))}
                <div
                  className={`color-option ${!selectedColor ? 'selected' : ''}`}
                  style={{ backgroundColor: 'transparent' }}
                  onClick={() => handleColorChange('')}
                  title="Без цвета"
                >
                  <i className="fas fa-ban"></i>
                </div>
              </div>
            )}
          </div>

          <button
            className="note-action-button delete-button"
            onClick={() => onDeleteNote(note.id)}
            title="Удалить заметку"
            style={{ display: 'flex' }}
          >
            <i className="far fa-trash-alt"></i>
          </button>
        </div>

        <input
          type="text"
          className="note-title-input"
          value={title}
          onChange={handleTitleChange}
          placeholder="Заголовок заметки"
        />
      </div>

      {/* Заменяем contentEditable на обычный textarea */}
      <textarea
        className="note-content-editor"
        value={content}
        onChange={handleContentChange}
        placeholder="Текст заметки..."
      />

      <div className="note-editor-footer">
        <div className="note-info">
          {note.updatedAt ? (
            <span>
              Updated: {new Date(note.updatedAt).toLocaleString('ru-RU')}
            </span>
          ) : (
            <span>
              Created: {new Date(note.createdAt).toLocaleString('ru-RU')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default NoteEditor
