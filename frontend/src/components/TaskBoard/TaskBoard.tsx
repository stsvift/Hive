import React, { useEffect, useState } from 'react'
import TaskCard, { TaskCardProps } from '../TaskCard/TaskCard'
import './TaskBoard.css'

interface TaskBoardProps {
  onTaskClick: (id: string) => void
}

const TaskBoard: React.FC<TaskBoardProps> = ({ onTaskClick }) => {
  const [tasks, setTasks] = useState<Omit<TaskCardProps, 'onClick'>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch tasks from the API
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/tasks')
        if (!response.ok) {
          throw new Error('Failed to fetch tasks')
        }
        const data = await response.json()

        // Transform API data to match TaskCard props
        const formattedTasks = data.map((task: any) => ({
          id: task.id.toString(),
          title: task.title,
          description: task.description,
          priority: task.priority.toLowerCase(),
          status: task.status.toLowerCase().replace(' ', '-'),
          dueDate: task.taskDate,
          tags: task.tags
            ? task.tags.split(',').map((tag: string) => tag.trim())
            : [],
          icon: getTaskIcon(task.category),
        }))

        setTasks(formattedTasks)
        setError(null)
      } catch (err) {
        setError('Error loading tasks. Please try again later.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [])

  // Helper function to determine icon based on task category
  const getTaskIcon = (category: string | null): string => {
    if (!category) return 'tasks'

    switch (category.toLowerCase()) {
      case 'development':
        return 'code'
      case 'design':
        return 'paint-brush'
      case 'bug':
        return 'bug'
      case 'documentation':
        return 'book'
      case 'meeting':
        return 'users'
      case 'planning':
        return 'calendar-alt'
      case 'personal':
        return 'user'
      default:
        return 'tasks'
    }
  }

  return (
    <div className="task-board">
      <div className="board-header">
        <h2>Мои задачи</h2>
        <div className="board-actions">
          <button className="btn btn-ghost">
            <i className="fas fa-filter"></i> Фильтр
          </button>
          <button className="btn btn-primary">
            <i className="fas fa-plus"></i> Добавить
          </button>
        </div>
      </div>

      <div className="board-content">
        {isLoading ? (
          <div className="loading-indicator">Загрузка задач...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-tasks"></i>
            <p>У вас пока нет задач</p>
            <button className="btn btn-primary">
              <i className="fas fa-plus"></i> Создать задачу
            </button>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              {...task}
              onClick={() => onTaskClick(task.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default TaskBoard
