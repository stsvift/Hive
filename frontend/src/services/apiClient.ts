import axios from 'axios'

// Создаем экземпляр axios с базовым URL и конфигурацией
export const apiClient = axios.create({
  baseURL: 'http://localhost:5000', // URL вашего бэкенда
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Для передачи cookies (если используется аутентификация)
})

// Перехватчик для добавления токена аутентификации к запросам
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Перехватчик для обработки ошибок авторизации
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Если сервер вернул ошибку 401 (не авторизован), перенаправляем на страницу входа
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
