import React, { useEffect, useState } from 'react'
import { FolderItem } from '../../../api/foldersApi'
import { Task, tasksApi } from '../../../api/tasksApi'
import { formatDateTime, priorityToString } from '../../../utils/taskUtils'

interface TaskViewProps {
  tasks: FolderItem[]
  folderId?: string
}

const TaskView: React.FC<TaskViewProps> = ({ tasks, folderId }) => {
  const [taskDetails, setTaskDetails] = useState<Record<string, Task>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Load task details for all tasks
  useEffect(() => {
    const loadTaskDetails = async () => {
      if (!tasks || tasks.length === 0) return

      setIsLoading(true)
      const details: Record<string, Task> = {}

      for (const taskItem of tasks) {
        try {
          // Try all possible ID references
          const possibleIds = [
            taskItem.reference,
            taskItem.id,
            // Extract ID from task-123 format
            typeof taskItem.id === 'string' && taskItem.id.startsWith('task-')
              ? taskItem.id.substring(5)
              : null
          ].filter(Boolean)

          if (possibleIds.length === 0) continue

          // Try to load using each possible ID
          let task = null
          for (const id of possibleIds) {
            try {
              if (id !== null) {
                task = await tasksApi.getTask(id)
              }
              if (task) break
            } catch (err) {
              // Continue trying other IDs
            }
          }

          if (task) {
            // Store task under all possible keys for reliable lookup
            for (const id of possibleIds) {
              if (id) {
                details[String(id)] = task
              }
            }
          } else {
            // Create fallback task if API call fails
            const fallbackTask = {
              id: possibleIds[0],
              title: taskItem.name || `Task ${possibleIds[0]}`,
              description: taskItem.description || 'Details not available',
              isCompleted: !!taskItem.isCompleted || taskItem.status === 'done',
              createdAt: taskItem.createdAt || new Date().toISOString(),
              priority: taskItem.priority !== undefined ? taskItem.priority : 'medium',
              status: taskItem.status || (taskItem.isCompleted ? 'done' : 'todo'),
              deadline: taskItem.deadline || null
            } as Task

            // Store fallback task
            for (const id of possibleIds) {
              if (id) details[String(id)] = fallbackTask
            }
          }
        } catch (err) {
          console.error('Error loading task details:', err)
        }
      }

      setTaskDetails(details)
      setIsLoading(false)
    }

    loadTaskDetails()
  }, [tasks])

  // Helper function for priority color
  const getPriorityColor = (priority: string | number) => {
    const priorityValue = priorityToString(priority)
    
    switch (priorityValue) {
      case 'high': return '#e74c3c'
      case 'medium': return '#f39c12'
      case 'low': return '#2ecc71'
      default: return '#95a5a6'
    }
  }

  // Helper function to check if deadline is approaching soon
  const isDeadlineSoon = (deadlineStr: string): boolean => {
    if (!deadlineStr) return false
    
    const deadline = new Date(deadlineStr)
    const now = new Date()
    
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    return diffHours > 0 && diffHours <= 24
  }

  if (isLoading) {
    return <div className="task-view-loading">Loading tasks...</div>
  }

  if (!tasks || tasks.length === 0) {
    return <div className="task-view-empty">No tasks available</div>
  }

  return (
    <div className="task-view">
      <h3>Tasks</h3>
      <div className="task-list">
        {tasks.map(taskItem => {
          // Get task details
          const taskId = taskItem.reference || taskItem.id || taskItem.referenceId
          const task = taskDetails[taskId]
          
          if (!task) return null
          
          // Calculate priority display
          const priorityDisplay = typeof task.priority === 'number'
            ? ['Low', 'Medium', 'High'][task.priority - 1] || 'Medium'
            : String(task.priority).charAt(0).toUpperCase() + 
              String(task.priority).slice(1)
          
          return (
            <div 
              key={`task-${taskId}`} 
              className="folder-item task-item"
              style={{ '--folder-color': getPriorityColor(task.priority) } as React.CSSProperties}
            >
              <div className="folder-icon">
                <i className="fas fa-tasks"></i>
              </div>
              <div className="folder-info">
                <div className="folder-name">{task.title}</div>
                <div className="folder-description">
                  {task.description
                    ? task.description.substring(0, 80) +
                      (task.description.length > 80 ? '...' : '')
                    : 'No description'}
                  
                  {task.deadline && (
                    <div className="task-deadline">
                      <i className="fas fa-clock"></i>{' '}
                      <span>
                        {formatDateTime(task.deadline)}
                        {isDeadlineSoon(task.deadline) && (
                          <span className="deadline-warning">
                            <i className="fas fa-exclamation-circle"></i>
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="task-properties">
                    <span
                      className="task-priority"
                      style={{ color: getPriorityColor(task.priority) }}
                    >
                      <i className="fas fa-flag"></i> {priorityDisplay}
                    </span>
                  </div>
                </div>
              </div>
              <div className="task-status">
                <span
                  className={`status-badge ${
                    String(task.status || '')
                      .toLowerCase()
                      .replace(' ', '-') || 'todo'
                  }`}
                >
                  {typeof task.status === 'string'
                    ? task.status.charAt(0).toUpperCase() + task.status.slice(1)
                    : task.isCompleted
                    ? 'Done'
                    : 'Todo'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TaskView
