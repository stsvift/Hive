import React, { useEffect, useState } from 'react'
import { Folder } from '../../../api/foldersApi'
import { Task, tasksApi } from '../../../api/tasksApi'
import { formatDateTime, priorityToString } from '../../../utils/taskUtils'

interface FolderViewProps {
  folders: Folder[]
  currentFolder: Folder | null
  onFolderClick: (id: string) => void
  onDeleteFolder: (id: string) => void
}

const FolderView: React.FC<FolderViewProps> = ({
  folders,
  currentFolder,
  onFolderClick,
  onDeleteFolder,
}) => {
  const [taskDetails, setTaskDetails] = useState<Record<string, Task>>({})
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)

  // Load task details when folder changes - improved for reliability
  useEffect(() => {
    const loadTaskDetails = async () => {
      if (!currentFolder) return

      // Clear previous task cache when folder changes
      setTaskDetails({})
      setIsLoadingTasks(true)

      console.log('Current folder data:', currentFolder)

      // Collect all possible task items from different sources
      let allTaskItems: any[] = []

      // 1. Check items array (primary source)
      if (Array.isArray(currentFolder.items)) {
        const taskItems = currentFolder.items.filter(
          item => item.type === 'task'
        )
        allTaskItems.push(...taskItems)
        console.log(`Found ${taskItems.length} tasks in items array`)
      }

      // 2. Check alternative sources
      const alternativeSources = [
        // { name: 'tasks', items: currentFolder.tasks },
        // { name: 'taskItems', items: currentFolder.taskItems },
        {
          name: 'content',
          items: (currentFolder as any).content?.filter(
            (i: any) => i.type === 'task'
          ),
        },
      ]

      for (const source of alternativeSources) {
        if (Array.isArray(source.items) && source.items.length > 0) {
          console.log(
            `Found ${source.items.length} tasks in ${source.name} property`
          )

          // Convert to standard format if needed
          const convertedItems = source.items.map((task: any) => ({
            id: task.id || `task-${Math.random().toString(36).substr(2, 9)}`,
            type: 'task',
            reference: String(
              task.id || task.reference || task.referenceId || ''
            ),
            // Keep original data for direct rendering if API fetch fails
            ...task,
          }))

          allTaskItems.push(...convertedItems)
        }
      }

      // Remove duplicates (tasks might appear in multiple sources)
      const uniqueItems = allTaskItems.filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            t =>
              (t.reference &&
                item.reference &&
                t.reference === item.reference) ||
              (t.id && item.id && t.id === item.id)
          )
      )

      console.log(`Processing ${uniqueItems.length} unique task items`)

      if (uniqueItems.length === 0) {
        console.log('No tasks found in this folder')
        setIsLoadingTasks(false)
        return
      }

      // Process all tasks
      await loadTasksFromItems(uniqueItems)
    }

    const loadTasksFromItems = async (items: any[]) => {
      // Create a map to collect task data
      const tasksData: Record<string, Task> = {}

      console.log(
        'Starting to load details for tasks:',
        items.map(item => ({
          id: item.id,
          reference: item.reference,
          referenceId: item.referenceId,
        }))
      )

      // First pass - load all tasks and collect basic info even if API fails
      for (const item of items) {
        try {
          // Попробуем все возможные ID для поиска задачи
          const possibleIds = [
            item.reference,
            item.referenceId,
            item.id,
            // Извлекаем ID из строк формата "task-123"
            typeof item.id === 'string' && item.id.startsWith('task-')
              ? item.id.substring(5)
              : null,
          ].filter(Boolean) // Удаляем пустые значения

          // Если нет ни одного ID, пропускаем
          if (possibleIds.length === 0) {
            console.warn('Task has no usable reference ID:', item)
            continue
          }

          console.log(
            `Trying to load task using IDs: ${possibleIds.join(', ')}`
          )

          // Try to load using all possible IDs
          let task = null
          let loadedId = null

          // Проходим по всем возможным ID, пока не найдем задачу
          for (const id of possibleIds) {
            try {
              console.log(`Attempting to load task with ID ${id}`)
              task = await tasksApi.getTask(id)
              loadedId = id
              console.log(`Successfully loaded task with ID ${id}:`, task)
              break // Если успешно загрузили, выходим из цикла
            } catch (idError) {
              console.log(`Failed to load task with ID ${id}:`, idError)
              // Продолжаем попытки с другими ID
            }
          }

          if (task) {
            // Успешно загрузили задачу, сохраняем по всем возможным ключам
            console.log(`Successfully loaded task ${loadedId}:`, task)

            // Store task under all possible keys for reliable lookup
            for (const id of possibleIds) {
              if (id) {
                tasksData[String(id)] = task
                // Также сохраняем с префиксом task- для надежности
                tasksData[`task-${id}`] = task
              }
            }
          } else {
            console.warn(
              `Failed to load task using any ID, using fallback data`
            )

            // Create a fallback task from available data
            const fallbackTask = {
              id: possibleIds[0], // Используем первый доступный ID
              title: item.title || item.name || `Task ${possibleIds[0]}`,
              description: item.description || 'Task details unavailable',
              isCompleted: item.isCompleted || item.status === 'done',
              createdAt: item.createdAt || new Date().toISOString(),
              priority: item.priority || 'medium',
              status: item.status || 'todo',
            }

            // Store the fallback data under all possible keys
            for (const id of possibleIds) {
              if (id) {
                tasksData[String(id)] = fallbackTask
                tasksData[`task-${id}`] = fallbackTask
              }
            }
          }
        } catch (error) {
          console.error(`Error processing task item:`, error)
        }
      }

      console.log(`Successfully loaded ${Object.keys(tasksData).length} tasks`)
      console.log('Task details loaded:', tasksData)
      setTaskDetails(tasksData)
      setIsLoadingTasks(false)
    }

    loadTaskDetails()
  }, [currentFolder])

  // Добавляем отладку для проверки данных папки
  useEffect(() => {
    console.log('Current folder:', currentFolder)
    console.log('Subfolders:', currentFolder?.subfolders)

    // Добавим более детальный вывод структуры папок для отладки
    if (currentFolder && Array.isArray(currentFolder.subfolders)) {
      console.log(
        `Found ${currentFolder.subfolders.length} subfolders in the current folder`
      )
      currentFolder.subfolders.forEach((subfolder, index) => {
        console.log(`Subfolder ${index + 1}:`, {
          id: subfolder.id,
          name: subfolder.name,
          parentFolderId: subfolder.parentFolderId,
        })
      })
    } else if (!currentFolder && Array.isArray(folders)) {
      console.log(`Found ${folders.length} root folders`)
      folders.forEach((folder, index) => {
        console.log(`Root folder ${index + 1}:`, {
          id: folder.id,
          name: folder.name,
          parentFolderId: folder.parentFolderId,
        })
      })
    }
  }, [currentFolder, folders])

  // Add a useEffect hook to log note data for debugging
  useEffect(() => {
    if (currentFolder && Array.isArray(currentFolder.notes)) {
      console.log(
        `Found ${currentFolder.notes.length} notes in current folder:`,
        currentFolder.notes
      )
    } else if (currentFolder) {
      console.log('No notes array found in current folder or it is empty')
    }
  }, [currentFolder])

  // Add debugging utility function to help diagnose task issues
  const logFolderContents = (folder: any) => {
    if (!folder) return
    console.group('🔍 Task Detection Analysis')

    // Check all possible task sources
    console.log('Items array exists:', Array.isArray(folder.items))
    if (Array.isArray(folder.items)) {
      const taskItems = folder.items.filter(item => item.type === 'task')
      console.log(
        `Items array contains ${taskItems.length} tasks:`,
        taskItems.map(t => ({ id: t.id, ref: t.reference }))
      )
    }

    // Check for notes
    console.log('Notes array exists:', Array.isArray(folder.notes))
    if (Array.isArray(folder.notes)) {
      console.log(`Notes array contains ${folder.notes.length} notes`)
    }

    // Check alternative task sources
    console.log('Tasks array exists:', Array.isArray(folder.tasks))
    console.log('Content array exists:', Array.isArray((folder as any).content))

    console.groupEnd()
  }

  // Add this to the beginning of the component to run task detection
  useEffect(() => {
    if (currentFolder) {
      logFolderContents(currentFolder)
    }
  }, [currentFolder])

  // Add this debugging function to run on component mount or folder change
  useEffect(() => {
    if (currentFolder) {
      console.group('🔍 Task Rendering Debug Info')
      console.log('Current folder ID:', currentFolder.id)

      // Show all properties where tasks could be stored
      if (Array.isArray(currentFolder.items)) {
        const tasks = currentFolder.items.filter(item => item.type === 'task')
        console.log(`Tasks in items array: ${tasks.length}`, tasks)
      } else {
        console.log('items array is missing or not an array')
      }

      if (Array.isArray(currentFolder.tasks)) {
        console.log(
          `Tasks in tasks array: ${currentFolder.tasks.length}`,
          currentFolder.tasks
        )
      }

      console.log('Full folder data:', currentFolder)
      console.groupEnd()
    }
  }, [currentFolder])

  // Confirm deletion
  const handleDelete = (
    e: React.MouseEvent,
    folderId: string,
    folderName: string
  ) => {
    e.stopPropagation()
    if (
      window.confirm(
        `Are you sure you want to delete the folder "${folderName}"?`
      )
    ) {
      onDeleteFolder(folderId)
    }
  }

  // Обновляем функцию hasItems для правильной проверки подпапок
  const hasItems = () => {
    if (!currentFolder) {
      console.log('Root folders count:', folders.length)
      return folders.length > 0
    }

    // Explicitly check all possible sources of content
    const hasSubfolders =
      Array.isArray(currentFolder.subfolders) &&
      currentFolder.subfolders.length > 0

    const hasNotes =
      Array.isArray(currentFolder.notes) && currentFolder.notes.length > 0

    const hasTasksInItems =
      Array.isArray(currentFolder.items) &&
      currentFolder.items.some(item => item.type === 'task')

    const hasTasksArray =
      Array.isArray(currentFolder.tasks) && currentFolder.tasks.length > 0

    const hasContent =
      Array.isArray((currentFolder as any).content) &&
      (currentFolder as any).content.length > 0

    const hasAnyContent =
      hasSubfolders ||
      hasNotes ||
      hasTasksInItems ||
      hasTasksArray ||
      hasContent

    console.log('Content detection:', {
      hasSubfolders,
      hasNotes,
      hasTasksInItems,
      hasTasksArray,
      hasContent,
      hasAnyContent,
    })

    return hasAnyContent
  }

  // Get priority color - improved with consistent handling
  const getPriorityColor = (priority: string | number) => {
    // Normalize the priority to string format
    const priorityValue = priorityToString(priority)

    switch (priorityValue) {
      case 'high':
        return '#e74c3c'
      case 'medium':
        return '#f39c12'
      case 'low':
        return '#2ecc71'
      default:
        return '#95a5a6'
    }
  }

  // Fix status conversion issue
  const statusToString = (status: any): 'todo' | 'in_progress' | 'done' => {
    if (!status) return 'todo'

    if (typeof status === 'string') {
      const normalized = status.toLowerCase()

      // Handle Russian status values
      if (normalized.includes('выполнению') || normalized.includes('todo'))
        return 'todo'
      if (normalized.includes('процессе') || normalized.includes('progress'))
        return 'in_progress'
      if (normalized.includes('заверш') || normalized.includes('done'))
        return 'done'

      // More exact matching
      if (normalized === 'к выполнению') return 'todo'
      if (normalized === 'в процессе') return 'in_progress'
      if (normalized === 'завершенные' || normalized === 'завершено')
        return 'done'
    }

    return 'todo' // Default fallback
  }

  // Modify renderTasks for more aggressive task discovery and rendering
  const renderTasks = () => {
    if (!currentFolder) return null

    console.log('Starting task render for folder:', currentFolder.id)

    // Collect ALL tasks from every possible source
    const allTaskSources = []

    // 1. Check items array
    if (Array.isArray(currentFolder.items)) {
      const taskItems = currentFolder.items.filter(item => item.type === 'task')
      if (taskItems.length > 0) {
        console.log(`Found ${taskItems.length} tasks in items array`)
        allTaskSources.push(...taskItems)
      }
    }

    // 2. Check tasks array
    if (Array.isArray(currentFolder.tasks)) {
      console.log(`Found ${currentFolder.tasks.length} tasks in tasks array`)
      const tasksFormatted = currentFolder.tasks.map(task => ({
        id: `task-${task.id}`,
        type: 'task',
        reference: String(task.id),
        title: task.title || task.name || `Task ${task.id}`,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        deadline: task.deadline,
        ...task, // Keep all original properties
      }))
      allTaskSources.push(...tasksFormatted)
    }

    // 3. Check content array
    if (Array.isArray((currentFolder as any).content)) {
      const contentTasks = (currentFolder as any).content.filter(
        (item: any) => item.type === 'task'
      )
      console.log(`Found ${contentTasks.length} tasks in content array`)
      allTaskSources.push(...contentTasks)
    }

    // 4. Check taskItems array (another possible location)
    if (Array.isArray((currentFolder as any).taskItems)) {
      console.log(
        `Found ${
          (currentFolder as any).taskItems.length
        } tasks in taskItems array`
      )
      allTaskSources.push(...(currentFolder as any).taskItems)
    }

    console.log(
      `Total tasks collected from all sources: ${allTaskSources.length}`
    )

    // If no tasks found in any source, log a clear message
    if (allTaskSources.length === 0) {
      console.log('⚠️ NO TASKS FOUND IN ANY SOURCE')
      return (
        <div className="empty-task-list">
          <p>No tasks available in this folder.</p>
          <p className="hint">
            Create a new task using the "New Task" button above.
          </p>
        </div>
      )
    }

    // Remove duplicates by reference or ID
    const uniqueTasks = allTaskSources.filter(
      (task, index, self) =>
        index ===
        self.findIndex(
          t =>
            (t.reference && task.reference && t.reference === task.reference) ||
            (t.id && task.id && String(t.id) === String(task.id))
        )
    )

    console.log(`After deduplication: ${uniqueTasks.length} unique tasks`)

    return renderTaskItems(uniqueTasks)
  }

  // Helper function for rendering task items - improved with better fallbacks
  const renderTaskItems = (items: any[]) => {
    if (!items || items.length === 0) {
      return null
    }

    console.log(
      `Rendering ${items.length} task items:`,
      items.map(i => ({ id: i.id, ref: i.reference }))
    )

    return items
      .map(item => {
        try {
          // Try to get task details from our cache with multiple ID formats
          let taskData = null
          const possibleIds = [
            item.reference,
            item.referenceId,
            item.id,
            // Strip 'task-' prefix if present
            typeof item.id === 'string' && item.id.startsWith('task-')
              ? item.id.substring(5)
              : null,
          ].filter(Boolean)

          // Try each possible ID
          for (const id of possibleIds) {
            if (taskDetails[id]) {
              taskData = taskDetails[id]
              break
            } else if (taskDetails[`task-${id}`]) {
              taskData = taskDetails[`task-${id}`]
              break
            }
          }

          // If still no data, check if item itself has necessary task data
          if (!taskData && (item.title || item.name)) {
            taskData = {
              id: item.reference || item.id || `task-${Date.now()}`,
              title: item.title || item.name || 'Unnamed Task',
              description: item.description || '',
              priority: item.priority || 'medium',
              status: item.status || 'todo',
              deadline: item.deadline,
              isCompleted: !!item.isCompleted,
            }
          }

          // Final fallback - create minimal task object
          if (!taskData) {
            const taskId = item.reference || item.id || `unknown-${Date.now()}`
            taskData = {
              id: taskId,
              title: isLoadingTasks
                ? `Loading task ${taskId}...`
                : `Task ${taskId}`,
              description: isLoadingTasks
                ? 'Loading details...'
                : 'Task details unavailable',
              priority: 'medium',
              status: 'todo',
              isCompleted: false,
            }
          }

          // Now render the task with the data we have
          return (
            <div
              key={`task-${
                item.id || item.reference || Math.random().toString()
              }`}
              className="folder-item task-item"
              style={
                {
                  '--folder-color': getPriorityColor(taskData.priority),
                } as React.CSSProperties
              }
            >
              <div className="folder-icon">
                <i className="fas fa-tasks"></i>
              </div>
              <div className="folder-info">
                <div className="folder-name">
                  {taskData.title || 'Без названия'}
                </div>
                <div className="folder-description">
                  {taskData.description
                    ? taskData.description.substring(0, 80) +
                      (taskData.description.length > 80 ? '...' : '')
                    : isLoadingTasks
                    ? 'Загрузка...'
                    : 'Нет описания'}

                  {taskData.deadline && (
                    <div className="task-deadline">
                      <i className="fas fa-clock"></i>{' '}
                      <span>
                        {formatDateTime(taskData.deadline)}
                        {isDeadlineSoon(taskData.deadline) && (
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
                      style={{ color: getPriorityColor(taskData.priority) }}
                    >
                      <i className="fas fa-flag"></i>{' '}
                      {priorityToString(taskData.priority)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="task-status">
                <span
                  className={`status-badge ${statusToString(taskData.status)}`}
                >
                  {taskData.status === 'in_progress'
                    ? 'В процессе'
                    : taskData.status === 'done'
                    ? 'Завершено'
                    : 'К выполнению'}
                </span>
              </div>
            </div>
          )
        } catch (error) {
          console.error('Error rendering task item:', error)
          return null
        }
      })
      .filter(Boolean) // Filter out any null items
  }

  // Helper function to check if deadline is approaching soon (within 24 hours)
  const isDeadlineSoon = (deadlineStr: string): boolean => {
    if (!deadlineStr) return false

    const deadline = new Date(deadlineStr)
    const now = new Date()

    // Calculate difference in hours
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Return true if deadline is within next 24 hours and not passed
    return diffHours > 0 && diffHours <= 24
  }

  // Improved note rendering to handle more edge cases
  const renderNotes = () => {
    if (!currentFolder) return null

    if (
      !Array.isArray(currentFolder.notes) ||
      currentFolder.notes.length === 0
    ) {
      console.log('No notes to render in the current folder')
      return null
    }

    console.log(`Rendering ${currentFolder.notes.length} notes`)

    return currentFolder.notes.map(note => (
      <div
        key={`note-${note.id || Math.random().toString(36).substring(2, 9)}`}
        className="folder-item note-item"
        style={{ '--folder-color': '#6c5ce7' } as React.CSSProperties}
      >
        <div className="folder-icon">
          <i className="fas fa-sticky-note"></i>
        </div>
        <div className="folder-info">
          <div className="folder-name">{note.title || 'Untitled Note'}</div>
          {note.content && (
            <div className="folder-description">
              {typeof note.content === 'string'
                ? note.content.substring(0, 100) +
                  (note.content.length > 100 ? '...' : '')
                : 'No content'}
            </div>
          )}
        </div>
      </div>
    ))
  }

  return (
    <div className="folder-view">
      {!hasItems() ? (
        <div className="section-empty">
          <i className="fas fa-folder-open"></i>
          <p>No folders found</p>
          {currentFolder ? (
            <p className="hint">
              Create a subfolder using the "Add" button above.
            </p>
          ) : (
            <p className="hint">Create a new folder to get started.</p>
          )}
        </div>
      ) : (
        <div className="folder-grid">
          {/* Отображаем только папки, удалив код для отображения заметок и задач */}
          {(() => {
            // Определяем список папок для рендеринга с дополнительными проверками
            let foldersToRender = currentFolder
              ? currentFolder.subfolders
              : folders

            // Проверяем, что foldersToRender является массивом
            if (!Array.isArray(foldersToRender)) {
              console.error('foldersToRender is not an array:', foldersToRender)
              foldersToRender = []
            }

            // Более тщательная фильтрация папок для отображения
            if (currentFolder) {
              // Фильтруем папки, чтобы убрать как саму текущую папку, так и папки с неправильным parentFolderId
              foldersToRender = foldersToRender.filter(folder => {
                // Проверяем существование папки
                if (!folder || typeof folder !== 'object') {
                  return false
                }

                // Убираем текущую папку из списка подпапок
                if (folder.id === currentFolder.id) {
                  console.log(
                    `Filtering out current folder (${
                      folder.name || folder.id
                    }) from its own subfolders`
                  )
                  return false
                }

                // Удаляем родительские папки, если они каким-то образом попали в список подпапок
                if (
                  currentFolder.parentFolderId &&
                  folder.id === currentFolder.parentFolderId
                ) {
                  console.log(
                    `Filtering out parent folder (ID:${folder.id}) from subfolders list`
                  )
                  return false
                }

                // Проверяем, что parentFolderId подпапки соответствует ID текущей папки
                // Это гарантирует, что мы показываем только прямых потомков текущей папки
                if (
                  folder.parentFolderId !== undefined &&
                  folder.parentFolderId !== null
                ) {
                  const isDirectChild =
                    folder.parentFolderId === currentFolder.id
                  if (!isDirectChild) {
                    console.log(
                      `Filtering out folder ${
                        folder.name || folder.id
                      } as it's not a direct child`
                    )
                    return false
                  }
                }

                return true
              })
            }

            console.log(
              `Rendering ${foldersToRender.length} folders after filtering:`,
              foldersToRender.map(f => ({
                id: f.id,
                name: f.name,
                parentId: f.parentFolderId,
              }))
            )

            return foldersToRender
              .map(folder => {
                if (!folder || typeof folder !== 'object') {
                  console.error('Invalid folder object:', folder)
                  return null
                }

                console.log('Rendering folder:', folder.name, folder.id)
                return (
                  <div
                    key={folder.id}
                    className="folder-item"
                    onClick={() => onFolderClick(folder.id)}
                    style={
                      {
                        '--folder-color': folder.color || '#4a6fa5',
                      } as React.CSSProperties
                    }
                  >
                    <div className="folder-icon">
                      <i className="fas fa-folder"></i>
                    </div>
                    <div className="folder-info">
                      <div className="folder-name">{folder.name}</div>
                      {folder.description && (
                        <div className="folder-description">
                          {folder.description}
                        </div>
                      )}
                    </div>
                    <div className="folder-actions">
                      <button
                        className="folder-delete-btn"
                        onClick={e => handleDelete(e, folder.id, folder.name)}
                        title="Delete folder"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                )
              })
              .filter(Boolean) // Filter out any null elements
          })()}
        </div>
      )}
    </div>
  )
}

export default FolderView
