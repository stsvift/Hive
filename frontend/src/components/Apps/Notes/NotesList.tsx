import React from 'react'
import { Note } from '../../../types/Note'

interface NotesListProps {
  notes: Note[]
  currentNote: Note | null
  onSelectNote: (note: Note) => void
  isLoading: boolean
}

const NotesList: React.FC<NotesListProps> = ({
  notes,
  currentNote,
  onSelectNote,
  isLoading,
}) => {
  // Safe date formatter that handles string dates or invalid input
  const formatDate = (dateStr: string | Date | undefined): string => {
    if (!dateStr) return 'Unknown date'

    try {
      // Convert string to Date object if needed
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }

      // Format date
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date)
    } catch (error) {
      console.error('Error formatting date:', error, dateStr)
      return 'Error formatting date'
    }
  }

  // Function to get excerpt from content
  const getExcerpt = (content: string, maxLength: number = 100): string => {
    if (!content) return ''
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="notes-list-loading">
        <i className="fas fa-spinner fa-spin loading-spinner"></i>
        <div>Loading notes...</div>
      </div>
    )
  }

  // Show empty state
  if (!notes || notes.length === 0) {
    return (
      <div className="notes-list-empty">
        <i className="far fa-sticky-note"></i>
        <div>No notes found</div>
        <div className="notes-list-tip">
          Create a new note using the + button
        </div>
      </div>
    )
  }

  return (
    <div className="notes-list">
      {notes.map(note => (
        <div
          key={note.id}
          className={`note-list-item ${
            currentNote && currentNote.id === note.id ? 'selected' : ''
          } ${note.isNew ? 'note-new-animation' : ''}`}
          onClick={() => onSelectNote(note)}
          style={{
            borderLeftColor: note.color || undefined,
          }}
        >
          <div className="note-list-item-header">
            <h3 className="note-list-item-title">
              {note.title || 'Untitled Note'}
            </h3>
            <div className="note-list-item-date">
              {formatDate(note.updatedAt || note.createdAt)}
            </div>
          </div>
          <p className="note-list-item-preview">{getExcerpt(note.content)}</p>
          {note.isLocalOnly && (
            <div
              className="note-local-indicator"
              title="This note is stored locally"
            >
              <i className="fas fa-save"></i>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default NotesList
