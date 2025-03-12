'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import type { RootState } from '../../store'
import { AppDispatch } from '../../store'
import { clearError, loginUser } from '../../store/authSlice'
import './AuthPages.css'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [formAnimation, setFormAnimation] = useState(false)
  const [localLoading, setLocalLoading] = useState(false) // Local loading state
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth
  )
  const { theme } = useSelector((state: RootState) => state.theme)

  // Combined loading state for immediate feedback
  const isLoading = localLoading || loading

  useEffect(() => {
    // Clear any previous errors
    dispatch(clearError())

    // Trigger form animation after component mount
    setTimeout(() => {
      setFormAnimation(true)
    }, 100)
  }, [dispatch])

  useEffect(() => {
    // Reset local loading state when Redux state changes
    if (loading === false && localLoading === true) {
      setLocalLoading(false)
    }

    if (isAuthenticated) {
      // Show success animation before navigating
      setShowSuccessAnimation(true)

      // Navigate after animation plays for a bit
      const timer = setTimeout(() => {
        navigate('/desktop')
      }, 2800)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, navigate, loading, localLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Use a sequence of animations instead of immediately showing success
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    // Show loading state and prepare for animation sequence
    setLocalLoading(true)

    // Small delay to show button loading state first
    setTimeout(() => {
      setShowSuccessAnimation(true)
    }, 400)

    // Using the thunk
    dispatch(loginUser({ email, password }))
  }

  return (
    <div className={`os-login-screen ${theme}`}>
      {/* Updated login animation with particle effects */}
      <div
        className={`os-login-success-animation ${
          showSuccessAnimation ? 'active' : ''
        }`}
      >
        <div className="auth-particles">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="auth-particle"></div>
          ))}
        </div>

        {/* Beautiful energy sphere animation replacing spinner */}
        <div className="os-login-success-spinner">
          <div className="energy-sphere"></div>
          <div className="energy-ring energy-ring-1"></div>
          <div className="energy-ring energy-ring-2"></div>
          <div className="energy-ring energy-ring-3"></div>
          <div className="light-stream"></div>
          <div className="light-stream light-stream-2"></div>
          <div className="light-stream light-stream-3"></div>
          <div className="energy-core"></div>
          <div className="light-beam light-beam-1"></div>
          <div className="light-beam light-beam-2"></div>
          <div className="light-beam light-beam-3"></div>
          <div className="light-beam light-beam-4"></div>
          <div className="energy-particles">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="energy-particle"></div>
            ))}
          </div>
        </div>

        <div className="os-login-success-message">
          {isAuthenticated ? 'Успешный вход' : 'Проверка данных...'}
        </div>

        <div className="os-login-success-status">
          {isAuthenticated ? (
            <>
              <div className="status-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <span>Загрузка вашего рабочего пространства</span>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </>
          ) : (
            <>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <span>Подключение к серверу</span>
            </>
          )}
        </div>
      </div>

      <div className="os-login-wallpaper">
        <div className="os-login-overlay"></div>
      </div>

      <div
        className={`os-login-container ${formAnimation ? 'active' : ''} ${
          isLoading ? 'dimmed' : ''
        }`}
      >
        <div className="os-login-user-avatar">
          <i className="fas fa-user"></i>
        </div>

        <h2 className="os-login-title">Вход в систему</h2>

        {error && <div className="os-login-error">{error}</div>}

        <form className="os-login-form" onSubmit={handleSubmit}>
          <div className="os-login-input-group">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              disabled={isLoading}
              className="os-login-input"
            />
          </div>

          <div className="os-login-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Пароль"
              disabled={isLoading}
              className="os-login-input"
            />
            <button
              type="button"
              className="os-login-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <i
                className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
              ></i>
            </button>
          </div>

          <button
            type="submit"
            className="os-login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="os-login-button-loading">
                <i className="fas fa-circle-notch fa-spin"></i>
                <span>Вход...</span>
              </div>
            ) : (
              'Войти'
            )}
          </button>
        </form>

        <div className="os-login-options">
          <Link
            to="/register"
            className="os-login-option"
            tabIndex={isLoading ? -1 : 0}
          >
            Создать аккаунт
          </Link>
          <span className="os-login-option-divider">•</span>
          <Link
            to="/"
            className="os-login-option"
            tabIndex={isLoading ? -1 : 0}
          >
            Вернуться на главную
          </Link>
        </div>
      </div>

      <div className="os-login-power">
        <button className="os-login-power-button" disabled={isLoading}>
          <i className="fas fa-power-off"></i>
        </button>
      </div>
    </div>
  )
}

export default LoginPage
