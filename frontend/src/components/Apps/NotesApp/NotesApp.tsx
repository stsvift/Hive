import React, { useEffect, useState } from 'react'
import * as noteService from '../../../services/noteService'
import { Note } from '../../../services/noteService'
import './NotesApp.css'

const NotesApp: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showMobileDetails, setShowMobileDetails] = useState(false)
  // API interaction states
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Состояние для отслеживания несохраненных изменений
  const [isDirty, setIsDirty] = useState(false)
  // Буфер для хранения локальных изменений перед сохранением
  const [editedNote, setEditedNote] = useState<Note | null>(null)

  // Цвета для заметок
  const noteColors = [
    '#FFEAA7', // Светло-медовый
    '#FFB74D', // Оранжевый
    '#81D4FA', // Голубой
    '#A5D6A7', // Зеленый
    '#E1BEE7', // Фиолетовый
    '#FFCC80', // Персиковый
  ]

  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

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

  // Fetch notes from API
  useEffect(() => {
    fetchNotes()
  }, [])

  // Инициализируем editedNote когда activeNote меняется
  useEffect(() => {
    if (activeNote) {
      setEditedNote(activeNote)
      setIsDirty(false)
    } else {
      setEditedNote(null)
      setIsDirty(false)
    }
  }, [activeNote])

  // Function to fetch notes from API
  const fetchNotes = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const fetchedNotes = await noteService.getAllNotes()
      setNotes(fetchedNotes)

      // Select the first note if available
      if (fetchedNotes.length > 0) {
        setActiveNote(fetchedNotes[0])
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err)

      // Показываем понятное сообщение об ошибке
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Не удалось загрузить заметки. Пожалуйста, проверьте подключение к интернету и настройки сервера.'

      setError(errorMessage)
    } finally {
      setIsLoading(false)
      setInitialLoadComplete(true)
    }
  }

  // Фильтрация заметок по поисковому запросу
  const filteredNotes = notes.filter(
    note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Создание новой заметки
  const createNewNote = async () => {
    const randomColor =
      noteColors[Math.floor(Math.random() * noteColors.length)]

    setIsUpdating(true)
    setError(null)

    try {
      const newNoteData = {
        title: 'Новая заметка',
        content: '',
        color: randomColor,
      }

      // Create note via API
      const createdNote = await noteService.createNote(newNoteData)

      setNotes([createdNote, ...notes])
      setActiveNote(createdNote)

      // If on mobile, show details after creating new note
      if (isMobile) {
        setShowMobileDetails(true)
      }
    } catch (err) {
      console.error('Failed to create new note:', err)
      setError(
        'Не удалось создать заметку. Пожалуйста, проверьте подключение к интернету.'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  // Обновление локального состояния заметки (без сохранения на сервер)
  const updateNoteLocally = (updatedFields: Partial<Note>) => {
    if (!editedNote) return

    // Обновляем локальное состояние
    const updatedNote = { ...editedNote, ...updatedFields }
    setEditedNote(updatedNote)
    setIsDirty(true)
  }

  // Сохранение заметки на сервер
  const saveNote = async () => {
    if (!editedNote || !isDirty) return

    setIsUpdating(true)
    setError(null)

    try {
      // Update via API
      const { id, title, content, color } = editedNote
      const updatedApiNote = await noteService.updateNote(id, {
        title,
        content,
        color,
      })

      // Update local state with the response from API
      const updatedNotes = notes.map(note =>
        note.id === id ? updatedApiNote : note
      )

      setNotes(updatedNotes)
      setActiveNote(updatedApiNote)
      setEditedNote(updatedApiNote)
      setIsDirty(false)
    } catch (err) {
      console.error('Failed to update note:', err)
      setError(
        'Не удалось обновить заметку. Пожалуйста, проверьте подключение к интернету.'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  // Удаление заметки
  const deleteNote = async (noteId: string) => {
    setIsUpdating(true)
    setError(null)

    try {
      // Delete via API
      await noteService.deleteNote(noteId)

      const updatedNotes = notes.filter(note => note.id !== noteId)
      setNotes(updatedNotes)

      if (activeNote?.id === noteId) {
        setActiveNote(updatedNotes.length > 0 ? updatedNotes[0] : null)

        // If on mobile, go back to the list view after deletion
        if (isMobile) {
          setShowMobileDetails(false)
        }
      }
    } catch (err) {
      console.error('Failed to delete note:', err)
      setError(
        'Не удалось удалить заметку. Пожалуйста, проверьте подключение к интернету.'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle note selection
  const handleNoteSelect = (note: Note) => {
    // Проверяем, есть ли несохраненные изменения
    if (isDirty && editedNote) {
      if (window.confirm('У вас есть несохраненные изменения. Сохранить?')) {
        saveNote().then(() => {
          setActiveNote(note)
        })
      } else {
        setActiveNote(note)
      }
    } else {
      setActiveNote(note)
    }

    // On mobile, show details view when a note is selected
    if (isMobile) {
      setShowMobileDetails(true)
    }
  }

  // Handle back button in mobile view
  const handleBackToList = () => {
    // Проверяем, есть ли несохраненные изменения
    if (isDirty && editedNote) {
      if (window.confirm('У вас есть несохраненные изменения. Сохранить?')) {
        saveNote().then(() => {
          setShowMobileDetails(false)
        })
      } else {
        setShowMobileDetails(false)
      }
    } else {
      setShowMobileDetails(false)
    }
  }

  // Retry connection to API
  const handleRetry = () => {
    setError(null)
    fetchNotes()
  }

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="notes-app">
      {/* Улучшенная анимация загрузки при первом входе */}
      {isLoading && (
        <div className="notes-loading-overlay">
          <div className="notes-loading-content">
            <div className="notes-animation-container">
              {/* Добавляем эффект парящего блокнота */}
              <div className="notebook-wrapper">
                {/* Добавляем обложку блокнота */}
                <div className="notebook-cover"></div>

                <div className="notebook">
                  <div className="notebook-page">
                    {/* Добавляем чернильные капли */}
                    <div className="ink-drop"></div>
                    <div className="ink-drop"></div>
                    <div className="ink-drop"></div>

                    <div className="typing-text">const notes = [];</div>
                    <div className="typing-text">notes.push('Идеи');</div>
                    <div className="typing-text">// Важные мысли</div>
                  </div>
                  <div className="notebook-page"></div>
                  <div className="notebook-page"></div>
                  <div className="notebook-page"></div>
                </div>
              </div>

              {/* Добавляем плавающее перо */}
              <div className="floating-pen">
                <i className="fas fa-pen-fancy"></i>
              </div>

              {/* Добавляем частички бумаги */}
              <div className="paper-particle"></div>
              <div className="paper-particle"></div>
              <div className="paper-particle"></div>
              <div className="paper-particle"></div>

              {/* Оставляем плавающие иконки */}
              <div className="floating-note">
                <i className="fas fa-sticky-note"></i>
              </div>
              <div className="floating-note">
                <i className="fas fa-edit"></i>
              </div>
              <div className="floating-note">
                <i className="fas fa-file-alt"></i>
              </div>
              <div className="floating-note">
                <i className="fas fa-bookmark"></i>
              </div>
            </div>
            <div className="loading-text">Загружаем ваши заметки</div>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="notes-error">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
          <div className="error-actions">
            <button onClick={handleRetry} className="retry-button">
              <i className="fas fa-sync-alt"></i> Повторить
            </button>
            <button onClick={() => setError(null)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {isMobile && showMobileDetails && editedNote ? (
        // Mobile Details View
        <div className="notes-mobile-view">
          <div className="notes-mobile-header">
            <button className="back-button" onClick={handleBackToList}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <h2>{editedNote.title}</h2>
            <div className="mobile-header-actions">
              {isDirty && (
                <button
                  className="save-button"
                  onClick={saveNote}
                  disabled={isUpdating || !isDirty}
                  aria-label="Сохранить заметку"
                >
                  <i className="fas fa-save"></i>
                </button>
              )}
              <button
                className="delete-button"
                onClick={() => deleteNote(editedNote.id)}
                aria-label="Удалить заметку"
                disabled={isUpdating}
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>

          <div className="notes-mobile-editor">
            <div className="editor-toolbar">
              <div className="color-picker">
                {noteColors.map(color => (
                  <div
                    key={color}
                    className={`color-option ${
                      editedNote.color === color ? 'active' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateNoteLocally({ color })}
                  ></div>
                ))}
              </div>
            </div>

            <input
              className="note-title-input"
              value={editedNote.title}
              onChange={e => updateNoteLocally({ title: e.target.value })}
              placeholder="Заголовок"
              disabled={isUpdating}
            />

            <textarea
              className="note-content-input"
              value={editedNote.content}
              onChange={e => updateNoteLocally({ content: e.target.value })}
              placeholder="Начните вводить текст..."
              disabled={isUpdating}
            />
          </div>
        </div>
      ) : isMobile ? (
        // Mobile List View
        <div className="notes-mobile-view">
          <div className="notes-mobile-header">
            <h2>Заметки</h2>
            <button
              className="add-note-button"
              onClick={createNewNote}
              disabled={isUpdating}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>

          <div className="notes-mobile-list">
            <div className="notes-search">
              <input
                type="text"
                placeholder="Поиск заметок..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="notes-list">
              {filteredNotes.length === 0 ? (
                <div className="no-notes">
                  {notes.length === 0
                    ? 'У вас пока нет заметок. Создайте новую заметку!'
                    : 'Заметки не найдены'}
                </div>
              ) : (
                filteredNotes.map(note => (
                  <div
                    key={note.id}
                    className={`note-item ${
                      activeNote?.id === note.id ? 'active' : ''
                    }`}
                    onClick={() => handleNoteSelect(note)}
                    style={{ borderLeftColor: note.color }}
                  >
                    <div className="note-item-title">{note.title}</div>
                    <div className="note-item-preview">
                      {note.content.substring(0, 60)}
                      {note.content.length > 60 ? '...' : ''}
                    </div>
                    <div className="note-item-date">
                      {formatDate(note.updatedAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // Desktop View (Original Layout)
        <>
          <div className="notes-sidebar">
            <div className="notes-search">
              <input
                type="text"
                placeholder="Поиск заметок..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              className="btn-new-note"
              onClick={createNewNote}
              disabled={isUpdating}
            >
              <i className="fas fa-plus"></i> Новая заметка
            </button>

            <div className="notes-list">
              {filteredNotes.length === 0 ? (
                <div className="no-notes">
                  {notes.length === 0
                    ? 'У вас пока нет заметок. Создайте новую заметку!'
                    : 'Заметки не найдены'}
                </div>
              ) : (
                filteredNotes.map(note => (
                  <div
                    key={note.id}
                    className={`note-item ${
                      activeNote?.id === note.id ? 'active' : ''
                    }`}
                    onClick={() => setActiveNote(note)}
                    style={{ borderLeftColor: note.color }}
                  >
                    <div className="note-item-title">{note.title}</div>
                    <div className="note-item-preview">
                      {note.content.substring(0, 60)}
                      {note.content.length > 60 ? '...' : ''}
                    </div>
                    <div className="note-item-date">
                      {formatDate(note.updatedAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="notes-editor">
            {editedNote ? (
              <>
                <div className="editor-toolbar">
                  <div className="color-picker">
                    {noteColors.map(color => (
                      <div
                        key={color}
                        className={`color-option ${
                          editedNote.color === color ? 'active' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateNoteLocally({ color })}
                      ></div>
                    ))}
                  </div>

                  <div className="toolbar-actions">
                    {isDirty && (
                      <button
                        className="btn-save-note"
                        onClick={saveNote}
                        aria-label="Сохранить заметку"
                        disabled={isUpdating || !isDirty}
                      >
                        <i className="fas fa-save"></i>
                      </button>
                    )}
                    <button
                      className="btn-delete-note"
                      onClick={() => deleteNote(editedNote.id)}
                      aria-label="Удалить заметку"
                      disabled={isUpdating}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>

                <input
                  className="note-title-input"
                  value={editedNote.title}
                  onChange={e => updateNoteLocally({ title: e.target.value })}
                  placeholder="Заголовок"
                  disabled={isUpdating}
                />

                <textarea
                  className="note-content-input"
                  value={editedNote.content}
                  onChange={e => updateNoteLocally({ content: e.target.value })}
                  placeholder="Начните вводить текст..."
                  disabled={isUpdating}
                />
              </>
            ) : (
              <div className="no-active-note">
                <div className="no-note-icon">
                  <i className="fas fa-sticky-note"></i>
                </div>
                <p>Выберите заметку или создайте новую</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotesApp
