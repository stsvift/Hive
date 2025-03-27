import React, { useEffect, useState } from 'react'
import HoneycombCell from './HoneycombCell'
import './HoneycombGrid.css'

interface Task {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in-progress' | 'completed'
  dueDate?: string
  icon?: string
}

interface HoneycombGridProps {
  onCellClick: (id: string) => void
}

const HoneycombGrid: React.FC<HoneycombGridProps> = ({ onCellClick }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch prioritized tasks from API
    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/tasks/prioritized')
        if (!response.ok) {
          throw new Error('Failed to fetch tasks')
        }

        const data = await response.json()

        // Transform API data to match our interface
        const formattedTasks = data.map((task: any) => ({
          id: task.id.toString(),
          title: task.title,
          description: task.description,
          priority: task.priority.toLowerCase(),
          status: task.status.toLowerCase().replace(' ', '-'),
          dueDate: task.taskDate,
          icon: getTaskIcon(task.category),
        }))

        setTasks(formattedTasks)
        setError(null)
      } catch (err) {
        setError('Error loading tasks')
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#F9A826' // Brighter honey gold
      case 'medium':
        return '#FFC107' // Regular honey yellow
      case 'low':
        return '#FFEAA7' // Light honey color
      default:
        return '#FFC107'
    }
  }

  if (isLoading) {
    return <div className="loading-indicator">Loading tasks...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  return (
    <div className="honeycomb-grid">
      {tasks.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-tasks"></i>
          <p>No priority tasks found</p>
        </div>
      ) : (
        tasks.map(task => (
          <HoneycombCell
            key={task.id}
            id={task.id}
            title={task.title}
            description={task.description}
            color={getPriorityColor(task.priority)}
            icon={task.icon || 'tasks'}
            onClick={() => onCellClick(task.id)}
          />
        ))
      )}
    </div>
  )
}

export default HoneycombGrid
