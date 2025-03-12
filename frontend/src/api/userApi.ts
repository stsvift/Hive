import { UserProfile } from '../types'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Helper function for API requests with authentication
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error (${response.status}): ${errorText}`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return await response.json()
  }

  return await response.text()
}

// User API endpoints
export const userApi = {
  // Get the current user's profile
  getProfile: async (): Promise<UserProfile> => {
    try {
      const data = await fetchWithAuth('/users/profile')
      return {
        name: data.name || 'Demo User',
        email: data.email || '',
        avatarUrl: data.avatarUrl || '/default-avatar.png',
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Return demo data if there's an error
      return {
        name: 'Demo User',
        email: 'demo@example.com',
        avatarUrl: '/default-avatar.png',
      }
    }
  },

  // Update the user's profile
  updateProfile: async (
    profile: Partial<UserProfile>
  ): Promise<UserProfile> => {
    const data = await fetchWithAuth('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: profile.name,
        email: profile.email,
      }),
    })

    return {
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl,
    }
  },

  // Upload a new avatar
  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to upload avatar: ${errorText}`)
    }

    const data = await response.json()
    return data.avatarUrl
  },
}
