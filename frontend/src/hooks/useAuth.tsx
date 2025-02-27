import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')

      if (!token) {
        setIsAuthenticated(false)
        return
      }

      // Set default headers for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Verify token with a backend request
      try {
        const response = await axios.get('http://localhost:5000/api/users/me')
        if (response.status === 200) {
          setIsAuthenticated(true)
          setUser(response.data)
        } else {
          setIsAuthenticated(false)
          localStorage.removeItem('token')
        }
      } catch (error) {
        console.error('Token validation error:', error)
        setIsAuthenticated(false)
        localStorage.removeItem('token')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return { isAuthenticated, isLoading, user, checkAuth }
}
