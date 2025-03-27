import React, { useEffect, useState } from 'react'
import Header from '../components/Header/Header'
import Sidebar from '../components/Sidebar/Sidebar'
import './MainLayout.css'

interface MainLayoutProps {
  children: React.ReactNode
  theme: 'light' | 'dark'
  onThemeToggle: () => void
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  theme,
  onThemeToggle,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Add useEffect to set viewport meta tag
  useEffect(() => {
    // Ensure the viewport is properly set for mobile devices
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    if (viewportMeta) {
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      )
    }

    return () => {
      // Reset viewport when component unmounts
      if (viewportMeta) {
        viewportMeta.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0'
        )
      }
    }
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className={`main-layout ${sidebarOpen ? 'sidebar-visible' : ''}`}>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="main-content">
        <Header
          onMenuClick={toggleSidebar}
          onThemeToggle={onThemeToggle}
          theme={theme}
        />

        <main className="content-area">{children}</main>
      </div>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}
    </div>
  )
}

export default MainLayout
