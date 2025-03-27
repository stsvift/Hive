import React from 'react'
import { COLORS } from '../../config/constants'
import AppIcon from '../AppIcon/AppIcon'
import './AppGrid.css'

interface AppItem {
  id: string
  title: string
  icon: string
  color?: string
  gradient?: string
}

interface AppGridProps {
  onAppClick: (id: string) => void
  openApps: string[]
  activeAppId: string | null
}

const AppGrid: React.FC<AppGridProps> = ({
  onAppClick,
  openApps,
  activeAppId,
}) => {
  // Список приложений
  const apps: AppItem[] = [
    {
      id: 'tasks',
      title: 'Задачи',
      icon: 'tasks',
      gradient: COLORS.GRADIENT_PRIMARY,
    },
    {
      id: 'notes',
      title: 'Заметки',
      icon: 'sticky-note',
      color: COLORS.PRIMARY_LIGHT,
    },
    {
      id: 'calendar',
      title: 'Календарь',
      icon: 'calendar-alt',
      color: COLORS.PRIMARY,
    },
    {
      id: 'contacts',
      title: 'Контакты',
      icon: 'address-book',
      color: COLORS.SECONDARY,
    },
    {
      id: 'projects',
      title: 'Проекты',
      icon: 'briefcase',
      gradient: COLORS.GRADIENT_SECONDARY,
    },
    {
      id: 'files',
      title: 'Файлы',
      icon: 'folder',
      color: COLORS.ACCENT,
    },
    {
      id: 'settings',
      title: 'Настройки',
      icon: 'cog',
      color: COLORS.GRAY_DARK,
    },
  ]

  return (
    <div className="app-grid">
      {apps.map(app => (
        <AppIcon
          key={app.id}
          id={app.id}
          title={app.title}
          icon={app.icon}
          color={app.color}
          gradient={app.gradient}
          isOpen={openApps.includes(app.id)}
          isActive={activeAppId === app.id}
          onClick={() => onAppClick(app.id)}
        />
      ))}
    </div>
  )
}

export default AppGrid
