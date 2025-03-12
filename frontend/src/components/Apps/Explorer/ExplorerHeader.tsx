import React from 'react'
import { Folder } from '../../../api/foldersApi'

interface ExplorerHeaderProps {
  currentFolder: Folder | null
  onCreateFolder: () => void
  onCreateTask: () => void
  onCreateNote: () => void
}

const ExplorerHeader: React.FC<ExplorerHeaderProps> = ({
  currentFolder,
  onCreateFolder,
  onCreateTask,
  onCreateNote,
}) => {
  return (
    <div className="explorer-header">
      <h2>
        <i className="fas fa-folder-open"></i>
        {currentFolder ? currentFolder.name : 'Проводник'}
      </h2>
      <div className="explorer-actions">
        <button className="explorer-button" onClick={onCreateFolder}>
          <i className="fas fa-folder-plus"></i> Новая папка
        </button>
        <button className="explorer-button" onClick={onCreateNote}>
          <i className="fas fa-sticky-note"></i> Заметка
        </button>
        <button className="explorer-button primary" onClick={onCreateTask}>
          <i className="fas fa-tasks"></i> Задача
        </button>
      </div>
    </div>
  )
}

export default ExplorerHeader
