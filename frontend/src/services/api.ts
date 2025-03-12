import axios, { AxiosError, AxiosResponse } from 'axios'
import { API_BASE_URL } from '../config/api'
import { getAuthToken } from '../utils/auth'

// Create axios instance with default configs
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  // Add timeout
  timeout: 10000,
})

// Add request interceptor for auth token
api.interceptors.request.use(
  config => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // For task endpoints, ensure we have the right data format
    if (
      config.url?.includes('/tasks') &&
      config.data &&
      (config.method === 'post' || config.method === 'put')
    ) {
      // Make sure priority is a number
      if (config.data.priority && typeof config.data.priority === 'string') {
        if (config.data.priority === 'low') config.data.priority = 1
        else if (config.data.priority === 'high') config.data.priority = 3
        else config.data.priority = 2
      }
    }

    // Special handling for folder-related requests
    if (
      config.url?.includes('/folders') &&
      config.method === 'post' &&
      config.data
    ) {
      // If parentFolderId is present, ensure it's a string
      if (config.data.parentFolderId !== undefined) {
        config.data.parentFolderId = String(config.data.parentFolderId)
      }
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // More robust handling of string responses that might need parsing
    if (typeof response.data === 'string' && response.data.trim() !== '') {
      try {
        // Try to parse the string as JSON, but only if it looks like JSON
        if (
          (response.data.startsWith('{') && response.data.endsWith('}')) ||
          (response.data.startsWith('[') && response.data.endsWith(']'))
        ) {
          response.data = JSON.parse(response.data)
        }
      } catch (e) {
        // Keep the original string data instead of failing
      }
    }

    // Sanitize response data
    const sanitizeResponse = (data: any): any => {
      if (!data) return data

      if (Array.isArray(data)) {
        return data.map(sanitizeResponse)
      }

      if (typeof data === 'object') {
        const cleaned: any = {}

        // Copy common fields
        ;[
          'id',
          'name',
          'title',
          'description',
          'parentFolderId',
          'createdAt',
          'updatedAt',
          'userId',
          'color',
          'notes',
          'items',
          'subFolders',
        ].forEach(key => {
          if (key in data) {
            cleaned[key] = data[key]
          }
        })

        // Special fields for tasks
        ;[
          'priority',
          'status',
          'deadline',
          'isCompleted',
          'assigneeId',
          'folderId', // Keep folderId in response
        ].forEach(key => {
          if (key in data) {
            cleaned[key] = data[key]
          }
        })

        // Ensure tasks have a title - use name or default value
        if ('name' in data && !('title' in data)) {
          cleaned.title = data.name
        } else if (!('title' in cleaned) && !('name' in cleaned)) {
          cleaned.title = 'Без названия'
        }

        return cleaned
      }

      return data
    }

    response.data = sanitizeResponse(response.data)
    return response
  },
  async (error: AxiosError) => {
    if (error.response?.status === 500 && !error.config?._retry) {
      error.config._retry = true
      return api(error.config)
    }

    return Promise.reject(error)
  }
)

export default api
