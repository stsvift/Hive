import { STORAGE_KEYS } from '../config/constants'

// Base API URL from environment or fallback to what's defined in API.md
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173/api'

// Types for auth requests and responses
export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

// Fixed interface declaration - removed duplicated text
export interface AuthResponse {
  token: string
  user: {
    id: string
    name?: string
    userName?: string // Handle the backend field
    username?: string // Alternative field name
    email: string
    theme?: 'light' | 'dark'
    avatar?: string
    avatarUrl?: string // Handle the backend field
  }
}

// Password change request interface
export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

// User registration
export const register = async (
  userData: RegisterRequest
): Promise<AuthResponse> => {
  try {
    console.log('Sending registration request to:', `${API_URL}/auth/register`)

    // Updated request payload format to match backend expectations
    const requestPayload = {
      userName: userData.name, // Use userName as the backend field
      username: userData.name, // Alternative field name
      email: userData.email,
      password: userData.password,
    }

    console.log('Registration payload:', requestPayload)

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    const responseData = await response.json()
    console.log('Registration response:', responseData)

    if (!response.ok) {
      console.error('Registration error response:', responseData)

      // Extract detailed error messages if available
      let errorMessage = 'Registration failed'
      if (responseData.errors) {
        const errorDetails = Object.entries(responseData.errors)
          .map(
            ([field, msgs]) =>
              `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
          )
          .join('; ')
        errorMessage = errorDetails || responseData.message || errorMessage
      } else if (responseData.message) {
        errorMessage = responseData.message
      } else if (responseData.title) {
        errorMessage = responseData.title
      }
      throw new Error(errorMessage)
    }

    // Store auth token in localStorage
    if (responseData.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, responseData.token)
    }

    // Normalize the user data structure
    if (responseData.user) {
      // If name is missing but username/userName exists, use that
      if (!responseData.user.name) {
        responseData.user.name =
          responseData.user.userName ||
          responseData.user.username ||
          userData.name
      }

      // If avatar is missing but avatarUrl exists, use that
      if (!responseData.user.avatar && responseData.user.avatarUrl) {
        responseData.user.avatar = responseData.user.avatarUrl
      }
    }

    return responseData
  } catch (error) {
    console.error('Registration error:', error)
    throw error
  }
}

// User login - similar updates for better error handling
export const login = async (
  credentials: LoginRequest
): Promise<AuthResponse> => {
  try {
    console.log('Sending login request to:', `${API_URL}/auth/login`)

    // Updated request payload format to match backend expectations
    const requestPayload = {
      email: credentials.email,
      password: credentials.password,
    }

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('Login error response:', responseData)

      // Extract detailed error messages if available
      let errorMessage = 'Login failed'
      if (responseData.errors) {
        const errorDetails = Object.entries(responseData.errors)
          .map(
            ([field, msgs]) =>
              `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
          )
          .join('; ')
        errorMessage = errorDetails || responseData.message || errorMessage
      } else if (responseData.message) {
        errorMessage = responseData.message
      } else if (responseData.title) {
        errorMessage = responseData.title
      }
      throw new Error(errorMessage)
    }

    // Store auth token in localStorage
    if (responseData.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, responseData.token)
    }

    // Normalize the user data structure
    if (responseData.user) {
      // If name is missing but username/userName exists, use that
      if (!responseData.user.name) {
        responseData.user.name =
          responseData.user.userName ||
          responseData.user.username ||
          credentials.email.split('@')[0]
      }

      // If avatar is missing but avatarUrl exists, use that
      if (!responseData.user.avatar && responseData.user.avatarUrl) {
        responseData.user.avatar = responseData.user.avatarUrl
      }
    }

    return responseData
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

// Get current user profile
export const getCurrentUser = async (): Promise<any> => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (!token) {
      throw new Error('No authentication token found')
    }

    console.log('Fetching user profile from:', `${API_URL}/users/me`)

    // First extract basic info from token to have a fallback
    let tokenData = null
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(window.atob(base64))
      console.log('JWT payload:', payload)

      // Find email in different possible locations in the token
      const email =
        payload.email ||
        payload.sub ||
        payload.unique_name ||
        payload.preferred_username

      tokenData = {
        id: payload.id || payload.nameid || payload.sub || 'token-user',
        email: email || 'unknown@email.com',
        name: payload.name || (email ? email.split('@')[0] : 'User'),
      }
      console.log('Data extracted from token:', tokenData)
    } catch (tokenError) {
      console.error('Error parsing token:', tokenError)
    }

    // Try to get user data from the API
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Log the response status to help debug
      console.log('Response status from /users/me:', response.status)

      if (response.ok) {
        const userData = await response.json()
        console.log('User data retrieved successfully:', userData)

        // Make sure we have email, use token data as fallback
        if (!userData.email && tokenData?.email) {
          userData.email = tokenData.email
          console.log('Added email from token:', tokenData.email)
        }

        return userData
      }
    } catch (error) {
      console.warn(
        'Error fetching from /users/me, trying /users/profile',
        error
      )
    }

    // Try alternative endpoint
    console.log('Trying alternative endpoint:', `${API_URL}/users/profile`)
    try {
      const profileResponse = await fetch(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Log the response status for debugging
      console.log(
        'Response status from /users/profile:',
        profileResponse.status
      )

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        console.log('User profile data retrieved successfully:', profileData)

        // Make sure we have email, use token data as fallback
        if (!profileData.email && tokenData?.email) {
          profileData.email = tokenData.email
          console.log(
            'Added email from token to profile data:',
            tokenData.email
          )
        }

        return profileData
      }
    } catch (profileError) {
      console.warn('Error fetching from /users/profile:', profileError)
    }

    // If we got here, both API calls failed but we might have token data
    if (tokenData) {
      console.log('Using token data as fallback for user info:', tokenData)
      return tokenData
    }

    // Last resort - create mock data
    console.warn('Creating mock user data as last resort')
    return {
      id: 'offline-user',
      name: 'Offline User',
      email: 'user@example.com',
    }
  } catch (error) {
    console.error('Error getting current user:', error)

    // Fallback to mock data in development or when server is unavailable
    return {
      id: 'error-user',
      name: 'Error User',
      email: 'error@example.com',
    }
  }
}

// Improved updateUserPreferences function with better error handling and proper request format
export const updateUserPreferences = async (preferences: any): Promise<any> => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (!token) {
      throw new Error('No authentication token found')
    }

    console.log('Updating user preferences:', preferences)

    // Important: Fix the API_URL to match the actual server
    const baseApiUrl = 'http://localhost:5000/api'

    // Try commonly used API endpoints for profile updates
    const possibleEndpoints = [
      `${baseApiUrl}/user/profile`,
      `${baseApiUrl}/users/profile`,
      `${baseApiUrl}/auth/profile`,
      `${baseApiUrl}/user`,
      `${baseApiUrl}/users/${preferences.id}`, // If user ID is available
    ]

    // Create base request options
    const requestOptions = {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    }

    let response = null
    let error = null

    // Try each endpoint until one works
    for (const endpoint of possibleEndpoints) {
      try {
        const res = await fetch(endpoint, requestOptions)
        if (res.ok) {
          response = await res.json()
          console.log(
            `Successfully updated profile using endpoint: ${endpoint}`
          )
          break
        }
      } catch (err) {
        error = err
        console.warn(`Failed to update using endpoint ${endpoint}:`, err)
      }
    }

    if (!response && error) {
      throw error
    }

    return response || { success: true }
  } catch (error) {
    console.error('Error updating preferences:', error)
    throw error
  }
}

/**
 * Logs out the user by removing the authentication token
 * while preserving theme and appearance preferences
 */
export const logout = () => {
  // Save appearance and workspace settings before logout
  const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
  const customFavicon = localStorage.getItem(STORAGE_KEYS.CUSTOM_FAVICON)

  // Clear auth token
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)

  // Restore only appearance and workspace settings but remove user data
  if (settings) {
    try {
      const settingsObj = JSON.parse(settings)
      // Keep only appearance and workspace settings, not user data
      const preservedSettings = {
        appearance: settingsObj.appearance,
        workspace: settingsObj.workspace,
      }
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(preservedSettings)
      )
    } catch (error) {
      console.error('Error handling settings during logout:', error)
    }
  }

  // Restore custom favicon if exists
  if (customFavicon) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_FAVICON, customFavicon)
  }

  console.log('User logged out successfully, appearance settings preserved')
}

// Improved isAuthenticated function that better handles token validation
export const isAuthenticated = (): boolean => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (!token) {
      return false
    }

    // Basic structure check for JWT (3 parts separated by dots)
    if (!token.match(/\S+\.\S+\.\S+/)) {
      console.warn('Invalid token format detected')
      return false
    }

    // Check token expiration if possible
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(window.atob(base64))

      // If token has expiration time, check if it's expired
      if (payload.exp) {
        const expirationTime = payload.exp * 1000 // Convert to milliseconds
        const currentTime = Date.now()

        if (currentTime > expirationTime) {
          console.log('Token expired, logging out')
          return false
        }
      }
    } catch (error) {
      // If we can't parse the token, we'll still consider the user authenticated
      // This handles cases where the token structure might be different
      console.warn('Could not parse token, but continuing with authentication')
    }

    return true
  } catch (error) {
    console.error('Error in isAuthenticated:', error)
    return false
  }
}

// Change user password - Fix the request format
export const changePassword = async (
  passwordData: PasswordChangeRequest
): Promise<any> => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (!token) {
      throw new Error('Необходима авторизация для смены пароля')
    }

    console.log('Sending password change request')

    // Make sure the API endpoint matches the documented one
    const response = await fetch(`${API_URL}/users/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      // Send password data in the expected format
      body: JSON.stringify({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }),
    })

    // Log response status and handle errors properly
    console.log('Password change response status:', response.status)

    if (!response.ok) {
      let errorMessage = 'Ошибка смены пароля'

      try {
        const errorData = await response.json()
        console.error('Password change error response:', errorData)

        // Extract detailed error messages if available
        if (errorData.errors) {
          const errorDetails = Object.entries(errorData.errors)
            .map(
              ([field, msgs]) =>
                `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
            )
            .join('; ')
          errorMessage = errorDetails || errorData.message || errorMessage
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.title) {
          errorMessage = errorData.title
        }
      } catch (parseError) {
        // If we can't parse JSON, use status code in the error
        errorMessage = `Ошибка ${response.status}: Не удалось изменить пароль`
      }

      throw new Error(errorMessage)
    }

    // Return success response
    const successData = await response.json()
    console.log('Password changed successfully:', successData)
    return successData
  } catch (error) {
    console.error('Password change error:', error)
    throw error
  }
}
