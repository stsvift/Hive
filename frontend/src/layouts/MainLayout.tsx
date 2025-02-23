import { useLocation } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { NavigationProvider } from '../context/NavigationContext'
import styles from '../styles/MainLayout.module.css'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation()
  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register'

  return (
    <NavigationProvider>
      <div className={styles.layout}>
        {!isAuthPage && <Navigation />}
        <main className={styles.main}>{children}</main>
      </div>
    </NavigationProvider>
  )
}

export default MainLayout
