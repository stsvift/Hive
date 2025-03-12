'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import type { RootState } from '../../store'
import { AppDispatch } from '../../store'
import { clearError, registerUser } from '../../store/authSlice'
import './AuthPages.css'

const RegisterPage = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
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

    // Set local loading immediately for better UX
    setLocalLoading(true)

    if (currentStep === 1) {
      if (!username || !email) {
        setLocalLoading(false)
        dispatch({
          type: 'auth/registerFailure',
          payload: 'Пожалуйста, заполните все поля',
        })
        return
      }

      // Small delay to show transition when moving to next step
      setTimeout(() => {
        setCurrentStep(2)
        dispatch(clearError())
        setLocalLoading(false)
      }, 300)
      return
    }

    // Enhanced animation sequence
    if (!password || !confirmPassword) {
      setLocalLoading(false)
      dispatch({
        type: 'auth/registerFailure',
        payload: 'Пожалуйста, заполните все поля',
      })
      return
    }

    if (password !== confirmPassword) {
      setLocalLoading(false)
      dispatch({
        type: 'auth/registerFailure',
        payload: 'Пароли не совпадают',
      })
      return
    }

    if (password.length < 6) {
      setLocalLoading(false)
      dispatch({
        type: 'auth/registerFailure',
        payload: 'Пароль должен содержать не менее 6 символов',
      })
      return
    }

    // Small delay before showing animation
    setTimeout(() => {
      setShowSuccessAnimation(true)
    }, 300)

    // Use the thunk
    dispatch(registerUser({ username, email, password }))
  }

  const goBack = () => {
    if (isLoading) return // Prevent going back while loading

    if (currentStep === 2) {
      setCurrentStep(1)
      dispatch(clearError())
    } else {
      navigate('/login')
    }
  }

  return (
    <div className={`os-login-screen ${theme}`}>
      {/* Registration Success Animation - Enhanced with particles and stages */}
      <div
        className={`os-login-success-animation ${
          showSuccessAnimation ? 'active' : ''
        } registration`}
      >
        <div className="auth-particles">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="auth-particle"></div>
          ))}
        </div>

        {!isAuthenticated ? (
          <>
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

            <div className="registration-sequence">
              <div className="stage-icon stage-1 active">
                <i className="fas fa-user-plus"></i>
                <span className="checkmark">
                  <i className="fas fa-check"></i>
                </span>
              </div>
              <div className="stage-connector"></div>
              <div className="stage-icon stage-2">
                <i className="fas fa-server"></i>
                <span className="checkmark">
                  <i className="fas fa-check"></i>
                </span>
              </div>
              <div className="stage-connector"></div>
              <div className="stage-icon stage-3">
                <i className="fas fa-shield-alt"></i>
              </div>
            </div>

            <div className="os-login-success-message">
              Создаем ваш аккаунт...
            </div>

            <div className="os-login-success-status">
              <span>Пожалуйста, подождите</span>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="success-checkmark">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
              </div>
            </div>
            <div className="os-login-success-message">
              Аккаунт успешно создан!
            </div>
            <div className="os-login-success-status">
              <div className="status-icon">
                <i className="fas fa-desktop"></i>
              </div>
              <span>Подготовка рабочего пространства</span>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </>
        )}
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
          <i className="fas fa-user-plus"></i>
        </div>

        <h2 className="os-login-title">
          {currentStep === 1 ? 'Создание аккаунта' : 'Установка пароля'}
        </h2>

        <div className="os-login-steps">
          <div
            className={`os-login-step ${currentStep === 1 ? 'active' : ''}`}
          ></div>
          <div
            className={`os-login-step ${currentStep === 2 ? 'active' : ''}`}
          ></div>
        </div>

        {error && <div className="os-login-error">{error}</div>}

        <form className="os-login-form" onSubmit={handleSubmit}>
          {currentStep === 1 ? (
            <>
              <div className="os-login-input-group">
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Имя пользователя"
                  disabled={isLoading}
                  className="os-login-input"
                />
              </div>

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
            </>
          ) : (
            <>
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
                    className={`fas ${
                      showPassword ? 'fa-eye-slash' : 'fa-eye'
                    }`}
                  ></i>
                </button>
              </div>

              <div className="os-login-input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Подтвердите пароль"
                  disabled={isLoading}
                  className="os-login-input"
                />
              </div>
            </>
          )}

          <div className="os-login-buttons">
            <button
              type="button"
              className="os-login-back-button"
              onClick={goBack}
              disabled={isLoading}
            >
              <i className="fas fa-arrow-left"></i> Назад
            </button>
            <button
              type="submit"
              className="os-login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="os-login-button-loading">
                  <i className="fas fa-circle-notch fa-spin"></i>
                  <span>
                    {currentStep === 1 ? 'Проверка...' : 'Создание...'}
                  </span>
                </div>
              ) : currentStep === 1 ? (
                'Далее'
              ) : (
                'Создать аккаунт'
              )}
            </button>
          </div>
        </form>

        <div className="os-login-options">
          <Link
            to="/login"
            className="os-login-option"
            tabIndex={isLoading ? -1 : 0}
          >
            Уже есть аккаунт? Войти
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

export default RegisterPage
