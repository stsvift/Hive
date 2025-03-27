import React, { useEffect, useState } from 'react'
import { COLORS, STORAGE_KEYS } from '../../config/constants'
import {
  login,
  LoginRequest,
  register,
  RegisterRequest,
} from '../../utils/authService'
import { saveSetting, WALLPAPERS } from '../../utils/settingsManager'
import './Welcome.css'

interface WelcomeProps {
  onComplete: () => void
}

const Welcome: React.FC<WelcomeProps> = ({ onComplete }) => {
  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome')
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('light')
  const [selectedAccent, setSelectedAccent] = useState('orange')
  const [selectedWallpaper, setSelectedWallpaper] = useState('modern')
  const [selectedWorkspace, setSelectedWorkspace] = useState<string[]>([
    'tasks',
    'notes',
    'calendar',
  ])
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string>('')

  // Make sure settings is always included in the initial selection
  useEffect(() => {
    if (!selectedWorkspace.includes('settings')) {
      setSelectedWorkspace([...selectedWorkspace, 'settings'])
    }
  }, [])

  // Apply theme and accent color immediately for preview
  useEffect(() => {
    // Always keep welcome-screen in light mode regardless of selection
    const welcomeScreen = document.querySelector('.welcome-screen')
    if (welcomeScreen) {
      welcomeScreen.classList.remove('dark') // Always keep welcome screen light
    }

    const selectedColor = accentColors.find(c => c.id === selectedAccent)
    if (selectedColor) {
      document.documentElement.style.setProperty(
        '--color-primary',
        selectedColor.color
      )
      document.documentElement.style.setProperty(
        '--color-primary-light',
        selectedColor.lightColor || ''
      )
      document.documentElement.style.setProperty(
        '--color-primary-dark',
        selectedColor.darkColor || ''
      )
    }
  }, [selectedAccent]) // selectedTheme is not used to update actual styles

  const nextStep = async () => {
    // Если мы на первом шаге и еще не авторизованы, сначала регистрируем пользователя
    if (step === 1 && !isAuthenticated) {
      // Проверяем пароли
      if (password !== confirmPassword) {
        setRegisterError('Пароли не совпадают')
        return
      }

      // Регистрируем пользователя перед переходом к следующему шагу
      await registerUser()
    } else {
      // Если уже авторизованы или на другом шаге, просто переходим дальше
      if (step < 4) {
        setStep(step + 1)
        // Сохраняем настройки на каждом шаге
        saveCurrentPreferences()
      } else {
        completeRegistration()
      }
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // Новая функция для регистрации пользователя
  const registerUser = async () => {
    // Проверяем заполнение полей
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setRegisterError('Пожалуйста, заполните все поля')
      return
    }

    // Проверяем совпадение паролей
    if (password !== confirmPassword) {
      setRegisterError('Пароли не совпадают')
      return
    }

    setIsLoading(true)
    setRegisterError('')

    try {
      // Отправляем запрос на регистрацию
      const userData: RegisterRequest = { name, email, password }
      console.log('Регистрация пользователя:', userData.name, userData.email)

      const response = await register(userData)

      // Регистрация успешна
      console.log('Регистрация успешна:', response)
      setIsAuthenticated(true)
      if (response.user?.id) {
        setUserId(response.user.id)
      }

      // Переходим к следующему шагу
      setStep(step + 1)
      setIsLoading(false)
    } catch (error) {
      console.error('Ошибка при регистрации:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ошибка регистрации. Пожалуйста, попробуйте снова.'

      // Более понятные сообщения об ошибках
      let displayError = errorMessage
      if (errorMessage.toLowerCase().includes('email')) {
        displayError =
          'Этот email уже используется или имеет неверный формат. Пожалуйста, проверьте данные.'
      } else if (errorMessage.toLowerCase().includes('password')) {
        displayError =
          'Пароль не соответствует требованиям. Используйте не менее 6 символов, включая буквы и цифры.'
      } else if (errorMessage.toLowerCase().includes('username')) {
        displayError =
          'Имя пользователя уже используется или имеет неверный формат.'
      } else if (errorMessage.includes('validation')) {
        displayError =
          'Введены некорректные данные. Пожалуйста, проверьте форму регистрации.'
      }

      setRegisterError(displayError)
      setIsLoading(false)
    }
  }

  // Функция для сохранения текущих настроек
  const saveCurrentPreferences = () => {
    if (!isAuthenticated) return

    if (step === 2) {
      // Сохраняем настройки внешнего вида
      saveSetting('appearance.theme', selectedTheme)
      saveSetting('appearance.accent', selectedAccent)
      saveSetting('appearance.wallpaper', selectedWallpaper)
    } else if (step === 3) {
      // Сохраняем настройки рабочего пространства
      saveSetting('workspace.apps', selectedWorkspace)
    }
  }

  const handleLogin = async () => {
    // Clear any previous errors
    setLoginError('')

    // Validate form
    if (!email.trim() || !password.trim()) {
      setLoginError('Пожалуйста, введите email и пароль')
      return
    }

    setIsLoading(true)

    try {
      const credentials: LoginRequest = { email, password }
      const response = await login(credentials)

      // Login successful, save user data
      setIsAuthenticated(true)
      if (response.user?.id) {
        setUserId(response.user.id)
      }

      // Extract user name from response, with fallbacks
      const userName =
        response.user?.name ||
        response.user?.userName ||
        response.user?.username ||
        email.split('@')[0]

      // Extract user theme with fallback to light
      const userTheme = (response.user?.theme as 'light' | 'dark') || 'light'

      // Login successful, save user data
      handleLoginSuccess(userName, userTheme)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ошибка входа. Проверьте данные и попробуйте снова.'

      // Более понятные сообщения об ошибках
      let displayError = errorMessage
      if (
        errorMessage.toLowerCase().includes('credentials') ||
        errorMessage.toLowerCase().includes('password') ||
        errorMessage.toLowerCase().includes('email')
      ) {
        displayError =
          'Неверный email или пароль. Пожалуйста, проверьте данные и попробуйте снова.'
      } else if (errorMessage.toLowerCase().includes('not found')) {
        displayError = 'Пользователь с таким email не найден.'
      }

      setLoginError(displayError)
      setIsLoading(false)
    }
  }

  // Function to handle login success
  const handleLoginSuccess = (
    userName: string,
    userTheme: 'light' | 'dark'
  ) => {
    // Save current settings if they exist
    const currentSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    const settingsObj = currentSettings ? JSON.parse(currentSettings) : {}

    // Save theme if not already in settings
    if (!settingsObj.appearance) {
      settingsObj.appearance = {}
    }
    if (!settingsObj.appearance.theme) {
      settingsObj.appearance.theme = userTheme
    }

    // Make sure to set onboardingCompleted to true to avoid login loop
    if (!settingsObj.user) {
      settingsObj.user = {}
    }
    settingsObj.user.onboardingCompleted = true
    settingsObj.user.dateFirstLaunched =
      settingsObj.user.dateFirstLaunched || new Date().toISOString()

    // Save appearance settings only - no user data
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsObj))

    // Custom favicon restoration if needed
    const currentFavicon = localStorage.getItem(STORAGE_KEYS.CUSTOM_FAVICON)
    if (currentFavicon) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_FAVICON, currentFavicon)
    }

    setTimeout(() => {
      onComplete()
    }, 100)
  }

  const completeRegistration = async () => {
    // Check if the user is authenticated - use the state variable, not a function call
    if (!isAuthenticated) {
      // Changed from isAuthenticated() to isAuthenticated
      setRegisterError(
        'Произошла ошибка авторизации. Пожалуйста, попробуйте снова.'
      )
      setStep(1) // Return to the initial registration step
      return
    }

    setIsLoading(true)

    try {
      // Save only appearance and workspace settings - NO user data in localStorage
      saveSetting('appearance.theme', selectedTheme)
      saveSetting('appearance.accent', selectedAccent)
      saveSetting('appearance.wallpaper', selectedWallpaper)
      saveSetting('workspace.apps', selectedWorkspace)

      // Remove user data saving to localStorage - this data should only come from API
      // saveSetting('user.name', name) - REMOVED
      // saveSetting('user.email', email) - REMOVED
      saveSetting('user.onboardingCompleted', true)
      saveSetting('user.dateFirstLaunched', new Date().toISOString())
      // saveSetting('user.id', userId) - REMOVED

      // Apply theme
      document.documentElement.classList.toggle(
        'dark',
        selectedTheme === 'dark'
      )

      setIsLoading(false)
      onComplete()
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ошибка сохранения настроек. Пожалуйста, попробуйте снова.'
      setRegisterError(errorMessage)
      setIsLoading(false)
    }
  }

  // Available accent colors - match those in SettingsApp
  const accentColors = [
    {
      id: 'orange',
      color: COLORS.PRIMARY,
      lightColor: COLORS.PRIMARY_LIGHT,
      darkColor: COLORS.PRIMARY_DARK,
      name: 'Оранжевый',
    },
    {
      id: 'blue',
      color: COLORS.SECONDARY,
      lightColor: '#7986CB',
      darkColor: '#3949AB',
      name: 'Синий',
    },
    {
      id: 'teal',
      color: COLORS.ACCENT,
      lightColor: '#4DD0E1',
      darkColor: '#0097A7',
      name: 'Бирюзовый',
    },
    {
      id: 'green',
      color: COLORS.SUCCESS,
      lightColor: '#81C784',
      darkColor: '#388E3C',
      name: 'Зеленый',
    },
    {
      id: 'purple',
      color: '#9C27B0',
      lightColor: '#BA68C8',
      darkColor: '#7B1FA2',
      name: 'Фиолетовый',
    },
    {
      id: 'red',
      color: COLORS.DANGER,
      lightColor: '#E57373',
      darkColor: '#D32F2F',
      name: 'Красный',
    },
  ]

  // Workspace options - match with actual available apps
  const workspaceOptions = [
    {
      id: 'tasks',
      name: 'Задачи',
      icon: 'tasks',
      description: 'Управление задачами и проектами',
    },
    {
      id: 'notes',
      name: 'Заметки',
      icon: 'sticky-note',
      description: 'Создание и организация заметок',
    },
    {
      id: 'calendar',
      name: 'Календарь',
      icon: 'calendar-alt',
      description: 'Планирование событий и встреч',
    },
    {
      id: 'projects',
      name: 'Проекты',
      icon: 'briefcase',
      description: 'Управление рабочими проектами',
    },
    {
      id: 'files',
      name: 'Файлы',
      icon: 'folder',
      description: 'Управление файлами и документами',
    },
    {
      id: 'settings',
      name: 'Настройки',
      icon: 'cog',
      description: 'Персонализация системы',
    },
  ]

  // Get wallpaper options from the system constants in the same order as SettingsApp
  const wallpaperOptions = [
    { id: 'modern', name: WALLPAPERS.modern.name },
    { id: 'honeycomb', name: WALLPAPERS.honeycomb.name },
    { id: 'gradient', name: WALLPAPERS.gradient.name },
    { id: 'minimal', name: WALLPAPERS.minimal.name },
  ]

  const toggleWorkspaceOption = (id: string) => {
    // Never allow deselecting the Settings app
    if (id === 'settings') return

    if (selectedWorkspace.includes(id)) {
      // Don't allow deselecting all items
      if (selectedWorkspace.length > 1) {
        setSelectedWorkspace(selectedWorkspace.filter(item => item !== id))
      }
    } else {
      setSelectedWorkspace([...selectedWorkspace, id])
    }
  }

  const progressPercentage = (step / 4) * 100

  const renderWelcomeScreen = () => (
    <div className="welcome-step fade-in">
      <h2>Добро пожаловать в HiveOS!</h2>
      <p>
        HiveOS - это современная система для управления задачами и проектами,
        вдохновленная естественной эффективностью пчелиного улья.
      </p>
      <div className="welcome-features">
        <div className="welcome-feature">
          <i className="fas fa-tasks"></i>
          <span>Управление задачами</span>
        </div>
        <div className="welcome-feature">
          <i className="fas fa-calendar-alt"></i>
          <span>Календарь событий</span>
        </div>
        <div className="welcome-feature">
          <i className="fas fa-sticky-note"></i>
          <span>Заметки</span>
        </div>
        <div className="welcome-feature">
          <i className="fas fa-briefcase"></i>
          <span>Управление проектами</span>
        </div>
        <div className="welcome-feature">
          <i className="fas fa-folder"></i>
          <span>Управление файлами</span>
        </div>
        <div className="welcome-feature">
          <i className="fas fa-palette"></i>
          <span>Персонализация</span>
        </div>
      </div>
      <div className="welcome-buttons">
        <button
          className="welcome-button primary"
          onClick={() => setMode('register')}
        >
          Зарегистрироваться
        </button>
        <button
          className="welcome-button secondary"
          onClick={() => setMode('login')}
        >
          Войти в систему
        </button>
      </div>
    </div>
  )

  const renderLoginScreen = () => (
    <div className="welcome-step fade-in">
      <h2>Вход в HiveOS</h2>
      <p>Введите ваши данные для входа в систему</p>

      {loginError && <div className="login-error">{loginError}</div>}

      <div className="welcome-input-group">
        <label htmlFor="email-input">Email</label>
        <input
          id="email-input"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Введите ваш email"
          autoFocus
          disabled={isLoading}
        />
      </div>

      <div className="welcome-input-group">
        <label htmlFor="password-input">Пароль</label>
        <input
          id="password-input"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Введите ваш пароль"
          disabled={isLoading}
        />
      </div>

      <div className="welcome-buttons">
        <button
          className="welcome-button secondary"
          onClick={() => setMode('welcome')}
          disabled={isLoading}
        >
          Назад
        </button>
        <button
          className="welcome-button primary"
          onClick={handleLogin}
          disabled={isLoading || !email.trim() || !password.trim()}
        >
          {isLoading ? 'Входим...' : 'Войти'}
        </button>
      </div>

      <div className="login-footer">
        <p>
          Еще нет аккаунта?{' '}
          <button
            className="text-button"
            onClick={() => setMode('register')}
            disabled={isLoading}
          >
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  )

  const renderRegistrationSteps = () => {
    switch (step) {
      case 1:
        return (
          <div className="welcome-step fade-in">
            <h2>Регистрация в HiveOS</h2>
            <p>Для начала работы, создайте учетную запись</p>

            {registerError && (
              <div className="login-error">{registerError}</div>
            )}

            <div className="welcome-input-group">
              <label htmlFor="name-input">Ваше имя</label>
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Введите ваше имя"
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="welcome-input-group">
              <label htmlFor="email-input">Email</label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Введите ваш email"
                disabled={isLoading}
              />
            </div>

            <div className="welcome-input-group">
              <label htmlFor="password-input">Пароль</label>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Создайте пароль"
                disabled={isLoading}
              />
            </div>

            <div className="welcome-input-group">
              <label htmlFor="confirm-password-input">
                Подтверждение пароля
              </label>
              <input
                id="confirm-password-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                disabled={isLoading}
              />
            </div>

            <div className="welcome-buttons">
              <button
                className="welcome-button secondary"
                onClick={() => setMode('welcome')}
                disabled={isLoading}
              >
                Назад
              </button>
              <button
                className="welcome-button primary"
                onClick={nextStep}
                disabled={
                  isLoading ||
                  !name.trim() ||
                  !email.trim() ||
                  !password.trim() ||
                  !confirmPassword.trim()
                }
              >
                {isLoading ? 'Регистрация...' : 'Продолжить'}
              </button>
            </div>
          </div>
        )
      case 2:
        return renderAppearanceStep()
      case 3:
      case 4:
        return (
          <div className="welcome-step fade-in">
            <h2>Выберите приложения для рабочего стола</h2>
            <p>
              Отметьте приложения, которые вы хотите видеть на рабочем столе. Вы
              всегда сможете изменить эти настройки позже.
            </p>

            <div className="workspace-options">
              {workspaceOptions.map(option => (
                <div
                  key={option.id}
                  className={`workspace-option ${
                    selectedWorkspace.includes(option.id) ? 'selected' : ''
                  } ${option.id === 'settings' ? 'disabled' : ''}`}
                  onClick={() => toggleWorkspaceOption(option.id)}
                >
                  <div className="workspace-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedWorkspace.includes(option.id)}
                      onChange={() => toggleWorkspaceOption(option.id)}
                      disabled={option.id === 'settings' || isLoading}
                    />
                  </div>
                  <div className="workspace-icon">
                    <i className={`fas fa-${option.icon}`}></i>
                  </div>
                  <div className="workspace-details">
                    <h4>{option.name}</h4>
                    <p>{option.description}</p>
                    {option.id === 'settings' && (
                      <small className="required-app">
                        Обязательное приложение
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="welcome-summary">
              <p>
                <strong>Настройка завершена, {name}!</strong> На рабочем столе
                будут отображаться только выбранные вами приложения.
              </p>
            </div>

            <div className="welcome-buttons">
              <button
                className="welcome-button secondary"
                onClick={prevStep}
                disabled={isLoading}
              >
                Назад
              </button>
              <button
                className="welcome-button primary"
                onClick={completeRegistration}
                disabled={isLoading}
              >
                {isLoading ? 'Сохранение...' : 'Завершить настройку'}
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const renderAppearanceStep = () => {
    return (
      <div className="welcome-step fade-in">
        <h2>Выберите оформление</h2>
        <p>Настройте внешний вид системы по своему вкусу.</p>

        <div className="welcome-theme-selector">
          <div
            className="theme-option"
            onClick={() => setSelectedTheme('light')}
          >
            <div
              className={`theme-preview light ${
                selectedTheme === 'light' ? 'selected' : ''
              }`}
            ></div>
            <div className="theme-label">
              <span>Светлая тема</span>
            </div>
          </div>

          <div
            className="theme-option"
            onClick={() => setSelectedTheme('dark')}
          >
            <div
              className={`theme-preview dark ${
                selectedTheme === 'dark' ? 'selected' : ''
              }`}
            ></div>
            <div className="theme-label">
              <span>Темная тема</span>
            </div>
          </div>
        </div>

        <h3 className="section-title">Акцентный цвет</h3>
        <div className="welcome-accent-selector">
          {accentColors.map(color => (
            <div
              key={color.id}
              className={`accent-option ${
                selectedAccent === color.id ? 'selected' : ''
              }`}
              style={{ backgroundColor: color.color }}
              onClick={() => setSelectedAccent(color.id)}
            >
              {selectedAccent === color.id && <i className="fas fa-check"></i>}
            </div>
          ))}
        </div>

        <h3 className="section-title">Обои рабочего стола</h3>
        <div className="welcome-wallpaper-selector">
          {Object.entries(WALLPAPERS).map(([id, data]) => (
            <div
              key={id}
              className={`wallpaper-option ${
                selectedWallpaper === id ? 'selected' : ''
              }`}
              onClick={() => setSelectedWallpaper(id)}
            >
              <div className={`wallpaper-preview ${id}`}></div>
              <div className="wallpaper-name">{data.name}</div>
            </div>
          ))}
        </div>

        <div className="welcome-buttons">
          <button
            className="welcome-button secondary"
            onClick={prevStep}
            disabled={isLoading}
          >
            Назад
          </button>
          <button
            className="welcome-button primary"
            onClick={nextStep}
            disabled={isLoading}
          >
            Далее
          </button>
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderWelcomeStep()
      case 2:
        return renderAppearanceStep()
      case 3:
        return renderWorkspaceStep()
      case 4:
        return renderProfileStep()
      default:
        return null
    }
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <div className="welcome-logo">
          <img src="/favicon.svg" alt="HiveOS" />
          <h1>HiveOS</h1>
        </div>

        {mode === 'register' && (
          <div className="welcome-progress">
            <div
              className="welcome-progress-bar"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        )}

        {mode === 'welcome' && renderWelcomeScreen()}
        {mode === 'login' && renderLoginScreen()}
        {mode === 'register' && renderRegistrationSteps()}
      </div>
    </div>
  )
}

export default Welcome
