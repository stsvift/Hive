import React, { useEffect, useState } from 'react'
import Desktop from './components/Desktop/Desktop'
import Welcome from './components/Welcome/Welcome'
import { COLORS, STORAGE_KEYS } from './config/constants'
import './styles/global.css'
import { isAuthenticated } from './utils/authService'
import {
  getCurrentTheme,
  saveTheme,
  updateFaviconColors,
} from './utils/settingsManager'
import { initializeTheme } from './utils/themeManager'

const App: React.FC = () => {
  // Initialize theme from all sources, with the new getCurrentTheme function
  const [theme, setTheme] = useState<'light' | 'dark'>(getCurrentTheme())
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Apply theme to document as soon as component mounts
  useEffect(() => {
    // Инициализируем тему
    initializeTheme()

    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  // Apply saved accent color on load - переместим выше, чтобы выполнить до отображения сплеш-экрана
  useEffect(() => {
    // Получаем сохраненный акцентный цвет из настроек
    const settingsRaw = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    let accentColor = 'orange' // значение по умолчанию

    if (settingsRaw) {
      try {
        const settings = JSON.parse(settingsRaw)
        if (settings?.appearance?.accent) {
          accentColor = settings.appearance.accent
          console.log('Loaded accent color from settings:', accentColor)
        } else {
          console.log('No accent color in settings, using default orange')
        }
      } catch (error) {
        console.error('Error parsing settings:', error)
      }
    } else {
      console.log('No settings found, using default orange accent')
    }

    const accentColors = {
      orange: {
        color: COLORS.PRIMARY,
        lightColor: COLORS.PRIMARY_LIGHT,
        darkColor: COLORS.PRIMARY_DARK,
      },
      blue: {
        color: COLORS.SECONDARY,
        lightColor: '#7986CB',
        darkColor: '#3949AB',
      },
      teal: {
        color: COLORS.ACCENT,
        lightColor: '#4DD0E1',
        darkColor: '#0097A7',
      },
      green: {
        color: COLORS.SUCCESS,
        lightColor: '#81C784',
        darkColor: '#388E3C',
      },
      purple: { color: '#9C27B0', lightColor: '#BA68C8', darkColor: '#7B1FA2' },
      red: {
        color: COLORS.DANGER,
        lightColor: '#E57373',
        darkColor: '#D32F2F',
      },
    }

    // Находим объект цвета по ID или используем оранжевый по умолчанию
    const selectedColor =
      accentColors[accentColor as keyof typeof accentColors] ||
      accentColors.orange

    console.log(
      'Applying accent color:',
      selectedColor.color,
      'for',
      accentColor
    )

    // Применяем выбранный цвет к CSS переменным
    document.documentElement.style.setProperty(
      '--color-primary',
      selectedColor.color
    )
    document.documentElement.style.setProperty(
      '--color-primary-light',
      selectedColor.lightColor
    )
    document.documentElement.style.setProperty(
      '--color-primary-dark',
      selectedColor.darkColor
    )

    // Обновляем favicon на основе выбранного цвета
    updateFaviconColors(selectedColor.color)

    // Восстановление сохраненной favicon
    const customFavicon = localStorage.getItem(STORAGE_KEYS.CUSTOM_FAVICON)
    if (customFavicon) {
      const favicon = document.querySelector(
        'link[rel="icon"]'
      ) as HTMLLinkElement
      if (favicon) {
        const blob = new Blob([customFavicon], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        favicon.href = url
      }
    }
  }, [])

  // Проверяем, первый ли это запуск приложения или если пользователь не аутентифицирован
  useEffect(() => {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    const authenticated = isAuthenticated()

    console.log('Authentication check on load:', authenticated)

    if (settings) {
      try {
        const settingsObj = JSON.parse(settings)
        // Check if onboarding was completed and user is authenticated
        if (settingsObj.user?.onboardingCompleted && authenticated) {
          setIsFirstLaunch(false)
        } else if (!authenticated) {
          console.log('User not authenticated, showing welcome screen')
          setIsFirstLaunch(true)
        } else {
          setIsFirstLaunch(true)
        }
      } catch (error) {
        console.error('Error parsing settings:', error)
        setIsFirstLaunch(true)
      }
    } else {
      setIsFirstLaunch(true)
    }

    // Имитация загрузки для отображения сплэш-скрина
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Сохранение предпочтений пользователя при их изменении
  useEffect(() => {
    // Use the consolidated save function
    saveTheme(theme)
  }, [theme])

  // Обработчик горячих клавиш для переключения темы
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+T для переключения темы
      if (e.altKey && e.key === 't') {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Обработчик завершения настройки при первом запуске
  const handleOnboardingComplete = () => {
    setIsFirstLaunch(false)
  }

  // Обработчик изменения темы
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    // Set theme in state
    setTheme(newTheme)

    // Save theme with the consolidated function
    saveTheme(newTheme)
  }

  // Компонент загрузки с динамически подгружаемым SVG
  if (isLoading) {
    return (
      <div className={`splash-screen ${theme}`}>
        <div className="splash-content">
          <SplashLogo className="splash-logo" />
          <div className="splash-title">HiveOS</div>
          <div className="splash-loader"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`app ${theme === 'dark' ? 'dark' : ''}`}>
      {isFirstLaunch ? (
        <Welcome onComplete={handleOnboardingComplete} />
      ) : (
        <Desktop theme={theme} onThemeChange={handleThemeChange} />
      )}
    </div>
  )
}

// Компонент для динамической загрузки SVG с учётом акцентного цвета
const SplashLogo: React.FC<{ className: string }> = ({ className }) => {
  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary')
    .trim()
  const primaryLightColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary-light')
    .trim()
  const primaryDarkColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary-dark')
    .trim()

  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_1_1)">
        {/* Фон */}
        <rect width="256" height="256" rx="48" fill={primaryColor} />

        {/* Сотовая структура */}
        <g opacity="0.95">
          {/* Центральная сота */}
          <path
            d="M128 76L178 104V160L128 188L78 160V104L128 76Z"
            fill={primaryLightColor}
            stroke={primaryDarkColor}
            strokeWidth="4"
          />

          {/* Верхняя сота */}
          <path
            d="M128 26L178 54V110L128 138L78 110V54L128 26Z"
            fill="#FFE0B2"
            stroke={primaryDarkColor}
            strokeWidth="4"
            opacity="0.6"
          />

          {/* Нижняя сота */}
          <path
            d="M128 126L178 154V210L128 238L78 210V154L128 126Z"
            fill="#FFE0B2"
            stroke={primaryDarkColor}
            strokeWidth="4"
            opacity="0.6"
          />

          {/* Левая сота */}
          <path
            d="M78 104L128 132V188L78 216L28 188V132L78 104Z"
            fill="#FFE0B2"
            stroke={primaryDarkColor}
            strokeWidth="4"
            opacity="0.6"
          />

          {/* Правая сота */}
          <path
            d="M178 104L228 132V188L178 216L128 188V132L178 104Z"
            fill="#FFE0B2"
            stroke={primaryDarkColor}
            strokeWidth="4"
            opacity="0.6"
          />
        </g>

        {/* Пчела (стилизованная) */}
        <g transform="translate(128, 128) scale(0.35) translate(-128, -128)">
          {/* Тело пчелы */}
          <ellipse cx="128" cy="128" rx="60" ry="40" fill="#FFCA28" />

          {/* Полоски */}
          <rect x="90" y="108" width="76" height="10" rx="5" fill="#212121" />
          <rect x="90" y="128" width="76" height="10" rx="5" fill="#212121" />
          <rect x="90" y="148" width="76" height="10" rx="5" fill="#212121" />

          {/* Крылья */}
          <ellipse
            cx="100"
            cy="100"
            rx="24"
            ry="16"
            fill="white"
            opacity="0.8"
            transform="rotate(-20 100 100)"
          />
          <ellipse
            cx="156"
            cy="100"
            rx="24"
            ry="16"
            fill="white"
            opacity="0.8"
            transform="rotate(20 156 100)"
          />

          {/* Жало */}
          <path d="M190 128L210 118L210 138L190 128Z" fill={primaryDarkColor} />

          {/* Глаза */}
          <circle cx="100" cy="120" r="6" fill="#212121" />
          <circle cx="156" cy="120" r="6" fill="#212121" />

          {/* Усики */}
          <path
            d="M90 108C80 98 70 93 60 95"
            stroke="#212121"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M166 108C176 98 186 93 196 95"
            stroke="#212121"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      </g>

      <defs>
        <clipPath id="clip0_1_1">
          <rect width="256" height="256" rx="48" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

export default App
