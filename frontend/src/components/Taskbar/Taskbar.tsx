import React from 'react'
import './Taskbar.css'

interface TaskbarProps {
  openApps: string[]
  onAppClick: (appId: string) => void
  onAppClose: (appId: string) => void
}

const Taskbar: React.FC<TaskbarProps> = ({
  openApps,
  onAppClick,
  onAppClose,
}) => {
  const apps = [
    { id: 'dashboard', name: 'Dashboard', icon: 'tachometer-alt' },
    { id: 'tasks', name: 'Tasks', icon: 'tasks' },
    { id: 'calendar', name: 'Calendar', icon: 'calendar-alt' },
    { id: 'notes', name: 'Notes', icon: 'sticky-note' },
    { id: 'messages', name: 'Messages', icon: 'comments' },
    { id: 'settings', name: 'Settings', icon: 'cog' },
  ]

  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="taskbar">
      <div className="taskbar-start">
        <div className="app-logo">
          <i className="fas fa-honeycomb"></i>
        </div>
      </div>

      <div className="taskbar-apps">
        {apps.map(app => (
          <div
            key={app.id}
            className={`app-icon ${
              openApps.includes(app.id) ? 'app-active' : ''
            }`}
            onClick={() => onAppClick(app.id)}
            title={app.name}
          >
            <i className={`fas fa-${app.icon}`}></i>
          </div>
        ))}
      </div>

      <div className="taskbar-end">
        <div className="taskbar-time">{currentTime}</div>
        <div className="taskbar-user">
          <i className="fas fa-user-circle"></i>
        </div>
      </div>
    </div>
  )
}

export default Taskbar
