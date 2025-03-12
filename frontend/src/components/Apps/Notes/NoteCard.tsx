import React from 'react'
import { Note } from '../../../types/Note'

interface NoteCardProps {
  note: Note
  isActive: boolean
  onClick: () => void
}

const NoteCard: React.FC<NoteCardProps> = ({ note, isActive, onClick }) => {
  // Format date in user-friendly way
  const formatDate = (date: Date) => {
    const now = new Date()
    const noteDate = new Date(date)

    // If today, show just time
    if (
      noteDate.getDate() === now.getDate() &&
      noteDate.getMonth() === now.getMonth() &&
      noteDate.getFullYear() === now.getFullYear()
    ) {
      return `Сегодня, ${noteDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    }

    // If this year, show day and month
    if (noteDate.getFullYear() === now.getFullYear()) {
      return noteDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      })
    }

    // Otherwise show full date
    return noteDate.toLocaleDateString('ru-RU')
  }

  // Get excerpt of the content
  const getExcerpt = (content: string, maxLength: number = 80) => {
    // Remove HTML tags if any
    const textContent = content.replace(/<[^>]*>/g, '')

    if (textContent.length <= maxLength) return textContent

    return textContent.substring(0, maxLength) + '...'
  }

  const displayDate = note.updatedAt || note.createdAt

  return (
    <div
      className={`note-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{
        borderLeft: note.color
          ? `4px solid ${note.color}`
          : '4px solid transparent',
      }}
    >
      <div className="note-card-title">{note.title}</div>
      <div className="note-card-excerpt">{getExcerpt(note.content)}</div>
      <div className="note-card-date">
        <i className="far fa-clock"></i> {formatDate(displayDate)}
      </div>
    </div>
  )
}

export default NoteCard
