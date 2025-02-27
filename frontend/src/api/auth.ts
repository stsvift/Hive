import axios from 'axios'

const API_URL = 'http://localhost:5000/api/auth'

export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password })
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      // Set authorization header for all future requests
      axios.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${response.data.token}`
      return response.data
    } else {
      throw new Error('Token not received from server')
    }
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error('Неверный email или пароль')
  }
}

export const register = async (
  username: string,
  email: string,
  password: string
) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      username,
      email,
      password,
    })
    return response.data
  } catch (error: any) {
    console.error('Register error:', error.response || error)
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error('Ошибка при регистрации')
  }
}

export const logout = () => {
  localStorage.removeItem('token')
  // Clear authorization header
  delete axios.defaults.headers.common['Authorization']
  window.location.href = '/login'
}

export const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return false
    }

    const response = await axios.get('http://localhost:5000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.status === 200
  } catch (error) {
    console.error('Auth check error:', error)
    return false
  }
}
