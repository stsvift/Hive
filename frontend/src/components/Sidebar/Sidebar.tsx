import React, { useState } from 'react'
import './Sidebar.css'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [activeItem, setActiveItem] = useState('dashboard')

  const menuItems = [
    { id: 'dashboard', name: 'Рабочий стол', icon: 'house' },
    { id: 'tasks', name: 'Задачи', icon: 'tasks' },
    { id: 'kanban', name: 'Канбан', icon: 'columns' },
    { id: 'calendar', name: 'Календарь', icon: 'calendar-alt' },
    { id: 'notes', name: 'Заметки', icon: 'sticky-note' },
    { id: 'projects', name: 'Проекты', icon: 'briefcase' },
    { id: 'analytics', name: 'Аналитика', icon: 'chart-line' },
  ]

  const menuGroups = [
    { id: 'favorites', name: 'Избранное', items: menuItems.slice(0, 4) },
    {
      id: 'workspace',
      name: 'Рабочее пространство',
      items: menuItems.slice(4),
    },
  ]

  const handleItemClick = (id: string) => {
    setActiveItem(id)
    // В мобильной версии закрывать сайдбар при выборе пункта меню
    if (window.innerWidth <= 768) {
      onClose()
    }
  }

  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <img src="/hive-icon.svg" alt="HIVE" />
          <span>HIVE</span>
        </div>
        <button className="close-sidebar" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="sidebar-content">
        {menuGroups.map(group => (
          <div key={group.id} className="menu-group">
            <div className="menu-group-title">{group.name}</div>
            <ul className="menu-list">
              {group.items.map(item => (
                <li
                  key={item.id}
                  className={`menu-item ${
                    activeItem === item.id ? 'active' : ''
                  }`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <i className={`fas fa-${item.icon}`}></i>
                  <span>{item.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <img
              src="https://randomuser.me/api/portraits/men/32.jpg"
              alt="User"
            />
          </div>
          <div className="user-details">
            <div className="user-name">Алексей Иванов</div>
            <div className="user-role">Разработчик</div>
          </div>
        </div>
        <button className="settings-button">
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
