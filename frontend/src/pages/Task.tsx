import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { memoryService } from '../api/memory'
import HexagonBackground from '../components/HexagonBackground'
import Loader from '../components/Loader'
import styles from '../styles/Memory.module.css'
import { ITask } from '../types'

const Task = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState<ITask | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTask = async () => {
      if (!id) {
        navigate('/memory')
        return
      }
      try {
        const taskData = await memoryService.getTask(parseInt(id))
        if (!taskData) {
          navigate('/memory')
          return
        }
        setTask(taskData)
      } catch (error) {
        console.error('Error loading task:', error)
        navigate('/memory')
      } finally {
        setIsLoading(false)
      }
    }
    loadTask()
  }, [id, navigate])

  const handleToggleComplete = async () => {
    if (!task) return
    try {
      await memoryService.toggleTaskComplete(task.id)
      setTask(prev =>
        prev ? { ...prev, isCompleted: !prev.isCompleted } : null
      )
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  if (isLoading) return <Loader text="Загружаем задачу..." />

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
          <span className={styles.title}>{task?.title}</span>
        </div>
        <div className={styles.taskContent}>
          <div className={styles.taskStatus}>
            <label className={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={task?.isCompleted}
                onChange={handleToggleComplete}
              />
              <span className={styles.checkmark}></span>
            </label>
            <span>
              Статус: {task?.isCompleted ? 'Выполнено' : 'В процессе'}
            </span>
          </div>
          <div className={styles.taskDescription}>{task?.description}</div>
          {task?.deadline && (
            <div className={styles.taskDeadline}>
              Срок выполнения: {new Date(task.deadline).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Task
