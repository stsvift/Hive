import React, { useState } from 'react'
import { Folder } from '../../../api/foldersApi'

interface CreateFolderModalProps {
  onClose: () => void
  onCreateFolder: (name: string, description: string) => Promise<Folder | null>
  parentFolder: Folder | null
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  onClose,
  onCreateFolder,
  parentFolder,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Folder name is required')
      return
    }

    try {
      setIsSubmitting(true)
      console.log(
        `Creating folder "${name}" in parent:`,
        parentFolder?.name || 'root'
      )

      // Make sure we're explicitly calling with both parameters
      await onCreateFolder(name, description)
      onClose()
    } catch (err) {
      console.error('Error in folder creation form:', err)
      setError('Failed to create folder. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>
            Create New Folder {parentFolder ? `in ${parentFolder.name}` : ''}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="folderName">Folder Name *</label>
            <input
              type="text"
              id="folderName"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter folder name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="folderDescription">Description</label>
            <textarea
              id="folderDescription"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter folder description (optional)"
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
                'Create Folder'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateFolderModal
