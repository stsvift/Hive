import React from 'react'
import { Folder } from '../../../api/foldersApi'

interface FolderItemProps {
  folder: Folder
  onNavigate: (folderId: string) => void
  onDelete: (folderId: string) => void
}

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  onNavigate,
  onDelete,
}) => {
  // Function to handle folder click event
  const handleClick = () => {
    onNavigate(folder.id)
  }

  // Function to handle delete with confirmation
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation
    if (
      window.confirm(`Вы уверены, что хотите удалить папку "${folder.name}"?`)
    ) {
      onDelete(folder.id)
    }
  }

  return (
    <div className="folder-item" onClick={handleClick}>
      <div className="folder-icon">
        <i className="fas fa-folder"></i>
      </div>
      <div className="folder-info">
        <div className="folder-name">{folder.name}</div>
        {folder.description && (
          <div className="folder-description">{folder.description}</div>
        )}
      </div>
      <div className="folder-actions">
        <button
          className="folder-delete-btn"
          onClick={handleDelete}
          title="Удалить папку"
        >
          <i className="fas fa-trash-alt"></i>
        </button>
      </div>
    </div>
  )
}

export default FolderItem
