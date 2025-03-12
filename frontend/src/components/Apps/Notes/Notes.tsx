import React, { useEffect, useState } from 'react'
import {
  createNote,
  deleteNote,
  getAllNotes,
  updateNote,
} from '../../../services/noteService'
import { Note } from '../../../types/Note'
// Fix import path for notifications
import { useNotifications } from '../../../hooks/useNotifications'
import NoteEditor from './NoteEditor'
import './Notes.css'
import NotesList from './NotesList'

const Notes: React.FC = () => {
  // Always initialize notes as an array
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isCreatingAnimation, setIsCreatingAnimation] = useState(false)

  // Use notifications hook
  const { addNotification, notificationsComponent } = useNotifications()

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    setIsLoading(true)
    try {
      const fetchedNotes = await getAllNotes()
      console.log('Fetched notes:', fetchedNotes)

      // Обрабатываем полученные данные
      if (Array.isArray(fetchedNotes)) {
        setNotes(fetchedNotes)

        // Выбираем первую заметку, если нет текущей
        if (!currentNote && fetchedNotes.length > 0) {
          setCurrentNote(fetchedNotes[0])
        }
      } else {
        console.error('API did not return an array for notes:', fetchedNotes)
        setNotes([])
        setError('Получены некорректные данные от сервера')
      }
    } catch (err: any) {
      console.error('Failed to fetch notes:', err)
      setError(err.message || 'Ошибка при загрузке заметок')
      addNotification('Ошибка при загрузке заметок', 'error')
      setNotes([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNote = async () => {
    try {
      setIsCreatingAnimation(true)
      setIsCreating(true)

      const noteTemplate = {
        title: 'Новая заметка',
        content: '',
      }

      // Создаем заметку через API
      const newNote = await createNote(noteTemplate)
      console.log('New note created:', newNote)

      // Добавляем заметку в состояние
      setNotes(prevNotes => [{ ...newNote, isNew: true }, ...prevNotes])
      setCurrentNote(newNote)
      addNotification('Заметка успешно создана', 'success')

      // Анимация завершения
      setTimeout(() => {
        setIsCreating(false)
        setIsCreatingAnimation(false)
        // Убираем флаг isNew
        setNotes(prevNotes =>
          prevNotes.map(note =>
            note.id === newNote.id ? { ...note, isNew: false } : note
          )
        )
      }, 800)
    } catch (err: any) {
      console.error('Failed to create note:', err)
      setError(err.message || 'Неизвестная ошибка при создании заметки')
      addNotification('Ошибка при создании заметки', 'error')
    } finally {
      if (isCreating) {
        setIsCreating(false)
        setIsCreatingAnimation(false)
      }
    }
  }

  const handleUpdateNote = async (
    id: number,
    data: { title?: string; content?: string; color?: string }
  ) => {
    try {
      // Обновляем через API
      const updatedNote = await updateNote(id, data)

      // Обновляем состояние
      setNotes(notes.map(note => (note.id === id ? updatedNote : note)))
      setCurrentNote(updatedNote)
      addNotification('Заметка успешно обновлена', 'success')
    } catch (err: any) {
      console.error('Failed to update note:', err)
      setError(err.message || 'Ошибка при обновлении заметки')
      addNotification('Ошибка при обновлении заметки', 'error')
    }
  }

  const handleDeleteNote = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту заметку?')) {
      return
    }

    try {
      // Удаляем через API
      await deleteNote(id)

      // Обновляем состояние
      const updatedNotes = notes.filter(note => note.id !== id)
      setNotes(updatedNotes)

      // Если удалили текущую заметку, выбираем другую
      if (currentNote && currentNote.id === id) {
        setCurrentNote(updatedNotes.length > 0 ? updatedNotes[0] : null)
      }

      addNotification('Заметка успешно удалена', 'success')
    } catch (err: any) {
      console.error('Failed to delete note:', err)
      setError(err.message || 'Ошибка при удалении заметки')
      addNotification('Ошибка при удалении заметки', 'error')
    }
  }

  const handleNoteSelect = (note: Note) => {
    setCurrentNote(note)
  }

  const filteredNotes = Array.isArray(notes)
    ? notes.filter(note => {
        if (!searchQuery) return true
        return (
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    : []

  return (
    <div className="notes-container">
      {/* Компонент уведомлений отрендерится здесь */}
      {notificationsComponent}

      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <h1>Заметки</h1>
          <button
            className={`create-note-btn ${isCreating ? 'creating' : ''}`}
            onClick={handleCreateNote}
            disabled={isCreating}
          >
            {isCreating ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-plus"></i>
            )}
          </button>
        </div>

        <div className="notes-search">
          <input
            type="text"
            placeholder="Поиск заметок..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <i className="fas fa-search search-icon"></i>
        </div>

        <NotesList
          notes={filteredNotes}
          currentNote={currentNote}
          onSelectNote={handleNoteSelect}
          isLoading={isLoading}
        />
      </div>

      <div className="notes-editor-container">
        {currentNote ? (
          <NoteEditor
            note={currentNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        ) : (
          <div className="no-note-selected">
            <div className="no-note-icon">
              <i className="far fa-sticky-note"></i>
            </div>
            <h3>Нет выбранной заметки</h3>
            <p>Выберите заметку из списка слева или создайте новую</p>
            <button
              className={`new-note-btn ${isCreating ? 'creating' : ''}`}
              onClick={handleCreateNote}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Создание...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i> Создать новую заметку
                </>
              )}
            </button>
          </div>
        )}

        {isCreatingAnimation && !currentNote && (
          <div className="note-creating-overlay">
            <div className="note-creating-animation">
              <i className="fas fa-sticky-note note-icon-animated"></i>
              <p>Создание заметки...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notes
