import React from 'react'
import { Folder } from '../../../api/foldersApi'

interface BreadcrumbNavProps {
  path: Folder[]
  onNavigate: (folderId: string | null) => void
  canGoUp: boolean
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  path,
  onNavigate,
  canGoUp,
}) => {
  return (
    <div className="explorer-breadcrumb">
      <button
        className="breadcrumb-up-button"
        onClick={() => {
          if (path.length > 1) {
            // Go to parent folder
            const parentFolder = path[path.length - 2]
            onNavigate(parentFolder.id)
          } else {
            // Go to root
            onNavigate(null)
          }
        }}
        disabled={!canGoUp}
        title="Вернуться на уровень выше"
      >
        <i className="fas fa-arrow-up"></i>
      </button>

      <div className="folder-breadcrumb">
        <span
          className="breadcrumb-item"
          onClick={() => onNavigate(null)}
          title="Корневая папка"
        >
          <i className="fas fa-home"></i>
          Главная
        </span>

        {path.length > 0 && <span className="breadcrumb-separator">/</span>}

        {path.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <span
              className="breadcrumb-item"
              onClick={() => onNavigate(folder.id)}
              title={folder.description || folder.name}
            >
              {folder.name}
            </span>
            {index < path.length - 1 && (
              <span className="breadcrumb-separator">/</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default BreadcrumbNav
