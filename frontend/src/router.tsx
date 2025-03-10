import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Loader from './components/Loader'
import { useAuth } from './hooks/useAuth'
import MainLayout from './layouts/MainLayout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Folder from './pages/Folder'
import Memory from './pages/Memory'
import Note from './pages/Note'
import NotFound from './pages/NotFound'
import Noti from './pages/Noti'
import Profile from './pages/Profile'
import Task from './pages/Task'

interface PrivateRouteProps {
  children: React.ReactNode
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <Loader text="Проверяем систему" />
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <Loader text="Подождите" />
  }

  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>
}

const Router = () => {
  return (
    <Routes>
      <Route path="*" element={<NotFound />} />
      <Route
        element={
          <MainLayout>
            <Outlet />
          </MainLayout>
        }
      >
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/memory"
          element={
            <PrivateRoute>
              <Memory />
            </PrivateRoute>
          }
        />
        <Route
          path="/folders/:id"
          element={
            <PrivateRoute>
              <Folder />
            </PrivateRoute>
          }
        />
        <Route
          path="/notes/:id"
          element={
            <PrivateRoute>
              <Note />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks/:id"
          element={
            <PrivateRoute>
              <Task />
            </PrivateRoute>
          }
        />
        <Route
          path="/notification"
          element={
            <PrivateRoute>
              <Noti />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default Router
