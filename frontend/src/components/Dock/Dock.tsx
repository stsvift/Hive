import React from 'react'
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
}

const Dock: React.FC<DockProps> = ({
  items,
  activeApps,
  minimizedApps = [],
  receivingApp = null,
  onItemClick,
}) => {
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
            data-app-id={item.id} // Add data attribute for position tracking
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
    </div>
  )
}

export default Dock
