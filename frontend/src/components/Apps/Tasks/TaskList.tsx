import { useRef, useState } from 'react'
import { Task } from '../../../api/tasksApi'
import { TaskItem } from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onStatusChange: (
    taskId: string,
    newStatus: 'todo' | 'in_progress' | 'done'
  ) => void
  loading: boolean
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  loading,
}) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  // Column references
  const columnRefs = {
    todo: useRef<HTMLDivElement>(null),
    in_progress: useRef<HTMLDivElement>(null),
    done: useRef<HTMLDivElement>(null),
  }

  // Improve task grouping with better status handling
  const groupTasks = (tasks: Task[]) => {
    return tasks.reduce(
      (groups: { [key in 'todo' | 'in_progress' | 'done']: Task[] }, task) => {
        if (!task) return groups

        let targetGroup: 'todo' | 'in_progress' | 'done' = 'todo'

        if (!task.status) {
          targetGroup = 'todo' // Default if no status
        } else {
          const status = String(task.status).toLowerCase()

          if (status.includes('progress') || status.includes('процессе')) {
            targetGroup = 'in_progress'
          } else if (
            status.includes('done') ||
            status.includes('завершенные') ||
            status.includes('завершено')
          ) {
            targetGroup = 'done'
          }
        }

        // Make a safe copy of the task with guaranteed id and status
        const safeTask = {
          ...task,
          id: String(task.id || Math.random()),
          title: task.title || task.name || 'Без названия',
          status: targetGroup,
        }

        groups[targetGroup].push(safeTask)
        return groups
      },
      {
        todo: [] as Task[],
        in_progress: [] as Task[],
        done: [] as Task[],
      }
    )
  }

  const groupedTasks = groupTasks(tasks)

  const handleDragStart = (task: Task) => {
    // Store the complete task object
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    if (dragOverColumn !== status) {
      setDragOverColumn(status)
    }
  }

  const handleDrop = async (
    e: React.DragEvent,
    status: 'todo' | 'in_progress' | 'done'
  ) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (draggedTask && draggedTask.status !== status) {
      // Pass the task ID for status change
      await onStatusChange(draggedTask.id.toString(), status)
    }

    setDraggedTask(null)
  }

  const renderTaskColumn = (
    title: string,
    tasks: Task[],
    status: 'todo' | 'in_progress' | 'done',
    icon: string
  ) => {
    const isDragOver = dragOverColumn === status

    return (
      <div
        className={`task-column column-${status} ${
          loading ? 'column-loading' : ''
        } ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={e => handleDragOver(e, status)}
        onDrop={e => handleDrop(e, status)}
        onDragLeave={() => setDragOverColumn(null)}
        ref={columnRefs[status]}
      >
        <div className="task-column-header">
          <h3>
            <i className={icon}></i>
            {title}
          </h3>
          <span className="task-count">{tasks.length}</span>
        </div>

        <div className="task-column-content">
          {Array.isArray(tasks) && tasks.length > 0 ? (
            tasks.map(task => (
              <TaskItem
                key={task.id}
                task={{
                  ...task,
                  id: String(task.id),
                  status: status, // Ensure consistent status
                }}
                onEdit={() => onEdit(task)}
                onDelete={() => onDelete(String(task.id))}
                onDragStart={() => handleDragStart(task)}
              />
            ))
          ) : (
            <div className="empty-column">
              <i className="fas fa-inbox"></i>
              <p>Нет задач</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="task-board-container">
      {renderTaskColumn(
        'К выполнению',
        groupedTasks.todo,
        'todo',
        'fas fa-clipboard-list'
      )}
      {renderTaskColumn(
        'В процессе',
        groupedTasks.in_progress,
        'in_progress',
        'fas fa-spinner'
      )}
      {renderTaskColumn(
        'Завершенные',
        groupedTasks.done,
        'done',
        'fas fa-check-circle'
      )}
    </div>
  )
}
