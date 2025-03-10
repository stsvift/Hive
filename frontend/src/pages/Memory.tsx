import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import HexagonBackground from '../components/HexagonBackground'
import Loader from '../components/Loader'
import MemoryExplorer from '../components/MemoryExplorer'
import { useNavigation } from '../context/NavigationContext'
import styles from '../styles/Memory.module.css'

const Memory = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setNavVisible } = useNavigation()
  const [currentTime, setCurrentTime] = useState('')
  const [folderId, setFolderId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setNavVisible(true)
  }, [setNavVisible])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const pathParts = location.pathname.split('/')
    if (pathParts.length > 2 && pathParts[1] === 'folders') {
      const newFolderId = parseInt(pathParts[2], 10)
      if (!isNaN(newFolderId)) {
        setFolderId(newFolderId)
      }
    } else {
      setFolderId(null)
    }
  }, [location.pathname, navigate])

  if (isLoading) {
    return <Loader text="Загружаем ваши соты" />
  }

  return (
    <>
      <HexagonBackground />
      <div className={styles.memoryContainer}>
        <div className={styles.header}>
          <span className={styles.title}>Hive</span>
          <span className={styles.memoryTitle}>Memory</span>
          <span className={styles.clock}>{currentTime}</span>
        </div>
        <div className={styles.explorerWrapper}>
          <MemoryExplorer folderId={folderId} setIsLoading={setIsLoading} />
        </div>
      </div>
    </>
  )
}

export default Memory
