import React from 'react'
import './AppIcon.css'

interface AppIconProps {
  id: string
  title: string
  icon: string
  color?: string
  gradient?: string
  isOpen?: boolean
  isActive?: boolean
  onClick: () => void
}

const AppIcon: React.FC<AppIconProps> = ({
  id,
  title,
  icon,
  color,
  gradient,
  isOpen = false,
  isActive = false,
  onClick,
}) => {
  const getIconStyle = () => {
    if (gradient) {
      return { background: gradient }
    }
    if (color) {
      return { backgroundColor: color }
    }
    return {}
  }

  return (
    <div
      className={`app-icon-wrapper ${isActive ? 'active' : ''}`}
      onClick={onClick}
      data-id={id}
    >
      <div
        className={`app-icon ${isOpen ? 'open' : ''}`}
        style={getIconStyle()}
      >
        <i className={`fas fa-${icon}`}></i>
        <div className="app-icon-glow"></div>
      </div>
      <div className="app-icon-title">{title}</div>
      {isOpen && <div className="app-icon-indicator"></div>}
    </div>
  )
}

export default AppIcon
