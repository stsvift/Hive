import React, { useState } from 'react'
import './Dock.css'

interface DockItem {
  id: string
  name: string
  icon: string
}

interface DockProps {
  items: DockItem[]
  activeApps: string[]
  minimizedApps?: string[]
  receivingApp?: string | null
  onItemClick: (id: string) => void
  onItemClose?: (id: string) => void
}

const Dock: React.FC<DockProps> = ({
  items,
  activeApps,
  minimizedApps = [],
  receivingApp = null,
  onItemClick,
  onItemClose,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    appId: string | null
    x: number
    y: number
  }>({
    visible: false,
    appId: null,
    x: 0,
    y: 0,
  })

  const handleContextMenu = (e: React.MouseEvent, appId: string) => {
    e.preventDefault()
    e.stopPropagation()

    // Only show context menu for active apps
    if (!activeApps.includes(appId)) return

    setContextMenu({
      visible: true,
      appId,
      x: e.clientX,
      y: e.clientY,
    })
  }

  const handleCloseApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (contextMenu.appId && onItemClose) {
      onItemClose(contextMenu.appId)
    }
    setContextMenu({ ...contextMenu, visible: false })
  }

  const handleClickOutside = () => {
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false })
    }
  }

  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.visible])

  return (
    <div className="dock-container">
      <div className="dock">
        {items.map(item => (
          <div
            key={item.id}
            className={`dock-item ${
              activeApps.includes(item.id) ? 'active' : ''
            } ${minimizedApps.includes(item.id) ? 'minimized' : ''} ${
              receivingApp === item.id ? 'receiving' : ''
            }`}
            onClick={() => onItemClick(item.id)}
            onContextMenu={e => handleContextMenu(e, item.id)}
            data-app-id={item.id}
          >
            <div className="dock-icon">
              <i className={`fas fa-${item.icon}`}></i>
            </div>

            <div className="dock-indicator"></div>

            <div className="dock-tooltip">
              <span>{item.name}</span>
            </div>
          </div>
        ))}
      </div>

      {contextMenu.visible && (
        <div
          className="dock-context-menu"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          onClick={e => e.stopPropagation()} // Prevent click from closing immediately
        >
          <div className="menu-item" onClick={handleCloseApp}>
            <i className="fas fa-times"></i> Close
          </div>
        </div>
      )}
    </div>
  )
}

export default Dock
