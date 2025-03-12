// Authentication utilities

/**
 * Get the authentication token from local storage
 */
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('token')
  } catch (error) {
    console.error('Failed to get auth token from localStorage:', error)
    return null
  }
}

/**
 * Check if the user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken()
  return !!token
}
