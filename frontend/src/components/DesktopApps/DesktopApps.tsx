import React, { useEffect, useState } from 'react'
import './DesktopApps.css'

interface AppInfo {
  id: string
  title: string
  icon: string
  isOpen: boolean
  isActive: boolean
}

interface DesktopAppsProps {
  apps: AppInfo[]
  onAppClick: (id: string) => void
}

const DesktopApps: React.FC<DesktopAppsProps> = ({ apps, onAppClick }) => {
  const [animated, setAnimated] = useState(false)

  // Animation on initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="desktop-apps-container">
      <div className="desktop-apps-grid">
        {apps.map((app, index) => (
          <div
            key={app.id}
            className={`desktop-app-item ${animated ? 'animated' : ''} ${
              app.isOpen ? 'open' : ''
            } ${app.isActive ? 'active' : ''}`}
            onClick={() => onAppClick(app.id)}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="desktop-app-icon accent-colored">
              <i className={`fas fa-${app.icon}`}></i>
            </div>
            <div className="desktop-app-title">{app.title}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DesktopApps
