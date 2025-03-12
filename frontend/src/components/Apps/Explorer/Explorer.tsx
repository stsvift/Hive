import { useEffect, useState } from 'react'
import { Folder, foldersApi } from '../../../api/foldersApi'
import CreateFolderModal from './CreateFolderModal'
import CreateNoteModal from './CreateNoteModal'
import CreateTaskModal from './CreateTaskModal'
import './Explorer.css'
import FolderBreadcrumb from './FolderBreadcrumb'
import FolderView from './FolderView'
import NotesView from './NotesView'
import TaskList from './TaskList'

// Import API for notes and tasks
import { notesApi } from '../../../api/notesApi'
import { tasksApi } from '../../../api/tasksApi'
// Import utility functions for task priority and status conversion
import { stringToPriority, stringToStatus } from '../../../utils/taskUtils'

const Explorer = () => {
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  const [folderPath, setFolderPath] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false)
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false)
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)

  // Fetch all folders on component mount
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await foldersApi.getFolders()

        // Even if the request fails, we'll get an empty array
        setFolders(data)
        setCurrentFolder(null)
        setFolderPath([])

        if (data.length === 0) {
          setError('No folders found. Create a new folder to get started.')
        }
      } catch (err) {
        setError('Unable to load folders. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFolders()
  }, [])

  // Build folder path when navigating
  const buildFolderPath = async (folder: Folder) => {
    if (!folder.parentFolderId) {
      return [folder]
    }

    try {
      const path = [folder]
      let currentId = folder.parentFolderId
      let maxDepth = 10 // Prevent infinite loop

      while (currentId && maxDepth > 0) {
        try {
          const parentFolder = await foldersApi.getFolder(currentId)
          path.unshift(parentFolder)
          currentId = parentFolder.parentFolderId ?? ''
          maxDepth--
        } catch (err) {
          break
        }
      }

      return path
    } catch (err) {
      return [folder]
    }
  }

  // Helper function to ensure tasks are visible in the folder
  const ensureFolderTasksVisibility = (folder: Folder): Folder => {
    if (!folder) return folder

    const result = { ...folder }

    // Ensure the items array exists
    if (!result.items) {
      result.items = []
    }

    // Get tasks from DB - check if folder already has a tasks array
    if (Array.isArray(folder.tasks) && folder.tasks.length > 0) {
      // Check if these tasks are already in the items array
      for (const task of folder.tasks) {
        const taskId = String(task.id)
        const alreadyInItems = result.items.some(
          item =>
            item.type === 'task' &&
            (String(item.id) === taskId ||
              String(item.reference) === taskId ||
              String(item.referenceId) === taskId)
        )

        if (!alreadyInItems) {
          result.items.push({
            id: `task-${taskId}`,
            type: 'task',
            reference: taskId,
            referenceId: taskId,
            // Include full task data for rendering
            title: task.title || task.name,
            description: task.description,
            priority: task.priority,
            status: task.status,
            deadline: task.deadline,
            createdAt: task.createdAt,
          })
        }
      }
    }

    // Check content array (another common source of tasks)
    if (Array.isArray((folder as any).content)) {
      const taskItems = (folder as any).content.filter(
        (i: any) => i.type === 'task'
      )
      if (taskItems.length > 0) {
        for (const item of taskItems) {
          const itemReference = item.reference || item.id
          const alreadyInItems = result.items.some(
            existing =>
              existing.type === 'task' &&
              (existing.reference === itemReference || existing.id === item.id)
          )

          if (!alreadyInItems && itemReference) {
            result.items.push({
              id: `task-${itemReference}`,
              type: 'task',
              reference: String(itemReference),
              referenceId: String(itemReference),
              // Include any available task data
              ...(item.task || item),
            })
          }
        }
      }
    }

    return result
  }

  // Navigate to a specific folder with improved task handling
  const navigateToFolder = async (folderId: string | null) => {
    if (folderId === null) {
      setCurrentFolder(null)
      setFolderPath([])
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // First, get the folder data
      const folderData = await foldersApi.getFolder(folderId)

      // Then explicitly fetch tasks for this folder
      let folderTasks: any[] = []
      try {
        const tasksResponse = await tasksApi.getTasks({ folderId })

        // Handle different response formats
        if (Array.isArray(tasksResponse)) {
          folderTasks = tasksResponse
        } else if (tasksResponse.tasks) {
          folderTasks = tasksResponse.tasks
        }
      } catch (taskError) {
        folderTasks = [] // Default to empty array on error
      }

      // Fix folder structure to ensure tasks are visible
      const fixedFolderData = { ...folderData }

      // Ensure items array exists
      if (!fixedFolderData.items) {
        fixedFolderData.items = []
      }

      // Directly add the tasks array to folder
      if (folderTasks.length > 0) {
        fixedFolderData.tasks = folderTasks

        // Also ensure tasks are in items array for rendering
        for (const task of folderTasks) {
          const taskId = String(task.id)
          // Look for this task in the items array
          const existingTaskItem = fixedFolderData.items.find(
            item =>
              item.type === 'task' &&
              (String(item.reference) === taskId ||
                String(item.referenceId) === taskId ||
                String(item.id) === taskId ||
                String(item.id) === `task-${taskId}`)
          )

          if (!existingTaskItem) {
            fixedFolderData.items.push({
              id: `task-${taskId}`,
              type: 'task',
              reference: taskId,
              referenceId: taskId,
              // Include full task data for rendering
              ...task,
            })
          }
        }
      }

      // Update the UI
      setCurrentFolder(fixedFolderData)

      // Build path to display in breadcrumbs
      const path = await buildFolderPath(fixedFolderData)
      setFolderPath(path)
    } catch (err) {
      setError('Failed to open folder. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  // Navigate up to parent folder or root
  const navigateUp = async () => {
    if (!currentFolder || !currentFolder.parentFolderId) {
      setCurrentFolder(null)
      setFolderPath([])
      return
    }

    try {
      navigateToFolder(currentFolder.parentFolderId)
    } catch (err) {
      setError('Failed to navigate to parent folder. Please try again later.')
    }
  }

  // Create a new folder
  const createFolder = async (name: string, description: string) => {
    if (!name.trim()) {
      setError('Folder name is required')
      return null
    }

    try {
      // Clear previous errors
      setError(null)

      // Store current folder task data before creating a new folder
      const currentFolderTasks = currentFolder
        ? [...(currentFolder.tasks || [])]
        : []
      const currentFolderItems = currentFolder
        ? [...(currentFolder.items || [])]
        : []
      const currentFolderTaskItems = currentFolderItems.filter(
        item => item.type === 'task'
      )

      // Prepare data, explicitly specifying types
      const folderData: {
        name: string
        description: string
        parentId?: string
      } = {
        name: name.trim(),
        description: description?.trim() || '',
      }

      // Add parentId only if we're inside a folder
      if (currentFolder) {
        folderData.parentId = currentFolder.id
      }

      // Create the folder via API
      const newFolder = await foldersApi.createFolder(folderData)

      // Update the interface after creation
      setTimeout(async () => {
        try {
          // Small delay before updating to give server time to process the request
          if (currentFolder) {
            const updatedFolder = await foldersApi.getFolder(currentFolder.id)

            // Check if the new folder is in the updated folder's subfolders
            const hasNewFolder = updatedFolder.subfolders?.some(
              subfolder => subfolder.id === newFolder.id
            )

            if (!hasNewFolder && updatedFolder.subfolders) {
              // If the new folder is not in the subfolder list, add it manually
              updatedFolder.subfolders.push(newFolder)
            }

            // Restore task data that might have been lost during refresh
            if (currentFolderTasks.length > 0) {
              // Restore tasks array if it's missing or has fewer tasks than before
              if (
                !updatedFolder.tasks ||
                updatedFolder.tasks.length < currentFolderTasks.length
              ) {
                updatedFolder.tasks = [...currentFolderTasks]
              }
            }

            // Restore task items if needed
            if (currentFolderTaskItems.length > 0) {
              // Initialize items array if it doesn't exist
              if (!updatedFolder.items) {
                updatedFolder.items = []
              }

              // Find task items that might be missing after refresh
              const updatedFolderTaskItems = updatedFolder.items.filter(
                item => item.type === 'task'
              )

              if (
                updatedFolderTaskItems.length < currentFolderTaskItems.length
              ) {
                // Keep non-task items
                const nonTaskItems = updatedFolder.items.filter(
                  item => item.type !== 'task'
                )

                // Combine with saved task items
                updatedFolder.items = [
                  ...nonTaskItems,
                  ...currentFolderTaskItems,
                ]
              }
            }

            setCurrentFolder(updatedFolder)
          } else {
            const updatedFolders = await foldersApi.getFolders()

            // Check if the new folder is in the root folders list
            const hasNewFolder = updatedFolders.some(
              folder => folder.id === newFolder.id
            )

            if (!hasNewFolder) {
              // If the new folder is not in the root folders list, add it manually
              updatedFolders.push(newFolder)
            }

            setFolders(updatedFolders)
          }
        } catch (refreshErr) {
          // Silent error handling
        }
      }, 500)

      setIsCreateFolderModalOpen(false)
      return newFolder
    } catch (err) {
      setError('Failed to create folder. Please try again.')
      return null
    }
  }

  // Create a new note with better task preservation
  const createNote = async (title: string, content: string) => {
    if (!currentFolder) {
      setError(
        'Cannot create a note at the root level. Please select a folder first.'
      )
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Create the note
      const newNote = await notesApi.createNote({
        title,
        content,
        folderId: currentFolder.id,
      })

      // Create a modified copy of the current folder with the new note
      const updatedFolder = { ...currentFolder }

      // Make sure the notes array exists
      if (!updatedFolder.notes) {
        updatedFolder.notes = []
      }

      // Add the new note to the notes array
      updatedFolder.notes.push({
        id: newNote.id || `note-${Date.now()}`,
        title: newNote.title || title,
        content: newNote.content || content,
        userId: newNote.userId || 0,
        folderId: currentFolder.id,
        createdAt: newNote.createdAt || new Date().toISOString(),
        updatedAt: newNote.updatedAt || new Date().toISOString(),
      })

      // Preserve all existing tasks

      // 1. Preserve tasks from the tasks array
      if (currentFolder.tasks && Array.isArray(currentFolder.tasks)) {
        updatedFolder.tasks = [...currentFolder.tasks]
      }

      // 2. Preserve tasks from the items array
      if (currentFolder.items && Array.isArray(currentFolder.items)) {
        // Copy all items, including tasks
        updatedFolder.items = [...currentFolder.items]
      }

      // Update the UI immediately with the new note
      setCurrentFolder(updatedFolder)
      setIsCreateNoteModalOpen(false)

      // Refresh the folder data after a short delay to ensure server sync
      setTimeout(async () => {
        try {
          const refreshedFolder = await foldersApi.getFolder(currentFolder.id)

          // If the refreshed version is missing tasks but they were present before, restore them
          if (
            (!refreshedFolder.tasks || refreshedFolder.tasks.length === 0) &&
            updatedFolder.tasks &&
            updatedFolder.tasks.length > 0
          ) {
            refreshedFolder.tasks = [...updatedFolder.tasks]
          }

          // Same for items with tasks
          const hasTaskItems =
            refreshedFolder.items &&
            refreshedFolder.items.some(item => item.type === 'task')
          if (!hasTaskItems && updatedFolder.items) {
            const taskItems = updatedFolder.items.filter(
              item => item.type === 'task'
            )
            if (taskItems.length > 0) {
              if (!refreshedFolder.items) refreshedFolder.items = []
              refreshedFolder.items.push(...taskItems)
            }
          }

          setCurrentFolder(refreshedFolder)
        } catch (refreshError) {
          // Silent error handling
        } finally {
          setIsLoading(false) // Ensure loading state ends regardless of refresh outcome
        }
      }, 1000)
    } catch (err) {
      setError('Failed to create note. Please try again later.')
      setIsLoading(false) // Ensure loading state ends on error
    }
  }

  // Create a new task with complete task preservation
  const createTask = async (
    title: string,
    description: string,
    priority: string,
    deadline?: string
  ) => {
    if (!currentFolder) {
      setError(
        'Cannot create a task at the root level. Please select a folder first.'
      )
      return
    }

    try {
      setIsLoading(true)
      setError(null) // Clear previous errors

      // Convert priority to numeric format
      const priorityValue = stringToPriority(priority)

      // Explicitly include folderId in all possible formats
      const taskData = {
        title,
        description,
        priority: priorityValue,
        status: stringToStatus('todo'),
        isCompleted: false,
        deadline,
        folderId: currentFolder.id, // Main format
        folderRef: currentFolder.id, // Alternative field for linking
        folder_id: currentFolder.id, // Another format
      }

      try {
        // Create the task with explicit folder connection and better error handling
        const newTask = await tasksApi.createTask(taskData)

        // Create a modified copy of the current folder with the new task
        const updatedFolder = structuredClone(currentFolder)

        // Make sure the tasks array exists
        if (!updatedFolder.tasks) {
          updatedFolder.tasks = []
        }

        // Add the new task to the tasks array
        updatedFolder.tasks.push({
          ...newTask,
          folderId: currentFolder.id, // Ensure folderId is set correctly
        })

        // Make sure the items array exists
        if (!updatedFolder.items) {
          updatedFolder.items = []
        }

        // Create stable item ID for all formats
        const taskItemId = `task-${String(newTask.id)}`

        // More reliable folder item format for tasks with all possible IDs
        const newTaskItem = {
          id: taskItemId,
          referenceId: String(newTask.id),
          type: 'task' as const,
          reference: String(newTask.id),
          // Add these fields to help with rendering before API refresh
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          status: newTask.status,
          deadline: newTask.deadline,
          createdAt: newTask.createdAt,
          folderId: currentFolder.id, // Duplicate folder ID for reliability
        }

        // Check if this item is already added
        const existingTaskIndex = updatedFolder.items.findIndex(
          item =>
            item.type === 'task' &&
            (item.reference === String(newTask.id) ||
              item.id === taskItemId ||
              item.referenceId === String(newTask.id))
        )

        if (existingTaskIndex >= 0) {
          // If task is already added, update its data
          updatedFolder.items[existingTaskIndex] = {
            ...updatedFolder.items[existingTaskIndex],
            ...newTaskItem,
          }
        } else {
          // Add new task to the list
          updatedFolder.items.push(newTaskItem)
        }

        // Update the UI immediately with new data structure
        setCurrentFolder(updatedFolder)
        setIsCreateTaskModalOpen(false)

        // Try to link task to folder with multiple attempts for reliability
        let success = false
        let attempt = 0
        const MAX_RETRIES = 3

        const forceAddTaskToFolder = async () => {
          while (!success && attempt < MAX_RETRIES) {
            attempt++
            try {
              await foldersApi.addItemToFolder(currentFolder.id, {
                type: 'task',
                referenceId: String(newTask.id),
              })

              success = true
            } catch (folderError) {
              if (attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 500 * attempt))
              }
            }
          }
        }

        // Start the linking process
        await forceAddTaskToFolder()

        // Refresh folder data after a short delay but preserve our local task state
        setTimeout(async () => {
          try {
            const refreshedFolder = await foldersApi.getFolder(currentFolder.id)

            // If the refreshed folder is missing tasks or has fewer tasks than we have locally,
            // preserve our local task state
            if (
              !refreshedFolder.tasks ||
              refreshedFolder.tasks.length < updatedFolder.tasks.length
            ) {
              refreshedFolder.tasks = [...updatedFolder.tasks]
            }

            // Same for items
            const refreshedTaskItems = (refreshedFolder.items || []).filter(
              item => item.type === 'task'
            )
            const localTaskItems = updatedFolder.items.filter(
              item => item.type === 'task'
            )

            if (refreshedTaskItems.length < localTaskItems.length) {
              // Preserve all existing items that are not tasks
              const nonTaskItems = (refreshedFolder.items || []).filter(
                item => item.type !== 'task'
              )
              // Combine with local tasks
              refreshedFolder.items = [...nonTaskItems, ...localTaskItems]
            }

            setCurrentFolder(refreshedFolder)
          } catch (refreshError) {
            // Silent error handling
          } finally {
            setIsLoading(false) // Make sure loading state ends
          }
        }, 1000)
      } catch (taskCreateError) {
        setError(
          `Failed to create task: ${
            taskCreateError.message || 'API error'
          }. Please try again.`
        )
        setIsLoading(false) // Make sure loading state ends on error
      }
    } catch (error) {
      setError('Failed to create task. Please try again.')
      setIsLoading(false)
    }
  }

  // Delete a folder
  const deleteFolder = async (folderId: string) => {
    try {
      await foldersApi.deleteFolder(folderId)

      if (currentFolder) {
        // If we're in a folder, refresh the current folder
        const updatedFolder = await foldersApi.getFolder(currentFolder.id)
        setCurrentFolder(updatedFolder)
      } else {
        // If we're at the root, refresh all folders
        const updatedFolders = await foldersApi.getFolders()
        setFolders(updatedFolders)
      }
    } catch (err) {
      setError('Failed to delete folder. Please try again later.')
    }
  }

  // Add a refresh button to the explorer
  const addErrorRecovery = () => {
    // Add a refresh button to the explorer
    const refreshExplorer = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (currentFolder) {
          const updatedFolder = await foldersApi.getFolder(currentFolder.id)
          setCurrentFolder(updatedFolder)
        } else {
          const updatedFolders = await foldersApi.getFolders()
          setFolders(updatedFolders)
        }
      } catch (err) {
        setError('Failed to refresh explorer. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    // Return only the refresh button component
    return (
      <button
        onClick={refreshExplorer}
        className="explorer-button primary"
        title="Refresh folder contents"
      >
        <i className="fas fa-sync-alt"></i> Refresh
      </button>
    )
  }

  // Helper function to combine tasks from all possible sources
  const getCurrentFolderTasks = () => {
    if (!currentFolder) return []

    let allTasks: any[] = []

    // Check items array - highly important for tasks
    if (Array.isArray(currentFolder.items)) {
      const itemsTasks = currentFolder.items.filter(
        item => item.type === 'task'
      )
      allTasks.push(...itemsTasks)
    }

    // Check tasks array - also critically important
    if (Array.isArray(currentFolder.tasks)) {
      // Check that folderId of task matches current folder
      const folderTasks = currentFolder.tasks.filter((task: any) => {
        const taskFolderId = task.folderId || task.folder_id || ''
        // In empty folder allow all tasks as they were just created
        return (
          !taskFolderId || String(taskFolderId) === String(currentFolder.id)
        )
      })

      allTasks.push(
        ...folderTasks.map((task: any) => ({
          id: `task-${task.id}`,
          type: 'task',
          reference: String(task.id),
          ...task,
        }))
      )
    }

    // Remove duplicates
    const uniqueTasks = allTasks.filter((task, index, self) => {
      return (
        index ===
        self.findIndex(
          t =>
            (t.id && task.id && String(t.id) === String(task.id)) ||
            (t.reference && task.reference && t.reference === task.reference)
        )
      )
    })

    return uniqueTasks
  }

  return (
    <div className="explorer-container">
      <div className="explorer-header">
        <h2>
          {isLoading
            ? 'Loading...'
            : currentFolder
            ? currentFolder.name
            : 'Explorer'}
        </h2>
        <div className="explorer-actions">
          {addErrorRecovery()} {/* Add refresh button */}
          <button
            onClick={() => setIsCreateFolderModalOpen(true)}
            className="explorer-button primary"
          >
            <i className="fas fa-folder-plus"></i> New Folder
          </button>
          {currentFolder && (
            <>
              <button
                onClick={() => setIsCreateNoteModalOpen(true)}
                className="explorer-button primary"
              >
                <i className="fas fa-sticky-note"></i> New Note
              </button>
              <button
                onClick={() => setIsCreateTaskModalOpen(true)}
                className="explorer-button primary"
              >
                <i className="fas fa-tasks"></i> New Task
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="explorer-error">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="explorer-button secondary"
          >
            Reload Application
          </button>
        </div>
      )}

      <div className="explorer-breadcrumb">
        {currentFolder && (
          <button
            onClick={() => navigateUp()}
            className="breadcrumb-up-button"
            title="Go to parent folder"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
        <FolderBreadcrumb
          folderPath={folderPath}
          onNavigate={navigateToFolder}
        />
      </div>

      <div className="explorer-content">
        {isLoading ? (
          <div className="explorer-loading">
            <i className="fas fa-spinner fa-spin"></i> Loading...
          </div>
        ) : (
          <div className="content-sections">
            {/* Folders Section */}
            <div className="explorer-section folders-section">
              <div className="section-header">
                <h3>
                  <i className="fas fa-folder"></i> Folders
                </h3>
                <button
                  onClick={() => setIsCreateFolderModalOpen(true)}
                  className="section-button"
                >
                  <i className="fas fa-plus"></i> Add
                </button>
              </div>
              <FolderView
                folders={
                  currentFolder ? currentFolder.subfolders || [] : folders
                }
                currentFolder={currentFolder}
                onFolderClick={navigateToFolder}
                onDeleteFolder={deleteFolder}
              />
            </div>

            {/* Notes Section - Only show when inside a folder */}
            {currentFolder && (
              <div className="explorer-section notes-section">
                <div className="section-header">
                  <h3>
                    <i className="fas fa-sticky-note"></i> Notes
                  </h3>
                  <button
                    onClick={() => setIsCreateNoteModalOpen(true)}
                    className="section-button"
                  >
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>
                <NotesView
                  notes={currentFolder.notes || []}
                  folderId={currentFolder.id}
                />
              </div>
            )}

            {/* Tasks Section - Only show when inside a folder */}
            {currentFolder && (
              <div className="explorer-section tasks-section">
                <div className="section-header">
                  <h3>
                    <i className="fas fa-tasks"></i> Tasks
                  </h3>
                  <button
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="section-button"
                  >
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>
                <TaskList
                  tasks={getCurrentFolderTasks()}
                  folderId={currentFolder.id}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateFolderModalOpen && (
        <CreateFolderModal
          onClose={() => setIsCreateFolderModalOpen(false)}
          onCreateFolder={createFolder}
          parentFolder={currentFolder}
        />
      )}

      {isCreateNoteModalOpen && (
        <CreateNoteModal
          onClose={() => setIsCreateNoteModalOpen(false)}
          onCreateNote={createNote}
          currentFolder={currentFolder}
        />
      )}

      {isCreateTaskModalOpen && (
        <CreateTaskModal
          onClose={() => setIsCreateTaskModalOpen(false)}
          onCreateTask={createTask}
          currentFolder={currentFolder}
        />
      )}
    </div>
  )
}

export default Explorer
