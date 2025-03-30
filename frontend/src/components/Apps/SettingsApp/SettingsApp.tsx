import React, { useEffect, useState } from 'react'
import { COLORS, STORAGE_KEYS } from '../../../config/constants'
import {
  getCurrentWallpaper,
  saveTheme,
  updateFaviconColors,
  WALLPAPERS,
} from '../../../utils/settingsManager'
import './SettingsApp.css'

// Add imports for user profile functionality
import {
  changePassword,
  getCurrentUser,
  isAuthenticated,
  logout,
  updateUserPreferences,
} from '../../../utils/authService'

// Add interface for user profile data
interface UserProfile {
  id: string
  name: string
  email: string
  userName?: string
  username?: string
  avatar?: string
  avatarUrl?: string
}

interface SettingsAppProps {
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
  onWallpaperChange?: (wallpaper: string) => void
}

type SettingsCategory =
  | 'appearance'
  | 'notifications'
  | 'account'
  | 'security'
  | 'about'

const SettingsApp: React.FC<SettingsAppProps> = ({
  theme,
  onThemeChange,
  onWallpaperChange,
}) => {
  // Добавляем состояние для общей загрузки приложения
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true)

  // Existing state variables
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>('appearance')
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    localStorage.getItem(STORAGE_KEYS.SETTINGS)
      ? JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
          .notifications?.enabled || false
      : false
  )
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    localStorage.getItem(STORAGE_KEYS.SETTINGS)
      ? JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
          .notifications?.sound || false
      : true
  )

  // Add state for user profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
  })
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true)
  const [profileError, setProfileError] = useState<string>('')
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [editedName, setEditedName] = useState<string>('')
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)

  // Add state for password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Add state for Telegram integration
  const [telegramUsername, setTelegramUsername] = useState('')
  const [isTelegramConnected, setIsTelegramConnected] = useState(false)
  const [isConnectingTelegram, setIsConnectingTelegram] = useState(false)
  const [telegramError, setTelegramError] = useState('')
  const [telegramSuccess, setTelegramSuccess] = useState('')

  // Улучшим инициализацию выбранного акцента, добавив проверки и логирование
  const initializeSelectedAccent = () => {
    // Загружаем настройки из localStorage
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (!settings) {
      console.log('No settings found, using default accent: orange')
      return 'orange'
    }

    try {
      const parsedSettings = JSON.parse(settings)
      const accentFromSettings = parsedSettings?.appearance?.accent

      if (!accentFromSettings) {
        console.log('No accent in settings, using default: orange')
        return 'orange'
      }

      console.log('Loaded accent from settings:', accentFromSettings)

      // Проверка на валидность значения акцента
      const validAccents = ['orange', 'blue', 'teal', 'green', 'purple', 'red']
      if (!validAccents.includes(accentFromSettings)) {
        console.warn(
          `Invalid accent value: ${accentFromSettings}, using default: orange`
        )
        return 'orange'
      }

      return accentFromSettings
    } catch (error) {
      console.error('Error parsing settings:', error)
      return 'orange'
    }
  }

  const [selectedAccent, setSelectedAccent] = useState<string>(
    initializeSelectedAccent()
  )

  // Остальной код инициализации
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>(
    getCurrentWallpaper()
  )

  // Load user profile when component mounts or when account tab is activated
  useEffect(() => {
    if (activeCategory === 'account' && isAuthenticated()) {
      loadUserProfile()
    }
  }, [activeCategory])

  // Load Telegram connection status on component mount
  useEffect(() => {
    if (activeCategory === 'notifications') {
      // Try to load Telegram settings from localStorage
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (settings) {
        try {
          const settingsObj = JSON.parse(settings)
          if (settingsObj.notifications?.telegram) {
            setTelegramUsername(
              settingsObj.notifications.telegram.username || ''
            )
            setIsTelegramConnected(
              settingsObj.notifications.telegram.connected || false
            )
          }
        } catch (error) {
          console.error('Error parsing Telegram settings:', error)
        }
      }
    }
  }, [activeCategory])

  // Добавляем эффект для имитации загрузки приложения
  useEffect(() => {
    // Имитация загрузки приложения с минимальной задержкой
    const loadingTimer = setTimeout(() => {
      setIsAppLoading(false)
    }, 2000)

    return () => clearTimeout(loadingTimer)
  }, [])

  // Function to load user profile
  const loadUserProfile = async () => {
    setIsLoadingProfile(true)
    setProfileError('')

    try {
      if (!isAuthenticated()) {
        setProfileError(
          'Для просмотра и изменения профиля необходимо авторизоваться'
        )
        // Still show loading animation for a minimum time
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsLoadingProfile(false)
        return
      }

      console.log('Loading user profile...')

      // Capture start time to ensure minimum loading duration
      const startTime = Date.now()

      try {
        // Try to get user data from the API
        const userData = await getCurrentUser()
        console.log('User data from API:', userData)

        if (userData) {
          // Extract email from different possible locations
          const email =
            userData.email ||
            userData.mail ||
            userData.emailAddress ||
            userData.userEmail ||
            'Нет данных'

          console.log('Extracted email:', email)

          // Create profile object with extracted data
          const profile = {
            id: userData.id || userData._id || userData.userId || 'unknown-id',
            name:
              userData.name ||
              userData.userName ||
              userData.username ||
              userData.displayName ||
              'Пользователь',
            email: email,
            avatar:
              userData.avatar || userData.avatarUrl || userData.photoUrl || '',
          }

          console.log('Created profile object:', profile)
          setUserProfile(profile)
          setEditedName(profile.name)
        } else {
          setProfileError(
            'Не удалось получить данные профиля. Данные отсутствуют.'
          )

          // Try to extract from token directly
          const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
          if (token) {
            try {
              const base64Url = token.split('.')[1]
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
              const payload = JSON.parse(window.atob(base64))

              // Try to find email in common JWT claim locations
              const email =
                payload.email ||
                payload.sub ||
                payload.unique_name ||
                payload.preferred_username ||
                'нет данных'

              setUserProfile({
                id: payload.id || payload.nameid || payload.sub || 'token-user',
                name:
                  payload.name ||
                  (email ? email.split('@')[0] : 'Пользователь'),
                email: email,
              })
              setEditedName(
                payload.name || (email ? email.split('@')[0] : 'Пользователь')
              )
              setProfileError(
                'Загружены базовые данные из токена. Расширенные данные недоступны.'
              )
            } catch (tokenError) {
              console.error('Error extracting data from token:', tokenError)
              setProfileError('Не удалось извлечь данные профиля из токена.')
            }
          }
        }
      } catch (error) {
        console.error('Error loading user profile from API:', error)

        // Try to create a default user as a fallback
        setUserProfile({
          id: 'offline-user',
          name: 'Пользователь',
          email: 'Email недоступен',
        })
        setEditedName('Пользователь')
        setProfileError('Сервер недоступен. Работа в автономном режиме.')

        // Ensure animation plays for at least 2 seconds for better UX
        const loadingTime = Date.now() - startTime
        if (loadingTime < 2000) {
          await new Promise(resolve => setTimeout(resolve, 2000 - loadingTime))
        }
      }
    } catch (error) {
      console.error('Fatal error in loadUserProfile:', error)
      setProfileError('Критическая ошибка при загрузке профиля.')

      // Minimum time for error state too
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Function to save user profile changes with better offline handling
  const saveProfileChanges = async () => {
    if (!editedName.trim()) {
      setProfileError('Имя пользователя не может быть пустым')
      return
    }

    setIsSaving(true)
    setProfileError('')

    try {
      if (!isAuthenticated()) {
        setProfileError('Необходимо авторизоваться для сохранения изменений')
        setIsSaving(false)
        return
      }

      // Check for internet connection
      if (!navigator.onLine) {
        setProfileError(
          'Нет подключения к интернету. Изменения будут сохранены локально.'
        )

        // Save to local storage as fallback
        const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
          ? JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
          : {}

        if (!settings.user) settings.user = {}
        settings.user.name = editedName

        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))

        // Update local state
        setUserProfile({
          ...userProfile,
          name: editedName,
        })

        setSaveSuccess(true)
        setTimeout(() => {
          setSaveSuccess(false)
        }, 3000)

        setIsEditing(false)
        setIsSaving(false)
        return
      }

      // Update user details via API
      // Send name directly to match the API expectation, not wrapped in preferences object
      const response = await updateUserPreferences({
        name: editedName,
        // Include the user ID to ensure the correct user is updated
        id: userProfile.id,
        // Include email to maintain all required user data
        email: userProfile.email,
      })

      console.log('Profile update response:', response)

      // Update local state after successful API call
      setUserProfile({
        ...userProfile,
        name: editedName,
      })

      // Show success indicator
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)

      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile changes:', error)

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ошибка при сохранении изменений'

      setProfileError(
        `Ошибка при сохранении: ${errorMessage}. Проверьте подключение к интернету.`
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Function to handle password change with improved error handling
  const handlePasswordChange = async () => {
    // Reset error and success messages
    setPasswordError('')
    setPasswordSuccess('')

    // Validate form
    if (!currentPassword) {
      setPasswordError('Пожалуйста, введите текущий пароль')
      return
    }

    if (!newPassword) {
      setPasswordError('Пожалуйста, введите новый пароль')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Новый пароль должен содержать не менее 6 символов')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают')
      return
    }

    setIsChangingPassword(true)

    try {
      console.log('Sending password change request with data:', {
        currentPassword,
        newPassword,
      })

      const result = await changePassword({
        currentPassword,
        newPassword,
      })

      console.log('Password change result:', result)

      // Reset form fields
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // Show success message
      setPasswordSuccess('Пароль успешно изменен')

      // Clear success message after 5 seconds
      setTimeout(() => {
        setPasswordSuccess('')
      }, 5000)
    } catch (error) {
      console.error('Error changing password:', error)

      // Handle different error types with user-friendly messages
      if (error instanceof Error) {
        if (
          error.message.toLowerCase().includes('current password') ||
          error.message.toLowerCase().includes('текущий пароль') ||
          error.message.toLowerCase().includes('неверный пароль')
        ) {
          setPasswordError('Текущий пароль указан неверно')
        } else if (
          error.message.includes('401') ||
          error.message.toLowerCase().includes('unauthorized') ||
          error.message.toLowerCase().includes('авторизац')
        ) {
          setPasswordError('Необходимо заново авторизоваться')
        } else {
          setPasswordError(`Ошибка при смене пароля: ${error.message}`)
        }
      } else {
        setPasswordError(
          'Не удалось изменить пароль. Пожалуйста, попробуйте позже.'
        )
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Handle Telegram bot connection
  const handleConnectTelegram = async () => {
    if (!telegramUsername.trim()) {
      setTelegramError('Пожалуйста, введите ваше имя пользователя в Telegram')
      return
    }

    setIsConnectingTelegram(true)
    setTelegramError('')

    try {
      // Simulated connection to Telegram bot
      // In a real implementation, this would make an API call to connect the user
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call

      // Save the settings
      const currentSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
        ? JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
        : {}

      if (!currentSettings.notifications) {
        currentSettings.notifications = {}
      }

      currentSettings.notifications.telegram = {
        username: telegramUsername,
        connected: true,
        connectedAt: new Date().toISOString(),
      }

      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(currentSettings)
      )

      setIsTelegramConnected(true)
      setTelegramSuccess(
        'Бот успешно подключен! Теперь вы будете получать уведомления в Telegram.'
      )

      // Clear success message after 5 seconds
      setTimeout(() => {
        setTelegramSuccess('')
      }, 5000)
    } catch (error) {
      console.error('Error connecting Telegram:', error)
      setTelegramError(
        'Не удалось подключить Telegram бота. Пожалуйста, попробуйте позже.'
      )
    } finally {
      setIsConnectingTelegram(false)
    }
  }

  // Handle disconnecting Telegram bot
  const handleDisconnectTelegram = async () => {
    try {
      // Simulated disconnection from Telegram bot
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      // Update the settings
      const currentSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
        ? JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
        : {}

      if (currentSettings.notifications?.telegram) {
        currentSettings.notifications.telegram.connected = false
        localStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(currentSettings)
        )
      }

      setIsTelegramConnected(false)
      setTelegramUsername('')
      setTelegramSuccess('Бот отключен')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setTelegramSuccess('')
      }, 3000)
    } catch (error) {
      console.error('Error disconnecting Telegram:', error)
      setTelegramError('Не удалось отключить Telegram бота')
    }
  }

  // Function to save settings to localStorage
  const saveSettings = (key: string, value: any) => {
    const currentSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      ? JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
      : {}

    // Split the key by dots to create nested structure
    const keys = key.split('.')
    let temp = currentSettings

    for (let i = 0; i < keys.length - 1; i++) {
      if (!temp[keys[i]]) {
        temp[keys[i]] = {}
      }
      temp = temp[keys[i]]
    }

    temp[keys[keys.length - 1]] = value

    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(currentSettings))
  }

  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    // Call the callback
    onThemeChange(newTheme)

    // Save theme with the consolidated function
    saveTheme(newTheme)
  }

  // Handle notifications toggle
  const handleNotificationsToggle = () => {
    const newValue = !notificationsEnabled
    setNotificationsEnabled(newValue)
    saveSettings('notifications.enabled', newValue)
  }

  // Handle sound toggle
  const handleSoundToggle = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    saveSettings('notifications.sound', newValue)
  }

  // Handle accent color change
  const handleAccentChange = (accent: string) => {
    console.log('Changing accent to:', accent)
    setSelectedAccent(accent)

    // Сохраняем настройку акцента
    saveSettings('appearance.accent', accent)

    // Логгируем результат сохранения
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    console.log(
      'Saved settings after accent change:',
      JSON.parse(savedSettings || '{}')
    )

    // Get the color object for the selected accent
    const accentColorObj = accentColors.find(c => c.id === accent)
    const primaryColor = accentColorObj?.color || COLORS.PRIMARY

    // Apply the selected color to CSS variables
    document.documentElement.style.setProperty('--color-primary', primaryColor)
    document.documentElement.style.setProperty(
      '--color-primary-light',
      accentColorObj?.lightColor || COLORS.PRIMARY_LIGHT
    )
    document.documentElement.style.setProperty(
      '--color-primary-dark',
      accentColorObj?.darkColor || COLORS.PRIMARY_DARK
    )

    // Update favicon colors based on the selected accent
    updateFaviconColors(primaryColor)

    // Показываем уведомление и обновляем страницу через 0.5 секунды
    const notification = document.createElement('div')
    notification.className = 'accent-change-notification'
    notification.textContent = 'Применение нового цвета акцента...'
    document.body.appendChild(notification)

    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  // Handle wallpaper change
  const handleWallpaperChange = (wallpaper: string) => {
    setSelectedWallpaper(wallpaper)
    saveSettings('appearance.wallpaper', wallpaper)

    // Call the callback to update Desktop component
    if (onWallpaperChange) {
      onWallpaperChange(wallpaper)
    }
  }

  // Handle user logout
  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из аккаунта?')) {
      // Save only theme and appearance settings - do NOT save user data
      const currentSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
        ? JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
        : {}

      // Extract only the appearance and workspace settings to preserve
      const settingsToPreserve = {
        appearance: currentSettings.appearance || {},
        workspace: currentSettings.workspace || {},
        // Explicitly NOT including user data
      }

      // Log the user out (which will clear the auth token)
      logout()

      // Restore only the appearance settings
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(settingsToPreserve)
      )

      // Reload the application to return to the login screen
      window.location.reload()
    }
  }

  // Available accent colors
  const accentColors = [
    {
      id: 'orange',
      color: COLORS.PRIMARY,
      lightColor: COLORS.PRIMARY_LIGHT,
      darkColor: COLORS.PRIMARY_DARK,
    },
    {
      id: 'blue',
      color: COLORS.SECONDARY,
      lightColor: '#7986CB',
      darkColor: '#3949AB',
    },
    {
      id: 'teal',
      color: COLORS.ACCENT,
      lightColor: '#4DD0E1',
      darkColor: '#0097A7',
    },
    {
      id: 'green',
      color: COLORS.SUCCESS,
      lightColor: '#81C784',
      darkColor: '#388E3C',
    },
    {
      id: 'purple',
      color: '#9C27B0',
      lightColor: '#BA68C8',
      darkColor: '#7B1FA2',
    },
    {
      id: 'red',
      color: COLORS.DANGER,
      lightColor: '#E57373',
      darkColor: '#D32F2F',
    },
  ]

  // Available wallpapers - use WALLPAPERS constant
  const wallpapers = Object.entries(WALLPAPERS).map(([id, data]) => ({
    id,
    name: data.name,
  }))

  // Add state for about tab accordion
  const [expandedSection, setExpandedSection] = useState<string | null>(
    'about-main'
  )

  // Компонент загрузочного экрана
  const AppLoadingScreen = () => (
    <div className="settings-app-loading-screen">
      <div className="app-loading-content">
        <div className="app-logo-container">
          <div className="app-logo-animation">
            <svg
              width="100"
              height="100"
              viewBox="0 0 256 256"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="app-loading-logo"
            >
              <g className="app-logo-icon">
                {/* Фон */}
                <rect
                  width="256"
                  height="256"
                  rx="48"
                  fill="var(--color-primary)"
                />

                {/* Сотовая структура */}
                <g className="honeycomb-structure">
                  {/* Центральная сота */}
                  <path
                    d="M128 76L178 104V160L128 188L78 160V104L128 76Z"
                    fill="var(--color-primary-light)"
                    stroke="var(--color-primary-dark)"
                    strokeWidth="4"
                    className="center-cell"
                  />

                  {/* Верхняя сота */}
                  <path
                    d="M128 26L178 54V110L128 138L78 110V54L128 26Z"
                    fill="#FFE0B2"
                    stroke="var(--color-primary-dark)"
                    strokeWidth="4"
                    opacity="0.6"
                    className="outer-cell top-cell"
                  />

                  {/* Нижняя сота */}
                  <path
                    d="M128 126L178 154V210L128 238L78 210V154L128 126Z"
                    fill="#FFE0B2"
                    stroke="var(--color-primary-dark)"
                    strokeWidth="4"
                    opacity="0.6"
                    className="outer-cell bottom-cell"
                  />

                  {/* Левая сота */}
                  <path
                    d="M78 104L128 132V188L78 216L28 188V132L78 104Z"
                    fill="#FFE0B2"
                    stroke="var(--color-primary-dark)"
                    strokeWidth="4"
                    opacity="0.6"
                    className="outer-cell left-cell"
                  />

                  {/* Правая сота */}
                  <path
                    d="M178 104L228 132V188L178 216L128 188V132L178 104Z"
                    fill="#FFE0B2"
                    stroke="var(--color-primary-dark)"
                    strokeWidth="4"
                    opacity="0.6"
                    className="outer-cell right-cell"
                  />
                </g>
              </g>
            </svg>
            <div className="loading-glow"></div>
          </div>
        </div>
        <h2 className="loading-app-title">HiveOS</h2>
        <div className="loading-app-subtitle">Настройки</div>
        <div className="loading-progress">
          <div className="loading-bar">
            <div className="loading-bar-fill"></div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render the appropriate settings section based on active category
  const renderSettingsContent = () => {
    switch (activeCategory) {
      case 'appearance':
        return (
          <div className="settings-content-section">
            <div className="settings-section">
              <h3 className="settings-section-title">Тема</h3>
              <div className="theme-selection">
                <div
                  className="theme-option"
                  onClick={() => handleThemeChange('light')}
                >
                  <div
                    className={`theme-preview light ${
                      theme === 'light' ? 'selected' : ''
                    }`}
                  ></div>
                  <div className="theme-label">
                    <span>Светлая тема</span>
                  </div>
                </div>
                <div
                  className="theme-option"
                  onClick={() => handleThemeChange('dark')}
                >
                  <div
                    className={`theme-preview dark ${
                      theme === 'dark' ? 'selected' : ''
                    }`}
                  ></div>
                  <div className="theme-label">
                    <span>Темная тема</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">Цветовой акцент</h3>
              <div className="color-options">
                {accentColors.map(colorOption => (
                  <div
                    key={colorOption.id}
                    className={`color-option ${
                      selectedAccent === colorOption.id ? 'selected' : ''
                    }`}
                    style={{ backgroundColor: colorOption.color }}
                    onClick={() => handleAccentChange(colorOption.id)}
                  >
                    {selectedAccent === colorOption.id && (
                      <i className="fas fa-check"></i>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">Обои рабочего стола</h3>
              <div className="wallpaper-options">
                {wallpapers.map(wallpaper => (
                  <div
                    key={wallpaper.id}
                    className={`wallpaper-option ${
                      selectedWallpaper === wallpaper.id ? 'selected' : ''
                    }`}
                    onClick={() => handleWallpaperChange(wallpaper.id)}
                  >
                    <div className={`wallpaper-preview ${wallpaper.id}`}></div>
                    <div className="wallpaper-name">{wallpaper.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="settings-content-section">
            <div className="settings-section">
              <h3 className="settings-section-title">Интеграция с Telegram</h3>

              {telegramError && (
                <div className="profile-error">{telegramError}</div>
              )}

              {telegramSuccess && (
                <div className="profile-success">{telegramSuccess}</div>
              )}

              <div className="telegram-info">
                <div className="telegram-icon">
                  <i className="fab fa-telegram-plane"></i>
                </div>
                <p>
                  Подключите нашего Telegram бота, чтобы получать мгновенные
                  уведомления о новых задачах, событиях календаря и напоминаниях
                  о важных делах.
                </p>
              </div>

              <div className="telegram-instructions">
                <h4>Как подключить бота:</h4>
                <ol>
                  <li>
                    Откройте Telegram и найдите нашего бота:{' '}
                    <strong>@HiveOS_notification_bot</strong>
                  </li>
                  <li>
                    Начните диалог с ботом, нажав кнопку "Start" или "Начать"
                  </li>
                  <li>Введите ваше имя пользователя в Telegram в поле ниже</li>
                  <li>Нажмите "Подключить" для завершения процесса</li>
                </ol>
              </div>

              {!isTelegramConnected ? (
                <div className="telegram-connect-form">
                  <div className="form-group">
                    <label>Ваше имя пользователя в Telegram</label>
                    <div className="input-with-prefix">
                      <span className="input-prefix">@</span>
                      <input
                        type="text"
                        value={telegramUsername}
                        onChange={e => setTelegramUsername(e.target.value)}
                        placeholder="username"
                        disabled={isConnectingTelegram}
                      />
                    </div>
                  </div>

                  <button
                    className="telegram-connect-btn"
                    onClick={handleConnectTelegram}
                    disabled={isConnectingTelegram}
                  >
                    {isConnectingTelegram ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>{' '}
                        Подключение...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-link"></i> Подключить
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="telegram-connected">
                  <div className="telegram-status">
                    <div className="connected-badge">
                      <i className="fas fa-check-circle"></i> Подключено
                    </div>
                    <div className="telegram-username">@{telegramUsername}</div>
                  </div>

                  <button
                    className="telegram-disconnect-btn"
                    onClick={handleDisconnectTelegram}
                  >
                    <i className="fas fa-unlink"></i> Отключить
                  </button>
                </div>
              )}

              <div className="notification-types-info">
                <h4>Типы уведомлений в Telegram:</h4>
                <ul className="notification-features">
                  <li>
                    <i className="fas fa-tasks"></i>
                    <span>Новые задачи и дедлайны</span>
                  </li>
                  <li>
                    <i className="fas fa-calendar-check"></i>
                    <span>Напоминания о событиях календаря</span>
                  </li>
                  <li>
                    <i className="fas fa-bell"></i>
                    <span>Ежедневные сводки</span>
                  </li>
                  <li>
                    <i className="fas fa-clock"></i>
                    <span>Напоминания о дедлайнах</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'account':
        return (
          <div className="settings-content-section">
            {isLoadingProfile ? (
              <div className="account-loading-screen">
                <div className="particles-container">
                  <div className="particle"></div>
                  <div className="particle"></div>
                  <div className="particle"></div>
                  <div className="particle"></div>
                  <div className="particle"></div>
                  <div className="particle"></div>
                  <div className="particle"></div>
                </div>
                <div className="account-loading-content">
                  <div className="profile-card">
                    <div className="card-shine"></div>
                    <div className="card-header">
                      <div className="brand-logo"></div>
                      <div className="header-decoration"></div>
                    </div>
                    <div className="avatar-container">
                      <div className="avatar-placeholder">
                        <div className="avatar-border"></div>
                        <div className="avatar-decoration"></div>
                        <div className="avatar-decoration"></div>
                        <div className="avatar-decoration"></div>
                        <div className="avatar-decoration"></div>
                        <div className="avatar-inner"></div>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="profile-badge">Пользователь</div>
                      <div className="profile-data">
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line"></div>
                        <div className="skeleton-button"></div>
                      </div>
                    </div>
                  </div>
                  <div className="loading-indicator">
                    <div className="loading-dots">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                    <div className="loading-message">
                      Загрузка данных профиля...
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="settings-section">
                  <h3 className="settings-section-title">
                    Информация о профиле
                  </h3>

                  {profileError && (
                    <div className="profile-error">
                      <i className="fas fa-exclamation-circle"></i>
                      <span>{profileError}</span>
                      {profileError.includes('недоступен') ||
                      profileError.includes('ошибка') ? (
                        <button
                          onClick={loadUserProfile}
                          className="retry-button"
                        >
                          <i className="fas fa-sync-alt"></i> Повторить
                        </button>
                      ) : null}
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="profile-success">
                      <i className="fas fa-check-circle"></i>
                      <span>Данные профиля успешно сохранены</span>
                    </div>
                  )}

                  <div className="account-profile">
                    <div className="profile-avatar">
                      <div className="avatar-img">
                        {userProfile.avatar ? (
                          <img
                            src={userProfile.avatar}
                            alt={userProfile.name || 'User avatar'}
                          />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <button className="change-avatar-btn" disabled>
                        Изменить
                      </button>
                    </div>

                    <div className="profile-info">
                      <div className="form-group">
                        <label>Имя пользователя</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedName}
                            onChange={e => setEditedName(e.target.value)}
                            placeholder="Введите имя пользователя"
                          />
                        ) : (
                          <div className="profile-field">
                            <span>{userProfile.name || 'Не указано'}</span>
                            <button
                              className="edit-field-btn"
                              onClick={() => setIsEditing(true)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Email</label>
                        <div className="profile-field readonly">
                          <span>{userProfile.email || 'Не указано'}</span>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="form-group form-actions">
                          <button
                            className="cancel-profile-btn"
                            onClick={() => {
                              setIsEditing(false)
                              setEditedName(userProfile.name)
                            }}
                            disabled={isSaving}
                          >
                            Отмена
                          </button>
                          <button
                            className="save-profile-btn"
                            onClick={saveProfileChanges}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>{' '}
                                Сохранение...
                              </>
                            ) : (
                              'Сохранить изменения'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add logout section */}
                <div className="settings-section">
                  <h3 className="settings-section-title">Выход из системы</h3>
                  <div className="logout-container">
                    <p className="logout-description">
                      Нажмите кнопку ниже, чтобы выйти из своего аккаунта. Вам
                      потребуется войти снова, чтобы получить доступ к вашим
                      данным.
                    </p>
                    <button className="logout-btn" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt"></i> Выйти из аккаунта
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )

      case 'security':
        return (
          <div className="settings-content-section">
            <div className="settings-section">
              <h3 className="settings-section-title">Безопасность аккаунта</h3>

              {passwordError && (
                <div className="profile-error">{passwordError}</div>
              )}

              {passwordSuccess && (
                <div className="profile-success">{passwordSuccess}</div>
              )}

              <div className="form-group">
                <label>Текущий пароль</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  disabled={isChangingPassword}
                />
              </div>

              <div className="form-group">
                <label>Новый пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Введите новый пароль"
                  disabled={isChangingPassword}
                />
                <div className="field-hint">Минимум 6 символов</div>
              </div>

              <div className="form-group">
                <label>Подтверждение нового пароля</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  disabled={isChangingPassword}
                />
              </div>

              <div className="form-group">
                <button
                  className="change-password-btn"
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !isAuthenticated()}
                >
                  {isChangingPassword ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Изменение
                      пароля...
                    </>
                  ) : (
                    'Сменить пароль'
                  )}
                </button>
                {!isAuthenticated() && (
                  <div className="field-hint error">
                    Для смены пароля необходимо авторизоваться
                  </div>
                )}
              </div>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">
                Двухфакторная аутентификация
              </h3>

              <div className="settings-option">
                <div className="option-label">
                  <i className="fas fa-shield-alt"></i>
                  <span>Включить 2FA</span>
                </div>
                <div className="toggle-container">
                  <label className="toggle">
                    <input type="checkbox" disabled />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="mfa-info">
                <p>
                  <span className="coming-soon-badge">Скоро</span>
                  Двухфакторная аутентификация добавляет дополнительный уровень
                  безопасности к вашему аккаунту.
                </p>
              </div>
            </div>
          </div>
        )

      case 'about':
        return (
          <div className="settings-content-section">
            <div className="settings-section about-main">
              <div className="about-app">
                <div className="app-logo">
                  <DynamicAppLogo />
                </div>

                <div className="app-info">
                  <h2>HiveOS</h2>
                  <p className="version">Версия 1.0.0</p>
                  <div className="about-badges">
                    <span className="about-badge">
                      <i className="fas fa-code"></i> sviftcommunity
                    </span>
                    <a
                      href="https://github.com/stsvift/Hive/blob/main/LICENSE"
                      ense
                      target="_blank"
                      rel="noopener noreferrer"
                      className="about-badge license"
                    >
                      <i className="fas fa-certificate"></i> GPL-3.0 License
                    </a>
                  </div>
                  <p className="description">
                    HiveOS - это современная платформа для организации рабочего
                    пространства, объединяющая все необходимые инструменты для
                    повышения продуктивности в одном интерфейсе.
                  </p>
                </div>
              </div>
            </div>

            <div className="accordion-container">
              <div
                className={`accordion-item ${
                  expandedSection === 'about-features' ? 'expanded' : ''
                }`}
                onClick={() =>
                  setExpandedSection(
                    expandedSection === 'about-features'
                      ? null
                      : 'about-features'
                  )
                }
              >
                <div className="accordion-header">
                  <h3>
                    <i className="fas fa-star"></i> Ключевые возможности
                  </h3>
                  <i
                    className={`fas fa-chevron-${
                      expandedSection === 'about-features' ? 'up' : 'down'
                    }`}
                  ></i>
                </div>
                <div className="accordion-content">
                  <div className="features-grid">
                    <div className="feature-card">
                      <div className="feature-icon task-icon">
                        <i className="fas fa-tasks"></i>
                      </div>
                      <h4>Управление задачами</h4>
                      <p>
                        Создавайте, группируйте и отслеживайте задачи с гибкими
                        настройками приоритетов и дедлайнов.
                      </p>
                    </div>

                    <div className="feature-card">
                      <div className="feature-icon notes-icon">
                        <i className="fas fa-sticky-note"></i>
                      </div>
                      <h4>Заметки</h4>
                      <p>
                        Быстро создавайте заметки с возможностью форматирования
                        и категоризации.
                      </p>
                    </div>

                    <div className="feature-card">
                      <div className="feature-icon calendar-icon">
                        <i className="fas fa-calendar-alt"></i>
                      </div>
                      <h4>Календарь</h4>
                      <p>
                        Планируйте события и встречи с удобной системой
                        напоминаний.
                      </p>
                    </div>

                    <div className="feature-card">
                      <div className="feature-icon files-icon">
                        <i className="fas fa-file-alt"></i>
                      </div>
                      <h4>Управление файлами</h4>
                      <p>
                        Организуйте и храните ваши документы и файлы в
                        структурированном виде.
                      </p>
                    </div>

                    <div className="feature-card">
                      <div className="feature-icon theme-icon">
                        <i className="fas fa-palette"></i>
                      </div>
                      <h4>Настраиваемый интерфейс</h4>
                      <p>
                        Выбирайте темы, акцентные цвета и обои для создания
                        комфортного рабочего пространства.
                      </p>
                    </div>

                    <div className="feature-card">
                      <div className="feature-icon tg-icon">
                        <i className="fab fa-telegram-plane"></i>
                      </div>
                      <h4>Интеграция с Telegram</h4>
                      <p>
                        Получайте уведомления и управляйте задачами через
                        Telegram-бота.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`accordion-item ${
                  expandedSection === 'about-changelog' ? 'expanded' : ''
                }`}
                onClick={() =>
                  setExpandedSection(
                    expandedSection === 'about-changelog'
                      ? null
                      : 'about-changelog'
                  )
                }
              >
                <div className="accordion-header">
                  <h3>
                    <i className="fas fa-history"></i> История версий
                  </h3>
                  <i
                    className={`fas fa-chevron-${
                      expandedSection === 'about-changelog' ? 'up' : 'down'
                    }`}
                  ></i>
                </div>
                <div className="accordion-content">
                  <div className="changelog">
                    <div className="version-entry">
                      <div className="version-header">
                        <h4>Версия 1.0.0</h4>
                        <span className="version-date">март 2025</span>
                      </div>
                      <div className="version-tag release">Релиз</div>
                      <ul className="version-changes">
                        <li>Первый официальный релиз</li>
                        <li>Добавлено управление задачами и заметками</li>
                        <li>Добавлен календарь с напоминаниями</li>
                        <li>Реализована система хранения файлов</li>
                        <li>Поддержка светлой и темной темы</li>
                      </ul>
                    </div>

                    <div className="version-entry">
                      <div className="version-header">
                        <h4>Версия 0.9.5</h4>
                        <span className="version-date">февраль 2025</span>
                      </div>
                      <div className="version-tag beta">Бета</div>
                      <ul className="version-changes">
                        <li>Финальное бета-тестирование</li>
                        <li>Улучшения производительности</li>
                        <li>Исправлены ошибки в интерфейсе</li>
                        <li>Оптимизация для мобильных устройств</li>
                      </ul>
                    </div>

                    <div className="version-entry">
                      <div className="version-header">
                        <h4>Версия 0.8.0</h4>
                        <span className="version-date">январь 2025</span>
                      </div>
                      <div className="version-tag beta">Бета</div>
                      <ul className="version-changes">
                        <li>Добавлена система уведомлений</li>
                        <li>Первая версия API для интеграций</li>
                        <li>Новые настройки приватности</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="clear-data">
                <h3 className="settings-section-title">Управление данными</h3>
                <button
                  className="clear-data-btn"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Вы уверены, что хотите сбросить все настройки? Это действие невозможно отменить.'
                      )
                    ) {
                      // Clear all localStorage except for user auth
                      Object.keys(localStorage).forEach(key => {
                        if (key !== STORAGE_KEYS.AUTH_TOKEN) {
                          localStorage.removeItem(key)
                        }
                      })
                      alert(
                        'Настройки сброшены. Приложение будет перезагружено.'
                      )
                      window.location.reload()
                    }
                  }}
                >
                  <i className="fas fa-trash-alt"></i> Сбросить все настройки
                </button>
              </div>
            </div>

            <div className="copyright-footer">
              <p>© {new Date().getFullYear()} HiveOS. Все права защищены.</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isAppLoading) {
    return <AppLoadingScreen />
  }

  return (
    <div className="settings-app">
      <div className="settings-sidebar">
        <div
          className={`settings-category ${
            activeCategory === 'appearance' ? 'active' : ''
          }`}
          onClick={() => setActiveCategory('appearance')}
        >
          <i className="fas fa-palette"></i>
          <span>Внешний вид</span>
        </div>

        <div
          className={`settings-category ${
            activeCategory === 'notifications' ? 'active' : ''
          }`}
          onClick={() => setActiveCategory('notifications')}
        >
          <i className="fas fa-bell"></i>
          <span>Уведомления</span>
        </div>

        <div
          className={`settings-category ${
            activeCategory === 'account' ? 'active' : ''
          }`}
          onClick={() => setActiveCategory('account')}
        >
          <i className="fas fa-user"></i>
          <span>Аккаунт</span>
        </div>

        <div
          className={`settings-category ${
            activeCategory === 'security' ? 'active' : ''
          }`}
          onClick={() => setActiveCategory('security')}
        >
          <i className="fas fa-shield-alt"></i>
          <span>Безопасность</span>
        </div>

        <div
          className={`settings-category ${
            activeCategory === 'about' ? 'active' : ''
          }`}
          onClick={() => setActiveCategory('about')}
        >
          <i className="fas fa-info-circle"></i>
          <span>О программе</span>
        </div>
      </div>

      <div className="settings-content">
        <h2 className="settings-title">
          {activeCategory === 'appearance' && 'Внешний вид'}
          {activeCategory === 'notifications' && 'Уведомления'}
          {activeCategory === 'account' && 'Аккаунт'}
          {activeCategory === 'security' && 'Безопасность'}
          {activeCategory === 'about' && 'О программе'}
        </h2>

        {renderSettingsContent()}
      </div>
    </div>
  )
}

// Компонент для динамической отрисовки SVG логотипа с текущим акцентным цветом
const DynamicAppLogo: React.FC = () => {
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

export default SettingsApp
