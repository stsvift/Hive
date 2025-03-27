import React, { useEffect, useState } from 'react'
import { COLORS } from '../../config/constants'
import './HexGrid.css'

interface AppItem {
  id: string
  title: string
  description?: string
  icon: string
  color?: string
  gradient?: string
  category?: string
  featured?: boolean
}

interface HexGridProps {
  onCellClick: (id: string) => void
  activeAppId?: string | null
}

const HexGrid: React.FC<HexGridProps> = ({ onCellClick, activeAppId }) => {
  const [animatedApps, setAnimatedApps] = useState<boolean>(false)
  const [hoveredApp, setHoveredApp] = useState<string | null>(null)

  // Данные приложений для отображения на рабочем столе
  const apps: AppItem[] = [
    {
      id: 'tasks',
      title: 'Задачи',
      description: 'Управление задачами и проектами',
      icon: 'tasks',
      gradient: COLORS.GRADIENT_PRIMARY,
      category: 'productivity',
      featured: true,
    },
    {
      id: 'calendar',
      title: 'Календарь',
      description: 'Планирование и события',
      icon: 'calendar-alt',
      color: COLORS.HONEY_DARK,
      category: 'productivity',
    },
    {
      id: 'notes',
      title: 'Заметки',
      description: 'Создание и управление заметками',
      icon: 'sticky-note',
      color: COLORS.BEE_YELLOW,
      category: 'productivity',
    },
    {
      id: 'projects',
      title: 'Проекты',
      description: 'Управление проектами',
      icon: 'project-diagram',
      gradient: COLORS.ROYAL_JELLY_GRADIENT,
      category: 'work',
      featured: true,
    },
    {
      id: 'contacts',
      title: 'Контакты',
      description: 'Управление контактами',
      icon: 'address-book',
      color: COLORS.HONEY_LIGHT,
      category: 'communication',
    },
    {
      id: 'settings',
      title: 'Настройки',
      description: 'Настройка системы',
      icon: 'cog',
      color: COLORS.GRAY_DARK,
      category: 'system',
    },
    {
      id: 'files',
      title: 'Файлы',
      description: 'Управление файлами',
      icon: 'folder',
      color: COLORS.ACCENT,
      category: 'system',
    },
    {
      id: 'analytics',
      title: 'Аналитика',
      description: 'Статистика и отчеты',
      icon: 'chart-line',
      gradient: COLORS.HONEY_DARK_GRADIENT,
      category: 'work',
    },
    {
      id: 'chat',
      title: 'Чат',
      description: 'Общение с командой',
      icon: 'comments',
      color: COLORS.INFO,
      category: 'communication',
      featured: true,
    },
  ]

  // Trigger animation after component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedApps(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Get style for app card based on its properties
  const getAppStyle = (app: AppItem, index: number) => {
    const baseStyle: React.CSSProperties = {
      animationDelay: `${index * 0.05}s`,
    }

    if (app.gradient) {
      return {
        ...baseStyle,
        background: app.gradient,
      }
    }
    if (app.color) {
      return {
        ...baseStyle,
        backgroundColor: app.color,
      }
    }
    return baseStyle
  }

  // Group apps by category
  const productivityApps = apps.filter(app => app.category === 'productivity')
  const workApps = apps.filter(app => app.category === 'work')
  const communicationApps = apps.filter(app => app.category === 'communication')
  const systemApps = apps.filter(app => app.category === 'system')
  const featuredApps = apps.filter(app => app.featured)

  return (
    <div className="app-launcher">
      <div className="featured-apps">
        {featuredApps.map((app, index) => (
          <div
            key={app.id}
            className={`featured-app ${animatedApps ? 'animated' : ''} ${
              activeAppId === app.id ? 'active' : ''
            } ${hoveredApp === app.id ? 'hovered' : ''}`}
            style={getAppStyle(app, index)}
            onClick={() => onCellClick(app.id)}
            onMouseEnter={() => setHoveredApp(app.id)}
            onMouseLeave={() => setHoveredApp(null)}
          >
            <div className="app-icon-container">
              <i className={`fas fa-${app.icon}`}></i>
            </div>
            <div className="app-info">
              <h3>{app.title}</h3>
              <p>{app.description}</p>
            </div>
            <div className="app-launch">
              <i className="fas fa-arrow-right"></i>
            </div>
          </div>
        ))}
      </div>

      <div className="app-categories">
        <div className="category">
          <h2>Продуктивность</h2>
          <div className="app-group">
            {productivityApps.map((app, index) => (
              <div
                key={app.id}
                className={`app-card ${animatedApps ? 'animated' : ''} ${
                  activeAppId === app.id ? 'active' : ''
                }`}
                style={getAppStyle(app, index + featuredApps.length)}
                onClick={() => onCellClick(app.id)}
              >
                <i className={`fas fa-${app.icon}`}></i>
                <span>{app.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="category">
          <h2>Работа</h2>
          <div className="app-group">
            {workApps.map((app, index) => (
              <div
                key={app.id}
                className={`app-card ${animatedApps ? 'animated' : ''} ${
                  activeAppId === app.id ? 'active' : ''
                }`}
                style={getAppStyle(
                  app,
                  index + featuredApps.length + productivityApps.length
                )}
                onClick={() => onCellClick(app.id)}
              >
                <i className={`fas fa-${app.icon}`}></i>
                <span>{app.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="category">
          <h2>Коммуникация</h2>
          <div className="app-group">
            {communicationApps.map((app, index) => (
              <div
                key={app.id}
                className={`app-card ${animatedApps ? 'animated' : ''} ${
                  activeAppId === app.id ? 'active' : ''
                }`}
                style={getAppStyle(
                  app,
                  index +
                    featuredApps.length +
                    productivityApps.length +
                    workApps.length
                )}
                onClick={() => onCellClick(app.id)}
              >
                <i className={`fas fa-${app.icon}`}></i>
                <span>{app.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="category">
          <h2>Система</h2>
          <div className="app-group">
            {systemApps.map((app, index) => (
              <div
                key={app.id}
                className={`app-card ${animatedApps ? 'animated' : ''} ${
                  activeAppId === app.id ? 'active' : ''
                }`}
                style={getAppStyle(
                  app,
                  index +
                    featuredApps.length +
                    productivityApps.length +
                    workApps.length +
                    communicationApps.length
                )}
                onClick={() => onCellClick(app.id)}
              >
                <i className={`fas fa-${app.icon}`}></i>
                <span>{app.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-container">
          <i className="fas fa-search"></i>
          <input type="text" placeholder="Поиск приложений..." />
        </div>
      </div>
    </div>
  )
}

export default HexGrid
