import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import HexagonBackground from '../components/HexagonBackground'
import Loader from '../components/Loader'
import MemoryExplorer from '../components/MemoryExplorer'
import { useNavigation } from '../context/NavigationContext'
import styles from '../styles/Memory.module.css'

const Folder = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { setNavVisible } = useNavigation()
  const [currentTime, setCurrentTime] = useState('')
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
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    setNavVisible(true)
  }, [navigate, setNavVisible])

  if (!id || isNaN(parseInt(id))) {
    navigate('/memory')
    return null
  }

  if (isLoading) {
    return <Loader text="Загружаем содержимое папки" />
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
          <MemoryExplorer folderId={parseInt(id)} setIsLoading={setIsLoading} />
        </div>
      </div>
    </>
  )
}

export default Folder
