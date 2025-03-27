import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { getCurrentTheme } from './utils/settingsManager'

// Apply theme to document immediately on page load, before React renders
document.documentElement.classList.toggle('dark', getCurrentTheme() === 'dark')

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
