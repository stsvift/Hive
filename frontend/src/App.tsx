import axios from 'axios'
import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { NavigationProvider } from './context/NavigationContext'
import Router from './router'

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  return (
    <NavigationProvider>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </NavigationProvider>
  )
}

export default App
