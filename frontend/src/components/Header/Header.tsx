import React from 'react'
import './Header.css'

interface HeaderProps {
  onMenuClick: () => void
  onThemeToggle: () => void
  theme: 'light' | 'dark'
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onThemeToggle,
  theme,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-button" onClick={onMenuClick}>
          <i className="fas fa-bars"></i>
        </button>
        <div className="header-title">
          <h1>Рабочий стол</h1>
        </div>
      </div>

      <div className="header-right">
        <div className="header-search">
          <i className="fas fa-search search-icon"></i>
          <input type="text" placeholder="Поиск..." />
        </div>

        <div className="header-actions">
          <button className="header-action-button" onClick={onThemeToggle}>
            <i className={`fas fa-${theme === 'light' ? 'moon' : 'sun'}`}></i>
          </button>
          <button className="header-action-button">
            <i className="fas fa-bell"></i>
            <span className="notification-badge">3</span>
          </button>
          <div className="user-avatar">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="User"
            />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
