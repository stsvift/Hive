import React, { useState } from 'react'
import { Folder } from '../../../api/foldersApi'

interface CreateNoteModalProps {
  onClose: () => void
  onCreateNote: (title: string, content: string) => Promise<void>
  currentFolder: Folder | null
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
  onClose,
  onCreateNote,
  currentFolder,
}) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('Note title is required')
      return
    }

    try {
      setIsSubmitting(true)
      await onCreateNote(title, content)
      onClose()
    } catch (err) {
      setError('Failed to create note. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>
            Create New Note {currentFolder ? `in ${currentFolder.name}` : ''}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="noteTitle">Title *</label>
            <input
              type="text"
              id="noteTitle"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter note title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="noteContent">Content</label>
            <textarea
              id="noteContent"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Enter note content"
              rows={5}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-button secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-button primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Creating...
                </>
              ) : (
                'Create Note'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateNoteModal
