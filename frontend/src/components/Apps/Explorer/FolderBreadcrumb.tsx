import React from 'react'
import { Folder } from '../../../api/foldersApi'

interface FolderBreadcrumbProps {
  folderPath: Folder[]
  onNavigate: (folderId: string | null) => void
}

const FolderBreadcrumb: React.FC<FolderBreadcrumbProps> = ({
  folderPath,
  onNavigate,
}) => {
  return (
    <div className="folder-breadcrumb">
      <span className="breadcrumb-item" onClick={() => onNavigate(null)}>
        <i className="fas fa-home"></i> Home
      </span>

      {folderPath.map(folder => (
        <React.Fragment key={folder.id}>
          <span className="breadcrumb-separator">/</span>
          <span
            className="breadcrumb-item"
            onClick={() => onNavigate(folder.id)}
          >
            {folder.name}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

export default FolderBreadcrumb
