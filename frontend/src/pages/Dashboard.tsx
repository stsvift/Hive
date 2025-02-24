import { useEffect, useState } from 'react'
import { dashboardService } from '../api/dashboard'
import DashboardWidget from '../components/DashboardWidget'
import HexagonBackground from '../components/HexagonBackground'
import Loader from '../components/Loader'
import { useNavigation } from '../context/NavigationContext'
import styles from '../styles/Dashboard.module.css'
import { ITask, TaskStats } from '../types'

const Dashboard = () => {
  const { setNavVisible } = useNavigation()
  const [currentTime, setCurrentTime] = useState('')
  const [greeting, setGreeting] = useState('')
  const [username, setUsername] = useState('')
  const [todayTasks, setTodayTasks] = useState<ITask[]>([])
  const [taskStats, setTaskStats] = useState<TaskStats>({
    activeTasks: 0,
    completedTasks: 0,
    totalTasks: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [loadingText, setLoadingText] = useState<string>('')

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const list = e.currentTarget
    list.style.overflowY = 'auto'
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const list = e.currentTarget
    setTimeout(() => {
      list.style.overflowY = 'auto'
    }, 300)
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setLoadingText('Поиск вашего улья')
      setNavVisible(false)
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setUsername('Гость')
          return
        }

        const [tasks, stats, name] = await Promise.all([
          dashboardService.getTodayTasks(),
          dashboardService.getTaskStats(),
          dashboardService.getUsername(token),
        ])

        setUsername(name)
        setTodayTasks(tasks)
        const safeStats: TaskStats = {
          activeTasks: Number(stats.activeTasks) || 0,
          completedTasks:
            stats.completedTasks ?? stats.totalTasks - stats.activeTasks,
          totalTasks: Number(stats.totalTasks) || 0,
        }
        setTaskStats(safeStats)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
        setNavVisible(true)
      }
    }

    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setUsername(userData.name)
    }

    loadData()

    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)

      // Update greeting based on time
      const hour = now.getHours()
      if (hour >= 5 && hour < 12) setGreeting('Доброе утро')
      else if (hour >= 12 && hour < 18) setGreeting('Добрый день')
      else if (hour >= 18 && hour < 23) setGreeting('Добрый вечер')
      else setGreeting('Доброй ночи')
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)

    return () => {
      clearInterval(timer)
      setNavVisible(true)
    }
  }, [setNavVisible])

  if (isLoading) {
    return <Loader text={loadingText} />
  }

  return (
    <>
      <HexagonBackground />
      <div className={styles.dashboardContainer}>
        <div className={styles.header}>
          <span className={styles.title}>Hive</span>
          <span className={styles.clock}>{currentTime}</span>
        </div>
        <div className={styles.mainContent}>
          <h1 className={styles.greeting}>
            {greeting}, {username}!
          </h1>
        </div>
        <div className={styles.widgetsContainer}>
          <DashboardWidget size="small" title="Активные задачи">
            <p>{taskStats.activeTasks}</p>
          </DashboardWidget>
          <DashboardWidget size="small" title="Лучший день">
            <p>Вторник</p>
          </DashboardWidget>
          <DashboardWidget size="small" title="Процент выполнения">
            <p>
              {taskStats.totalTasks > 0
                ? Math.round(
                    (taskStats.completedTasks / taskStats.totalTasks) * 100
                  )
                : 0}
              %
            </p>
          </DashboardWidget>
          <DashboardWidget size="large" title="Скоро дедлайн 🔥">
            <div
              className={styles.tasksList}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {todayTasks.length > 0 ? (
                todayTasks.map(task => {
                  const deadline = new Date(task.deadline as string)
                  const isOverdue = deadline < new Date() && !task.isCompleted

                  return (
                    <div
                      key={task.id}
                      className={`${styles.taskItem} ${
                        isOverdue ? styles.overdue : ''
                      }`}
                    >
                      <div
                        className={`${styles.taskTime} ${
                          isOverdue ? styles.overdue : ''
                        }`}
                      >
                        {deadline.toLocaleTimeString('ru', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className={styles.taskInfo}>
                        <span className={styles.taskTitle}>{task.title}</span>
                        <button
                          className={styles.detailsButton}
                          onClick={() =>
                            (window.location.href = `/memory/task/${task.id}`)
                          }
                        >
                          Подробнее
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className={styles.noTasks}>Нет предстоящих задач 🎉</p>
              )}
            </div>
          </DashboardWidget>
        </div>
      </div>
    </>
  )
}

export default Dashboard
