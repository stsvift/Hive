import React from 'react'
import { Note } from '../../../types/Note'
import NoteCard from './NoteCard'

interface NoteListProps {
  notes: Note[]
  currentNote: Note | null
  onSelectNote: (note: Note) => void
  isLoading: boolean
}

const NoteList: React.FC<NoteListProps> = ({
  notes,
  currentNote,
  onSelectNote,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="notes-loading">
        <div className="notes-loading-spinner">
          <div className="spinner"></div>
        </div>
        <p>Загрузка заметок...</p>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="notes-empty">
        <div className="empty-icon">
          <i className="far fa-folder-open"></i>
        </div>
        <p>Нет доступных заметок</p>
      </div>
    )
  }

  return (
    <div className="notes-list">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          isActive={currentNote?.id === note.id}
          onClick={() => onSelectNote(note)}
        />
      ))}
    </div>
  )
}

export default NoteList
