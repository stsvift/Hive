import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import styles from '../styles/Auth.module.css'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isLogin) {
        const response = await login(email, password)
        localStorage.setItem('token', response.token)
        navigate('/dashboard')
      } else {
        await register(name, email, password)
        navigate('/dashboard')
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        setError(error.response.data.message)
      } else if (error.message) {
        setError(error.message)
      } else {
        setError('Произошла ошибка. Попробуйте еще раз.')
      }
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
        <form onSubmit={handleSubmit} className={styles.slideIn}>
          <div className={styles.inputsContainer}>
            {!isLogin && (
              <div className={styles.slideIn}>
                <input
                  type="text"
                  placeholder="Имя"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.slideIn}>
            {isLogin ? 'Вспомнить' : 'Создать'}
          </button>
        </form>
        <div className={styles.switchContainer}>
          <span className={styles.switchText}>
            {isLogin ? 'Первый раз тут?' : 'Уже знакомы?'}
          </span>
          <a className={styles.switchLink} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Создать воспоминания' : 'Войти'}
          </a>
        </div>
      </div>
      {error && <div className={styles.toast}>{error}</div>}
    </div>
  )
}

export default Auth
