'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import LandingPage from './components/Auth/LandingPage'
import LoginPage from './components/Auth/LoginPage'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import RegisterPage from './components/Auth/RegisterPage'
import Desktop from './components/Desktop/Desktop'
import Dock from './components/Dock/Dock'
import TopBar from './components/TopBar/TopBar'
import WindowManager from './components/WindowManager/WindowManager'
import type { RootState } from './store'
import { checkAuthStatus } from './store/slices/authSlice'
import ErrorBoundary from './utils/ErrorBoundary'

function App() {
  const dispatch = useDispatch()
  const { theme, wallpaper } = useSelector((state: RootState) => state.theme)
  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth
  )
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    // ...existing code for wallpaper...
  }, [theme, wallpaper])

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await dispatch(checkAuthStatus() as any)
      } finally {
        setAuthChecked(true)
      }
    }

    verifyAuth()
  }, [dispatch])

  // Show loading state only if we haven't checked auth status yet
  if (loading && !authChecked) {
    return <div className="loading">Loading...</div>
  }

  return (
    <ErrorBoundary>
      <div className="os-container">
        {isAuthenticated && <TopBar />}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/desktop"
            element={
              <ProtectedRoute>
                <>
                  <Desktop />
                  <WindowManager />
                  <Dock />
                </>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App
