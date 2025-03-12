import axios from 'axios'
import { API_BASE_URL, API_ENDPOINTS } from '../config/api'
import { getAuthToken } from '../utils/auth'

export interface AuthResponse {
  username: string
  email: string
  token: string
}

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { data } = await authApi.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    })

    if (data.token) {
      localStorage.setItem('token', data.token)
    }

    return data
  } catch (error) {
    console.error('Login error:', error)
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Ошибка входа')
    }
    throw error
  }
}

export const register = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { data } = await authApi.post(API_ENDPOINTS.AUTH.REGISTER, {
      username,
      email,
      password,
    })

    if (data.token) {
      localStorage.setItem('token', data.token)
    }

    return data
  } catch (error) {
    console.error('Register error:', error)
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Ошибка регистрации')
    }
    throw error
  }
}

export const getCurrentUser = async (): Promise<any> => {
  try {
    const token = getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const { data } = await axios.get(API_ENDPOINTS.AUTH.ME, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return data
  } catch (error) {
    console.error('Failed to get current user:', error)
    throw error
  }
}

export const checkAuth = async (): Promise<AuthResponse | null> => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null

    const { data } = await authApi.get(API_ENDPOINTS.AUTH.ME, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return data
  } catch (error) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return null
  }
}

export const logout = (): void => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
