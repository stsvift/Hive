import { ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { RootState } from '../../store'
import { getAuthToken } from '../../utils/auth'

interface Props {
  children: ReactNode
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth
  )
  const location = useLocation()

  // Double-check token exists directly in localStorage as a fallback
  const hasToken = !!getAuthToken()

  // Show loading while checking auth status
  if (loading) {
    return <div className="loading">Loading...</div>
  }

  // If not authenticated and no token in localStorage, redirect to login
  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If we have authentication, render the protected content
  return <>{children}</>
}

export default ProtectedRoute
