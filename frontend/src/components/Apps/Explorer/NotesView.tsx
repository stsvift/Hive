import React, { useState } from 'react'
import { Note } from '../../../api/notesApi'
import { formatDateTime } from '../../../utils/taskUtils'
import './NotesView.css'

interface NotesViewProps {
  notes: Note[]
  folderId: string
}

const NotesView: React.FC<NotesViewProps> = ({ notes, folderId }) => {
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

  if (!notes || notes.length === 0) {
    return (
      <div className="section-empty">
        <i className="fas fa-sticky-note"></i>
        <p>No notes in this folder</p>
        <p className="hint">Create a new note using the "Add" button above.</p>
      </div>
    )
  }

  const toggleExpandNote = (noteId: string) => {
    if (expandedNoteId === noteId) {
      setExpandedNoteId(null)
    } else {
      setExpandedNoteId(noteId)
    }
  }

  return (
    <div className="notes-container">
      {notes.map(note => {
        const isExpanded = expandedNoteId === String(note.id)
        const noteId = String(note.id)

        return (
          <div
            key={noteId}
            className={`note-card ${isExpanded ? 'expanded' : ''}`}
            onClick={() => toggleExpandNote(noteId)}
          >
            <div className="note-header">
              <h4 className="note-title">{note.title || 'Untitled Note'}</h4>
              <span className="note-date">
                {formatDateTime(note.createdAt || '')}
              </span>
            </div>

            <div className="note-content">
              {isExpanded ? (
                <div className="note-full-content">
                  {note.content || 'No content'}
                </div>
              ) : (
                <div className="note-preview">
                  {note.content
                    ? note.content.substring(0, 100) +
                      (note.content.length > 100 ? '...' : '')
                    : 'No content'}
                </div>
              )}
            </div>

            <div className="note-actions">
              <button className="note-action-btn">
                <i className="fas fa-edit"></i>
              </button>
              <button className="note-action-btn">
                <i className="fas fa-trash"></i>
              </button>
              <button className="note-action-btn expand-btn">
                <i
                  className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}
                ></i>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default NotesView
