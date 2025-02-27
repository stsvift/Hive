import axios from 'axios'
import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { NavigationProvider } from './context/NavigationContext'
import Router from './router'

function App() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const setupApp = async () => {
      // Setup axios defaults
      const token = localStorage.getItem('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      // Улучшенная обработка ошибок авторизации
      axios.interceptors.response.use(
        response => response,
        error => {
          if (error.response?.status === 401 && window.location.pathname !== '/login') {
            // Проверяем, что токен действительно отсутствует или некорректен
            const token = localStorage.getItem('token')
            if (!token) {
              console.log('No token found, redirecting to login')
              window.location.href = '/login'
            }
          }
          return Promise.reject(error)
        }
      )

      setInitialized(true)
    }

    setupApp()
  }, [])

  if (!initialized) {
    return <div>Loading...</div>
  }

  return (
    <NavigationProvider>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </NavigationProvider>
  )
}

export default App
