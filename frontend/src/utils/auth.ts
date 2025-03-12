// Simple auth utilities for token management

/**
 * Stores authentication token in local storage
 */
export const setAuthToken = (token: string): void => {
  if (!token) return
  localStorage.setItem('token', token)
}

/**
 * Retrieves authentication token from local storage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token')
}

/**
 * Removes authentication token from local storage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem('token')
  localStorage.removeItem('user') // Also remove user data if stored
}

/**
 * Checks if the user is authenticated (has a token)
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken()
  return !!token // Convert to boolean
}

/**
 * Handles logout by removing token and any user data
 */
export const logout = (): void => {
  removeAuthToken()
}

/**
 * Gets headers with authorization token
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
