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

// Helper function to parse JWT token
const parseToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error parsing token', error)
    return null
  }
}

// Improved validateUserExists function to handle newly registered users better
// Define this before isAuthenticated to avoid reference issues
export const validateUserExists = async (): Promise<boolean> => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  if (!token) {
    throw { message: 'No authentication token found', status: 401 }
  }

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173/api'

    // For freshly registered users, first try to get user info from API
    try {
      const profileResponse = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (profileResponse.ok) {
        console.log(
          'User validation succeeded: account exists and token is valid'
        )
        return true
      }
    } catch (profileError) {
      console.warn(
        'Error checking user profile, trying validate endpoint',
        profileError
      )
    }

    // Make a lightweight request to verify the user exists
    const response = await fetch(`${API_URL}/users/validate`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // If response is not ok, the user likely doesn't exist anymore
    if (!response.ok) {
      if (response.status === 404) {
        console.warn('User account not found on server')
        throw { message: 'User account not found', status: 404 }
      }

      if (response.status === 401 || response.status === 403) {
        console.warn('Authentication token invalid or expired')
        throw { message: 'Authentication failed', status: 401 }
      }

      // For other errors, log but don't invalidate the token yet
      // This handles temporary server issues
      console.warn(`Server returned ${response.status} status code`)
      return true // Still return true to prevent logout on temporary issues
    }

    return true
  } catch (error) {
    console.error('Error validating user existence:', error)
    // Only throw if we're certain the error is due to the user not existing
    if (error.status === 404 || error.status === 401) {
      throw error
    }
    // For network errors etc., don't invalidate the token
    return true
  }
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

    // Modified block: Handle registration success even without token
    if (!responseData.token) {
      console.log(
        'No token in registration response - proceeding with auto-login'
      )

      // Some APIs require a separate login after registration
      try {
        // Attempt auto-login with the registration credentials
        const loginResponse = await login({
          email: userData.email,
          password: userData.password,
        })

        console.log('Auto-login after registration successful')
        return loginResponse // Return the login response which includes token
      } catch (loginError) {
        console.error('Auto-login after registration failed:', loginError)
        // Create a minimal response without token - the UI will handle login redirect
        return {
          token: '', // Empty token signals registration worked but requires separate login
          user: {
            id: 'pending',
            name: userData.name,
            email: userData.email,
          },
        }
      }
    }

    // Normal flow when token is present in registration response
    console.log('Registration successful with token')
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, responseData.token)
    console.log('Authentication token stored after registration')

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
    } else {
      // If user data is missing from response but we have a token, create minimal user object
      responseData.user = {
        id: 'pending', // Will be replaced by proper ID after token validation
        name: userData.name,
        email: userData.email,
      }

      // Try to extract user info from token
      try {
        const tokenData = parseToken(responseData.token)
        if (tokenData && tokenData.sub) {
          responseData.user.id = tokenData.sub
        }
      } catch (error) {
        console.warn('Could not extract user data from token', error)
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

    // Использование правильного эндпоинта для обновления профиля
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const response = await fetch(`${apiUrl}/user/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: preferences.name,
        // Дополнительные поля из preferences здесь
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Error ${response.status}`)
    }

    return await response.json()
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
        if (Date.now() >= expirationTime) {
          console.warn('Token expired')
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
          return false
        }
      }

      // Safety check - do we have validateUserExists function?
      if (typeof validateUserExists === 'function') {
        // Verify user still exists
        validateUserExists().catch(error => {
          console.error('User validation failed:', error)
          // If validation explicitly fails with 404 or unauthorized, clear the token
          if (error.status === 404 || error.status === 401) {
            console.warn(
              'User account no longer exists or is invalid, removing token'
            )
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
            // Reload the app to force login
            window.location.reload()
          }
        })
      } else {
        console.warn(
          'validateUserExists function not available - skipping validation'
        )
      }

      return true
    } catch (error) {
      console.error('Error parsing token:', error)
      return false
    }
  } catch (error) {
    console.error('Error in isAuthenticated:', error)
    return false
  }
}

// Change user password - Fix the request format
export const changePassword = async (data: {
  currentPassword: string
  newPassword: string
}) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)

  if (!token) {
    throw new Error('Не авторизован')
  }

  try {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Ошибка ${response.status}: Не удалось изменить пароль`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Password change error:', error)
    throw error
  }
}

// Add this new function at the end of the file
/**
 * Safe initialization function for auth service that can be called early in the app lifecycle
 * without causing reference errors
 */
export const initAuthService = () => {
  // Return helper functions that safely handle validation
  return {
    checkAuth: () => {
      try {
        return isAuthenticated()
      } catch (error) {
        console.error('Auth initialization error:', error)
        return false
      }
    },
    validateSession: async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        if (!token) {
          return false
        }

        // Basic token validity check without calling validateUserExists
        const tokenParts = token.split('.')
        if (tokenParts.length !== 3) {
          console.warn('Invalid token format')
          return false
        }

        try {
          const base64Url = token.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const payload = JSON.parse(window.atob(base64))

          if (payload.exp && Date.now() >= payload.exp * 1000) {
            console.warn('Token expired')
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
            return false
          }

          return true
        } catch (error) {
          console.error('Error parsing token:', error)
          return false
        }
      } catch (error) {
        console.error('Session validation error:', error)
        return false
      }
    },
  }
}
