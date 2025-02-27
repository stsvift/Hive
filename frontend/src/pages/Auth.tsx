import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import Spinner from '../components/Spinner'
import styles from '../styles/Auth.module.css'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check which route we're on and set form mode accordingly
    setIsLogin(location.pathname === '/login')
  }, [location.pathname])

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setError('')
  }

  const toggleForm = () => {
    resetForm()
    setIsLogin(!isLogin)
    navigate(isLogin ? '/register' : '/login')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      if (isLogin) {
        const response = await login(email, password)
        localStorage.setItem('token', response.token)
        navigate('/dashboard')
      } else {
        await register(name, email, password)
        // Login after successful registration
        const loginResponse = await login(email, password)
        localStorage.setItem('token', loginResponse.token)
        navigate('/dashboard')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Ошибка аутентификации')
      } else if (error.message) {
        setError(error.message)
      } else {
        setError('Произошла ошибка. Попробуйте еще раз.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <h1 className={styles.title}>Hive</h1>
      <div
        className={`${styles.authForm} ${
          isLogin ? styles.loginMode : styles.registerMode
        }`}
      >
        <h2 className={styles.slideIn}>
          {isLogin
            ? 'Войдите в свои воспоминания'
            : 'Создайте свои воспоминания'}
        </h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.slideIn}>
          <div className={styles.inputsContainer}>
            {!isLogin && (
              <input
                type="text"
                placeholder="Имя"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.slideIn} disabled={isLoading}>
            {isLoading ? (
              <>
                {isLogin ? 'Вспоминаем' : 'Создаем'}
                <Spinner />
              </>
            ) : isLogin ? (
              'Вспомнить'
            ) : (
              'Создать'
            )}
          </button>
          <div className={styles.switchContainer}>
            <span className={styles.switchText}>
              {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            </span>
            <a
              href="#"
              className={styles.switchLink}
              onClick={e => {
                e.preventDefault()
                toggleForm()
              }}
            >
              {isLogin ? 'Создать аккаунт' : 'Войти'}
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Auth
