import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Memory from './pages/Memory'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import Noti from './pages/Noti'

interface PrivateRouteProps {
  children: React.ReactNode
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" />
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
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
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
