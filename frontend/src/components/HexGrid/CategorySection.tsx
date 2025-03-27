import React from 'react'
import { COLORS } from '../../config/constants'

interface AppItem {
  id: string
  title: string
  description?: string
  icon: string
  color?: string
  gradient?: string
  category?: string
  size?: 'small' | 'medium' | 'large'
}

interface CategorySectionProps {
  title: string
  apps: AppItem[]
  onAppClick: (id: string) => void
  activeAppId?: string | null
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  apps,
  onAppClick,
  activeAppId,
}) => {
  // Функция для получения стиля для ячейки
  const getCellStyle = (app: AppItem) => {
    if (app.gradient) {
      return { background: app.gradient }
    }
    if (app.color) {
      return { backgroundColor: app.color }
    }
    return { backgroundColor: COLORS.PRIMARY }
  }

  return (
    <div className="category-section">
      <h2 className="category-title">{title}</h2>
      <div className="app-grid">
        {apps.map(app => (
          <div
            key={app.id}
            className={`app-card ${app.size || ''} ${
              activeAppId === app.id ? 'active' : ''
            }`}
            onClick={() => onAppClick(app.id)}
            data-id={app.id}
          >
            <div className="app-icon-wrapper" style={getCellStyle(app)}>
              <i className={`fas fa-${app.icon}`}></i>
            </div>
            <div className="app-details">
              <div className="app-title">{app.title}</div>
              {app.description && (
                <div className="app-description">{app.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategorySection
