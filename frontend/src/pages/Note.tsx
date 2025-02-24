import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { memoryService } from '../api/memory'
import HexagonBackground from '../components/HexagonBackground'
import Loader from '../components/Loader'
import styles from '../styles/Memory.module.css'
import { INote } from '../types'

const Note = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState<INote | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadNote = async () => {
      if (!id) return
      try {
        const noteData = await memoryService.getNote(parseInt(id))
        setNote(noteData)
      } catch (error) {
        console.error('Error loading note:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadNote()
  }, [id])

  if (isLoading) return <Loader text="Загружаем заметку..." />

  return (
    <>
      <HexagonBackground />
      <div className={styles.memoryContainer}>
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => navigate('/memory')}
          >
            ← Назад
          </button>
          <span className={styles.title}>{note?.title}</span>
        </div>
        <div className={styles.noteContent}>{note?.content}</div>
      </div>
    </>
  )
}

export default Note
