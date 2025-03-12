import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { userApi } from '../../../api/userApi'
import type { RootState } from '../../../store'
import { setTheme, setWallpaper } from '../../../store/themeSlice'
import { UserProfile } from '../../../types'
import './Settings.css'

const Settings = () => {
  const dispatch = useDispatch()
  const { theme, wallpaper } = useSelector((state: RootState) => state.theme)
  const [activeSection, setActiveSection] = useState('appearance')

  // Define menuItems with better descriptions and consistent icons
  const menuItems = [
    {
      id: 'appearance',
      icon: '🎨',
      title: 'Внешний вид',
      subtitle: 'Персонализируйте тему и фон рабочего стола',
    },
    {
      id: 'profile',
      icon: '👤',
      title: 'Профиль',
      subtitle: 'Управление вашими личными данными',
    },
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Уведомления',
      subtitle: 'Настройки оповещений и звуков',
    },
    {
      id: 'about',
      icon: 'ℹ️',
      title: 'О системе',
      subtitle: 'Информация о версии и разработчиках',
    },
  ]

  // Updated themes with consistent descriptions and icons
  const themes = [
    {
      id: 'light',
      name: 'Светлая',
      icon: '☀️',
      description: 'Светлый интерфейс для работы днём',
    },
    {
      id: 'dark',
      name: 'Темная',
      icon: '🌙',
      description: 'Тёмный режим для комфортной работы вечером',
    },
    {
      id: 'blue',
      name: 'Синяя',
      icon: '🌊',
      description: 'Глубокие синие тона для концентрации',
    },
  ]

  // Wallpapers with relative paths that respect the file system
  const wallpapers = [
    { id: 'default', name: 'По умолчанию', url: '/wallpapers/default.jpg' },
    { id: 'mountains', name: 'Горы', url: '/wallpapers/mountains.jpg' },
    { id: 'ocean', name: 'Океан', url: '/wallpapers/ocean.jpg' },
    { id: 'forest', name: 'Лес', url: '/wallpapers/forest.jpg' },
    { id: 'city', name: 'Город', url: '/wallpapers/city.jpg' },
  ]

  // User profile state
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    avatarUrl: '/default-avatar.png',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch user profile data
  useEffect(() => {
    if (activeSection === 'profile') {
      fetchUserProfile()
    }
  }, [activeSection])

  const fetchUserProfile = async () => {
    setIsLoading(true)
    setError('')

    try {
      const profileData = await userApi.getProfile()
      setProfile(profileData)
    } catch (err: any) {
      setError(
        `Не удалось загрузить профиль: ${err.message || 'Неизвестная ошибка'}`
      )
      console.error('Error fetching profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await userApi.updateProfile({
        name: profile.name,
        email: profile.email,
      })

      setSuccess('Профиль успешно обновлен')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(`Ошибка при обновлении профиля: ${err.message}`)
      console.error('Error updating profile:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    setIsSaving(true)
    setError('')

    try {
      const avatarUrl = await userApi.uploadAvatar(file)
      setProfile(prev => ({
        ...prev,
        avatarUrl,
      }))

      setSuccess('Аватар успешно обновлен')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(`Ошибка загрузки аватара: ${err.message}`)
      console.error('Error uploading avatar:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleThemeChange = (themeId: string) => {
    dispatch(setTheme(themeId))
    setSuccess(
      `Тема "${themes.find(t => t.id === themeId)?.name}" успешно применена`
    )
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleWallpaperChange = (wallpaperId: string) => {
    dispatch(setWallpaper(wallpaperId))
    setSuccess(
      `Обои "${
        wallpapers.find(w => w.id === wallpaperId)?.name
      }" успешно применены`
    )
    setTimeout(() => setSuccess(''), 3000)
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <>
            {success && <div className="settings-success">{success}</div>}
            <div className="settings-section">
              <h2 className="settings-section-title">
                <span
                  className="settings-section-icon"
                  role="img"
                  aria-label="theme"
                >
                  🎨
                </span>
                Тема оформления
              </h2>
              <div className="settings-themes">
                {themes.map(themeOption => (
                  <div
                    key={themeOption.id}
                    className={`settings-theme-item ${
                      theme === themeOption.id
                        ? 'settings-theme-item-active'
                        : ''
                    }`}
                    onClick={() => handleThemeChange(themeOption.id)}
                    title={themeOption.description}
                  >
                    <div
                      className={`settings-theme-preview settings-theme-preview-${themeOption.id}`}
                    />
                    <div className="settings-theme-name">
                      <span className="theme-icon">{themeOption.icon}</span>{' '}
                      {themeOption.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )

      case 'profile':
        return (
          <div className="settings-profile">
            {isLoading ? (
              <div className="settings-loading">
                <div className="settings-loading-spinner"></div>
                <span>Загрузка профиля...</span>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="settings-section">
                {error && <div className="settings-error">{error}</div>}
                {success && <div className="settings-success">{success}</div>}

                <div className="settings-profile-header">
                  <div className="settings-avatar-container">
                    <img
                      src={profile.avatarUrl}
                      alt="Фото профиля"
                      className="settings-profile-avatar"
                    />
                    <div
                      className="settings-avatar-overlay"
                      onClick={handleAvatarClick}
                    >
                      <span className="settings-avatar-icon">📷</span>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="settings-avatar-input"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div className="settings-profile-name">
                    {profile.name || 'Ваше имя'}
                  </div>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label" htmlFor="name">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="settings-input"
                    placeholder="Введите ваше имя"
                    value={profile.name || ''}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="settings-form-group">
                  <label className="settings-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="settings-input"
                    placeholder="example@mail.com"
                    value={profile.email || ''}
                    onChange={handleProfileChange}
                  />
                </div>
                <button
                  type="submit"
                  className="settings-button"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="loading-spinner"></span>
                      Сохранение...
                    </>
                  ) : (
                    'Сохранить изменения'
                  )}
                </button>
              </form>
            )}
          </div>
        )

      case 'notifications':
        return (
          <div className="settings-section">
            <h2 className="settings-section-title">
              <span
                className="settings-section-icon"
                role="img"
                aria-label="notifications"
              >
                🔔
              </span>
              Настройки уведомлений
            </h2>
            <div className="settings-form-group">
              <div className="notification-option">
                <div>
                  <h3>Системные уведомления</h3>
                  <p>
                    Получать оповещения о системных событиях и обновлениях
                    приложения
                  </p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div className="settings-form-group">
              <div className="notification-option">
                <div>
                  <h3>Уведомления о задачах</h3>
                  <p>
                    Напоминания о предстоящих сроках и изменениях статуса задач
                  </p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div className="settings-form-group">
              <div className="notification-option">
                <div>
                  <h3>Звуковые эффекты</h3>
                  <p>Воспроизводить звуки при получении уведомлений</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            <div className="settings-form-group">
              <div className="notification-option">
                <div>
                  <h3>Фоновые уведомления</h3>
                  <p>Показывать уведомления, даже когда приложение неактивно</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            <p className="settings-note">
              <i>
                Больше настроек уведомлений будет доступно в следующих
                обновлениях. Следите за обновлениями системы.
              </i>
            </p>
          </div>
        )

      case 'about':
        return (
          <div className="settings-about-container">
            <div className="settings-about-logo">HIVE</div>
            <p className="settings-about-description">
              Hive — современная система для управления задачами и повышения
              продуктивности. Создана для тех, кто ценит элегантность,
              функциональность и эффективность в своей работе.
            </p>

            <div className="settings-about-card">
              <div className="settings-about-card-content">
                <div className="settings-about-info-grid">
                  <div className="settings-about-info-item">
                    <h3>
                      <span role="img" aria-label="developers">
                        👨‍💻
                      </span>{' '}
                      Разработчики
                    </h3>
                    <div className="settings-about-info-content">
                      <div className="settings-about-info-detail">
                        <div className="settings-about-info-label">Команда</div>
                        <div className="settings-about-info-value">
                          sviftcommunity
                        </div>
                      </div>
                      <div className="settings-about-info-detail">
                        <div className="settings-about-info-label">
                          Поддержка
                        </div>
                        <div className="settings-about-info-value">
                          support@hive.com
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="settings-about-info-item">
                    <h3>
                      <span role="img" aria-label="release">
                        📋
                      </span>{' '}
                      Информация о релизе
                    </h3>
                    <div className="settings-about-info-content">
                      <div className="settings-about-info-detail">
                        <div className="settings-about-info-label">Версия</div>
                        <div className="settings-about-info-value">1.0.0</div>
                      </div>
                      <div className="settings-about-info-detail">
                        <div className="settings-about-info-label">
                          Год выпуска
                        </div>
                        <div className="settings-about-info-value">2025</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="settings-about-footer">
              © 2025 Hive. Все права защищены.
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="settings">
      <div className="settings-sidebar">
        {menuItems.map(item => (
          <div
            key={item.id}
            className={`settings-nav-item ${
              activeSection === item.id ? 'active' : ''
            }`}
            onClick={() => setActiveSection(item.id)}
          >
            <span className="settings-nav-icon">{item.icon}</span>
            <span className="settings-nav-text">{item.title}</span>
          </div>
        ))}
      </div>

      <div className="settings-content">
        <div className="settings-header">
          <h1 className="settings-title">
            {menuItems.find(item => item.id === activeSection)?.title}
          </h1>
          <p className="settings-subtitle">
            {menuItems.find(item => item.id === activeSection)?.subtitle}
          </p>
        </div>
        {renderContent()}
      </div>
    </div>
  )
}

export default Settings
