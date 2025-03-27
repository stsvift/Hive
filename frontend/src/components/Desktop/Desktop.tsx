import React, { useEffect, useRef, useState } from 'react'
import {
  getCurrentTheme,
  getCurrentWallpaper,
  getSetting,
} from '../../utils/settingsManager'
import { getWindowState, saveWindowState } from '../../utils/windowStateManager'
import CalendarApp from '../Apps/CalendarApp/CalendarApp'
import NotesApp from '../Apps/NotesApp/NotesApp'
import SettingsApp from '../Apps/SettingsApp/SettingsApp'
import TasksApp from '../Apps/TasksApp/TasksApp'
import AppWindow from '../AppWindow/AppWindow'
import DesktopApps from '../DesktopApps/DesktopApps'
import Dock from '../Dock/Dock'
import './Desktop.css'

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface DesktopProps {
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
}

interface AppWindowConfig {
  id: string
  title: string
  icon: string
  component: React.ReactNode
}

const Desktop: React.FC<DesktopProps> = ({ theme, onThemeChange }) => {
  // Состояние для открытых приложений и активного приложения
  const [openApps, setOpenApps] = useState<string[]>([])
  const [minimizedApps, setMinimizedApps] = useState<string[]>([])
  const [activeAppId, setActiveAppId] = useState<string | null>(null)

  // Add state for wallpaper
  const [wallpaper, setWallpaper] = useState(getCurrentWallpaper())

  // Add state to track dock item positions
  const [dockItemPositions, setDockItemPositions] = useState<
    Record<string, { x: number; y: number }>
  >({})

  // Add a ref to measure dock item positions
  const dockRef = useRef<HTMLDivElement>(null)

  // Add state to track which dock item is receiving a window
  const [receivingDockItem, setReceivingDockItem] = useState<string | null>(
    null
  )

  // Get enabled apps from settings
  const enabledApps = getSetting('workspace.apps', [
    'tasks',
    'notes',
    'calendar',
    'settings',
  ]) as string[]

  // Конфигурация элементов дока
  const dockItems = [
    { id: 'tasks', name: 'Задачи', icon: 'tasks' },
    { id: 'notes', name: 'Заметки', icon: 'sticky-note' },
    { id: 'calendar', name: 'Календарь', icon: 'calendar-alt' },
    { id: 'files', name: 'Файлы', icon: 'folder' },
    { id: 'settings', name: 'Настройки', icon: 'cog' },
  ]

  // Filter the dockItems to only show enabled apps - MOVED UP here
  const filteredDockItems = dockItems.filter(item =>
    enabledApps.includes(item.id)
  )

  // Listen for wallpaper changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setWallpaper(getCurrentWallpaper())
    }

    // Listen for storage events (when another tab changes localStorage)
    window.addEventListener('storage', handleStorageChange)

    // Custom event for same-tab updates
    window.addEventListener('wallpaper-changed', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('wallpaper-changed', handleStorageChange)
    }
  }, [])

  // Убедитесь, что компонент Desktop обновляет свои классы при изменении темы
  useEffect(() => {
    // Получаем текущую тему
    const currentTheme = getCurrentTheme()

    // Обновляем класс компонента Desktop
    const desktopElement = document.querySelector('.desktop')
    if (desktopElement) {
      if (currentTheme === 'dark') {
        desktopElement.classList.add('dark')
      } else {
        desktopElement.classList.remove('dark')
      }
    }
  }, [theme])

  // Конфигурация приложений
  const appConfigs: Record<string, AppWindowConfig> = {
    tasks: {
      id: 'tasks',
      title: 'Задачи',
      icon: 'tasks',
      component: <TasksApp />,
    },
    notes: {
      id: 'notes',
      title: 'Заметки',
      icon: 'sticky-note',
      component: <NotesApp />,
    },
    calendar: {
      id: 'calendar',
      title: 'Календарь',
      icon: 'calendar-alt',
      component: <CalendarApp />,
    },
    files: {
      id: 'files',
      title: 'Файлы',
      icon: 'folder',
      component: (
        <div className="app-placeholder">
          <i className="fas fa-folder-open"></i>
          <p>Файловый менеджер</p>
          <p className="app-coming-soon">Скоро будет доступно</p>
        </div>
      ),
    },
    settings: {
      id: 'settings',
      title: 'Настройки',
      icon: 'cog',
      component: <SettingsApp onThemeChange={onThemeChange} theme={theme} />,
    },
    projects: {
      id: 'projects',
      title: 'Проекты',
      icon: 'briefcase',
      component: (
        <div className="app-placeholder">
          <i className="fas fa-briefcase"></i>
          <p>Управление проектами</p>
          <p className="app-coming-soon">Скоро будет доступно</p>
        </div>
      ),
    },
  }

  // Обработка клика по приложению
  const handleAppClick = (appId: string) => {
    // Если приложение свернуто, разворачиваем его
    if (minimizedApps.includes(appId)) {
      setMinimizedApps(minimizedApps.filter(id => id !== appId))
    }

    if (!openApps.includes(appId)) {
      setOpenApps([...openApps, appId])
    }
    setActiveAppId(appId)
  }

  // Закрытие приложения
  const handleAppClose = (appId: string) => {
    const newOpenApps = openApps.filter(id => id !== appId)
    setOpenApps(newOpenApps)

    // Удаляем из списка свернутых, если оно там было
    if (minimizedApps.includes(appId)) {
      setMinimizedApps(minimizedApps.filter(id => id !== appId))
    }

    // Если закрыли активное приложение, активируем последнее открытое
    if (activeAppId === appId && newOpenApps.length > 0) {
      setActiveAppId(newOpenApps[newOpenApps.length - 1])
    } else if (newOpenApps.length === 0) {
      setActiveAppId(null)
    }
  }

  // Полностью переработанный обработчик минимизации приложения
  const handleAppMinimize = (appId: string) => {
    // Активируем анимацию иконки в доке
    setReceivingDockItem(appId)

    // Убираем анимацию иконки через время
    setTimeout(() => {
      setReceivingDockItem(null)
    }, 500)

    // Добавляем в список свернутых приложений
    setMinimizedApps(prev => [...prev.filter(id => id !== appId), appId])

    // Если сворачиваем активное окно, делаем активным другое
    if (activeAppId === appId) {
      const otherApps = openApps.filter(
        id => id !== appId && !minimizedApps.includes(id)
      )

      if (otherApps.length > 0) {
        setActiveAppId(otherApps[otherApps.length - 1]) // Активируем последнее открытое
      } else {
        setActiveAppId(null)
      }
    }
  }

  // Установка активного приложения при клике на окно
  const handleWindowFocus = (appId: string) => {
    setActiveAppId(appId)
  }

  // Обработка изменения позиции окна
  const handlePositionChange = (appId: string, position: Position) => {
    const state = getWindowState(appId)
    saveWindowState(appId, { ...state, position })
  }

  // Обработка изменения размера окна
  const handleSizeChange = (appId: string, size: Size) => {
    const state = getWindowState(appId)
    saveWindowState(appId, { ...state, size })
  }

  // Слушаем клик по фону рабочего стола, чтобы деактивировать окна
  const handleDesktopClick = (e: React.MouseEvent) => {
    // Только если клик был непосредственно по фону desktop, а не по его дочерним элементам
    if (
      (e.target as HTMLElement).className === 'desktop' ||
      (e.target as HTMLElement).className === 'desktop-background'
    ) {
      setActiveAppId(null)
    }
  }

  // Get window state with mobile-friendly defaults
  const getInitialWindowState = (appId: string) => {
    const savedState = getWindowState(appId)

    // Check if we're on mobile
    const isMobile = window.innerWidth < 768

    if (isMobile) {
      // For mobile, ensure windows are properly sized and positioned
      const centerX = Math.max(0, (window.innerWidth - 350) / 2)
      const centerY = Math.max(0, (window.innerHeight - 450) / 4)

      return {
        ...savedState,
        position: { x: centerX, y: centerY },
        size: {
          width: Math.min(savedState.size.width, window.innerWidth - 20),
          height: Math.min(savedState.size.height, window.innerHeight - 100),
        },
      }
    }

    return savedState
  }

  // Update dock positions when dock items change or window resizes
  useEffect(() => {
    // Only measure positions if dock exists and has items
    if (!dockRef.current || filteredDockItems.length === 0) return

    const updateDockPositions = () => {
      if (!dockRef.current) return

      const dockElement = dockRef.current
      const newPositions: Record<string, { x: number; y: number }> = {}

      // Get all dock items by their app ID
      const dockItems = dockElement.querySelectorAll('[data-app-id]')

      dockItems.forEach(item => {
        const appId = item.getAttribute('data-app-id')
        if (appId) {
          const rect = item.getBoundingClientRect()
          newPositions[appId] = {
            x: rect.left + rect.width / 2,
            y: rect.top,
          }
        }
      })

      // Compare with existing positions before updating state
      const positionsChanged = Object.keys(newPositions).some(appId => {
        const existing = dockItemPositions[appId]
        return (
          !existing ||
          Math.abs(existing.x - newPositions[appId].x) > 1 ||
          Math.abs(existing.y - newPositions[appId].y) > 1
        )
      })

      // Only update state if positions have actually changed
      if (positionsChanged) {
        setDockItemPositions(newPositions)
      }
    }

    // Initial measurement with a slight delay to ensure DOM is ready
    const initialMeasurementTimer = setTimeout(updateDockPositions, 100)

    // Handle resize events with debounce to prevent excessive updates
    let resizeTimer: number | null = null
    const handleResize = () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer)
      }
      resizeTimer = window.setTimeout(updateDockPositions, 100)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(initialMeasurementTimer)
      if (resizeTimer) {
        clearTimeout(resizeTimer)
      }
      window.removeEventListener('resize', handleResize)
    }
    // Only depend on the length of filteredDockItems rather than the whole array
  }, [filteredDockItems.length])

  // Filter desktop apps to only show enabled ones
  const desktopApps = Object.keys(appConfigs)
    .filter(id => enabledApps.includes(id))
    .map(id => ({
      id,
      title: appConfigs[id].title,
      icon: appConfigs[id].icon,
      isOpen: openApps.includes(id),
      isActive: activeAppId === id,
    }))

  return (
    <div
      className={`desktop ${theme === 'dark' ? 'dark' : ''}`}
      onClick={handleDesktopClick}
    >
      {/* Фон рабочего стола с применением класса обоев */}
      <div className={`desktop-background wallpaper-${wallpaper}`}></div>

      {/* Отображение значков приложений на рабочем столе */}
      <DesktopApps apps={desktopApps} onAppClick={handleAppClick} />

      {/* Быстрые настройки */}
      <div className="quick-actions">
        <button
          className="quick-action-button"
          onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
        >
          <i className={`fas fa-${theme === 'dark' ? 'sun' : 'moon'}`}></i>
        </button>
      </div>

      {/* Окна приложений */}
      {openApps.map(appId => {
        const app = appConfigs[appId]
        if (!app) return null

        // Получаем сохраненное или дефолтное состояние окна с учетом мобильного устройства
        const windowState = getInitialWindowState(appId)

        // Add special props for the settings app
        let appComponent = app.component
        if (app.id === 'settings') {
          appComponent = (
            <SettingsApp
              onThemeChange={onThemeChange}
              theme={theme}
              onWallpaperChange={newWallpaper => {
                setWallpaper(newWallpaper)
                // Dispatch event to notify about wallpaper change
                window.dispatchEvent(new Event('wallpaper-changed'))
              }}
            />
          )
        }

        return (
          <AppWindow
            key={app.id}
            id={app.id}
            title={app.title}
            icon={app.icon}
            onClose={() => handleAppClose(app.id)}
            onMinimize={() => handleAppMinimize(app.id)}
            defaultPosition={windowState.position}
            defaultSize={windowState.size}
            isActive={activeAppId === app.id}
            isMinimized={minimizedApps.includes(app.id)}
            onFocus={() => handleWindowFocus(app.id)}
            onPositionChange={handlePositionChange}
            onSizeChange={handleSizeChange}
            dockPosition={dockItemPositions[app.id]}
          >
            {appComponent}
          </AppWindow>
        )
      })}

      {/* Dock with ref for position tracking */}
      <div ref={dockRef}>
        <Dock
          items={filteredDockItems}
          activeApps={openApps}
          minimizedApps={minimizedApps}
          receivingApp={receivingDockItem}
          onItemClick={handleAppClick}
        />
      </div>
    </div>
  )
}

export default Desktop
