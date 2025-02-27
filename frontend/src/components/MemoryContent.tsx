import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { memoryService } from '../api/memory'
import styles from '../styles/Memory.module.css'
import { IFolder, INote, ITask } from '../types'
import ContextMenu from './ContextMenu'
import Loader from './Loader'
import MemoryWidget from './MemoryWidget'
import { Modal } from './Modal'

interface MemoryContentProps {
  folderId?: number | null // null для основной страницы Memory, число для папок
  onNavigate?: (path: string) => void // Для управления URL без перезагрузки
  setIsLoading?: (isLoading: boolean) => void // Для управления лоадером из родительского компонента
}

const MemoryContent = ({
  folderId,
  onNavigate,
  setIsLoading: setParentIsLoading,
}: MemoryContentProps) => {
  const navigate = useNavigate()
  const [folder, setFolder] = useState<IFolder | null>(null)
  const [childFolders, setChildFolders] = useState<IFolder[]>([])
  const [notes, setNotes] = useState<INote[]>([])
  const [tasks, setTasks] = useState<ITask[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<IFolder[]>([])
  const [contentLoading, setContentLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false) // Для операций, требующих полного экрана загрузки
  const [error, setError] = useState('')
  const [modalType, setModalType] = useState<'folder' | 'note' | 'task' | null>(
    null
  )
  const [editModalType, setEditModalType] = useState<
    'folder' | 'note' | 'task' | null
  >(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [loadingText, setLoadingText] = useState<string>(
    'Загружаем содержимое...'
  )
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true)
  const [isTasksExpanded, setIsTasksExpanded] = useState(true)
  const [isNotesExpanded, setIsNotesExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Context Menu state
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, isOpen: false })

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY, isOpen: true })
  }

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }

  // Filtered items for search
  const filteredFolders = childFolders.filter(
    folder =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folder.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredNotes = notes.filter(
    note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTasks = tasks.filter(
    task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Load content based on whether we're in a folder or on the main page
  useEffect(() => {
    const loadContent = async () => {
      setContentLoading(true)
      setError('')

      try {
        if (folderId !== null && folderId !== undefined) {
          // Load folder content
          console.log('Loading folder with ID:', folderId)

          try {
            const folderData = await memoryService.getFolder(folderId)
            setFolder(folderData)
            // Set temporary breadcrumb
            setBreadcrumbs([folderData])
          } catch (err) {
            console.error('Error loading folder data:', err)
            setError('Ошибка при загрузке данных папки')
            setContentLoading(false)
            return
          }

          // Load breadcrumbs, children, notes, and tasks in parallel
          Promise.allSettled([
            // Breadcrumbs
            memoryService
              .getFolderBreadcrumbs(folderId)
              .then(data => setBreadcrumbs(data || [folder!]))
              .catch(() => console.warn('Failed to load breadcrumbs')),

            // Child Folders
            memoryService
              .getFolderChildren(folderId)
              .then(data => setChildFolders(data || []))
              .catch(() => setChildFolders([])),

            // Notes
            memoryService
              .getFolderNotes(folderId)
              .then(data => setNotes(data || []))
              .catch(() => setNotes([])),

            // Tasks
            memoryService
              .getFolderTasks(folderId)
              .then(data => setTasks(data || []))
              .catch(() => setTasks([])),
          ]).finally(() => setContentLoading(false))
        } else {
          // Load root content for Memory page
          console.log('Loading root memory content')
          setFolder(null)
          setBreadcrumbs([])

          Promise.allSettled([
            memoryService
              .getFolders()
              .then(data => setChildFolders(data || []))
              .catch(() => setChildFolders([])),

            memoryService
              .getNotes()
              .then(data => setNotes(data || []))
              .catch(() => setNotes([])),

            memoryService
              .getTasks()
              .then(data => setTasks(data || []))
              .catch(() => setTasks([])),
          ]).finally(() => setContentLoading(false))
        }
      } catch (err) {
        console.error('Error in loadContent:', err)
        setError('Ошибка при загрузке данных')
        setContentLoading(false)
      }
    }

    loadContent()
  }, [folderId])

  // Create item handler
  const handleCreate = async (data: any) => {
    setIsLoading(true)
    if (setParentIsLoading) setParentIsLoading(true)
    setLoadingText('Создаем новый элемент')

    try {
      // Явно добавляем parentFolderId для всех создаваемых элементов внутри папки
      let itemData

      if (folderId) {
        // Здесь обязательно убедимся что parentFolderId правильно задан
        itemData = {
          ...data,
          parentFolderId: folderId,
        }

        console.log(`Creating item in folder ${folderId}:`, itemData)
      } else {
        itemData = data
      }

      if (modalType === 'folder') {
        await memoryService.createFolder(itemData)
        setIsFoldersExpanded(true)
      } else if (modalType === 'note') {
        await memoryService.createNote(itemData)
        setIsNotesExpanded(true)
      } else if (modalType === 'task') {
        await memoryService.createTask(itemData)
        setIsTasksExpanded(true)
      }

      // Reload current content
      await loadCurrentContent()
      setModalType(null)
    } catch (err) {
      console.error('Error creating item:', err)
      setError('Ошибка при создании')
    } finally {
      setIsLoading(false)
      if (setParentIsLoading) setParentIsLoading(false)
    }
  }

  // Helper to reload content
  const loadCurrentContent = async () => {
    setContentLoading(true)
    setLoadingText('Обновляем содержимое')

    try {
      if (folderId !== null && folderId !== undefined) {
        // Reload folder content
        const [childFoldersData, notesData, tasksData] = await Promise.all([
          memoryService.getFolderChildren(folderId),
          memoryService.getFolderNotes(folderId),
          memoryService.getFolderTasks(folderId),
        ])

        setChildFolders(childFoldersData)
        setNotes(notesData)
        setTasks(tasksData)
      } else {
        // Reload root content
        const [foldersData, notesData, tasksData] = await Promise.all([
          memoryService.getFolders(),
          memoryService.getNotes(),
          memoryService.getTasks(),
        ])

        setChildFolders(foldersData)
        setNotes(notesData)
        setTasks(tasksData)
      }
    } catch (err) {
      console.error('Error reloading data:', err)
      setError('Ошибка при обновлении данных')
    } finally {
      setContentLoading(false)
    }
  }

  // Handle navigating to a folder
  const navigateToFolder = (id: number) => {
    if (onNavigate) {
      // Use the provided navigation function for virtual navigation
      onNavigate(`/folders/${id}`)
    } else {
      // Fall back to normal navigation
      navigate(`/folders/${id}`)
    }
  }

  // Handle navigating through breadcrumbs
  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      if (onNavigate) {
        onNavigate('/memory')
      } else {
        navigate('/memory')
      }
    } else if (breadcrumbs[index]) {
      if (onNavigate) {
        onNavigate(`/folders/${breadcrumbs[index].id}`)
      } else {
        navigate(`/folders/${breadcrumbs[index].id}`)
      }
    }
  }

  // More handlers for edit, delete, toggle task, etc.
  const handleEdit = (item: any, type: 'folder' | 'note' | 'task') => {
    if (type === 'task') {
      const taskItem = { ...item }
      if (taskItem.deadline) {
        const date = new Date(taskItem.deadline)
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')

          taskItem.deadline = `${year}-${month}-${day}`
          taskItem.time = `${hours}:${minutes}`
        }
      }
      setEditingItem(taskItem)
    } else {
      setEditingItem(item)
    }
    setEditModalType(type)
  }

  const handleEditSubmit = async (data: any) => {
    setIsLoading(true)
    setLoadingText('Сохраняем изменения')
    try {
      if (editModalType === 'folder') {
        const folderData = {
          name: data.title,
          description: data.description,
        }
        await memoryService.updateFolder(editingItem.id, folderData)
      } else if (editModalType === 'note') {
        await memoryService.updateNote(editingItem.id, data)
      } else if (editModalType === 'task') {
        const taskData = {
          ...data,
          deadline: data.deadline || editingItem.deadline,
        }
        await memoryService.updateTask(editingItem.id, taskData)
      }
      await loadCurrentContent()
      setEditModalType(null)
      setEditingItem(null)
    } catch (err) {
      console.error('Error updating item:', err)
      setError('Ошибка при обновлении')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (type: string, id: number) => {
    setIsLoading(true)
    setLoadingText('Удаляем элемент')
    try {
      if (type === 'folder') {
        await memoryService.deleteFolder(id)
      } else if (type === 'note') {
        await memoryService.deleteNote(id)
      } else if (type === 'task') {
        await memoryService.deleteTask(id)
      }
      await loadCurrentContent()
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Ошибка при удалении')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleTask = async (id: number) => {
    try {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
        )
      )

      await memoryService.toggleTaskComplete(id)
    } catch (err) {
      console.error('Error toggling task:', err)
      setError('Ошибка при обновлении задачи')

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
        )
      )
    }
  }

  const handleSearchOpen = (section?: 'folder' | 'task' | 'note') => {
    setIsSearchOpen(true)
    if (section) {
      switch (section) {
        case 'folder':
          setIsFoldersExpanded(true)
          break
        case 'task':
          setIsTasksExpanded(true)
          break
        case 'note':
          setIsNotesExpanded(true)
          break
      }
    } else {
      setIsFoldersExpanded(true)
      setIsTasksExpanded(true)
      setIsNotesExpanded(true)
    }
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Дата не указана'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Некорректная дата'
      return date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      return 'Ошибка форматирования даты'
    }
  }

  return (
    <div className={styles.mainContent} onContextMenu={handleContextMenu}>
      {isLoading && <Loader text={loadingText} />}

      {/* Navigation Bar with Breadcrumbs */}
      <div className={styles.navigationBar}>
        <button
          className={styles.homeButton}
          onClick={() => navigateToBreadcrumb(-1)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isSearchOpen ? (
          <div className={styles.searchContainer}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className={styles.searchInput}
              autoFocus
            />
            <button
              className={styles.closeSearchButton}
              onClick={() => {
                setIsSearchOpen(false)
                setSearchQuery('')
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div className={styles.breadcrumbs}>
            <span
              className={styles.breadcrumbItem}
              onClick={() => navigateToBreadcrumb(-1)}
            >
              Memory
            </span>
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.id} className={styles.breadcrumbPath}>
                <span className={styles.separator}>/</span>
                <span
                  className={styles.breadcrumbItem}
                  onClick={() => navigateToBreadcrumb(index)}
                >
                  {crumb.name}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Folder Info (only when in a folder) */}
      {folderId !== null && (
        <div className={styles.folderInfo}>
          <h1>{folder?.name || 'Загрузка...'}</h1>
          {folder?.description && (
            <p className={styles.folderDescription}>{folder.description}</p>
          )}
        </div>
      )}

      {/* Folders Section */}
      <div
        className={`${styles.blockHeader} ${
          !isFoldersExpanded ? styles.collapsed : ''
        }`}
      >
        <div className={styles.blockTitle}>
          <button
            className={styles.expandButton}
            onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 6L8 10L12 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <h2>Папки</h2>
          {contentLoading && (
            <small className={styles.loadingText}>загрузка...</small>
          )}
        </div>
        <div className={styles.blockControls}>
          <button
            className={styles.controlButton}
            onClick={() => setModalType('folder')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5V19M5 12H19"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className={styles.controlButton}
            onClick={() => handleSearchOpen('folder')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`${styles.foldersBlock} ${
          !isFoldersExpanded ? styles.hidden : ''
        }`}
      >
        <div className={styles.horizontalGrid}>
          {contentLoading ? (
            <div className={styles.emptyState}>
              <p>Загрузка папок...</p>
            </div>
          ) : filteredFolders.length > 0 ? (
            filteredFolders.map(folder => (
              <MemoryWidget
                key={folder.id}
                type="folder"
                title={folder.name}
                onEdit={() => handleEdit(folder, 'folder')}
                onDelete={() => handleDelete('folder', folder.id)}
                onClick={() => navigateToFolder(folder.id)}
              >
                <div className={styles.taskDescription}>
                  <p>{folder.description}</p>
                </div>
              </MemoryWidget>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>{searchQuery ? 'Папки не найдены' : 'Пока нет папок'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tasks Section */}
      <div
        className={`${styles.blockHeader} ${
          !isTasksExpanded ? styles.collapsed : ''
        }`}
      >
        <div className={styles.blockTitle}>
          <button
            className={styles.expandButton}
            onClick={() => setIsTasksExpanded(!isTasksExpanded)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 6L8 10L12 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <h2>Задачи</h2>
          {contentLoading && (
            <small className={styles.loadingText}>загрузка...</small>
          )}
        </div>
        <div className={styles.blockControls}>
          <button
            className={styles.controlButton}
            onClick={() => setModalType('task')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5V19M5 12H19"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className={styles.controlButton}
            onClick={() => handleSearchOpen('task')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Tasks Content */}
      <div
        className={`${styles.tasksBlock} ${
          !isTasksExpanded ? styles.hidden : ''
        }`}
      >
        <div className={styles.horizontalGrid}>
          {contentLoading ? (
            <div className={styles.emptyState}>
              <p>Загрузка задач...</p>
            </div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <MemoryWidget
                key={task.id}
                type="task"
                title={task.title}
                deadline={formatDate(task.deadline)}
                onEdit={() => handleEdit(task, 'task')}
                onDelete={() => handleDelete('task', task.id)}
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <div className={styles.taskWrapper}>
                  <label className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      onChange={e => {
                        e.stopPropagation()
                        handleToggleTask(task.id)
                      }}
                    />
                    <span className={styles.checkmark}></span>
                  </label>
                  <p
                    className={`${styles.taskDescription} ${
                      task.isCompleted ? styles.completed : ''
                    }`}
                  >
                    {task.description}
                  </p>
                </div>
              </MemoryWidget>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>{searchQuery ? 'Задачи не найдены' : 'Пока нет задач'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div
        className={`${styles.blockHeader} ${
          !isNotesExpanded ? styles.collapsed : ''
        }`}
      >
        <div className={styles.blockTitle}>
          <button
            className={styles.expandButton}
            onClick={() => setIsNotesExpanded(!isNotesExpanded)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 6L8 10L12 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <h2>Заметки</h2>
          {contentLoading && (
            <small className={styles.loadingText}>загрузка...</small>
          )}
        </div>
        <div className={styles.blockControls}>
          <button
            className={styles.controlButton}
            onClick={() => setModalType('note')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5V19M5 12H19"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className={styles.controlButton}
            onClick={() => handleSearchOpen('note')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Notes Content */}
      <div
        className={`${styles.notesBlock} ${
          !isNotesExpanded ? styles.hidden : ''
        }`}
      >
        <div className={styles.horizontalGrid}>
          {contentLoading ? (
            <div className={styles.emptyState}>
              <p>Загрузка заметок...</p>
            </div>
          ) : filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
              <MemoryWidget
                key={note.id}
                type="note"
                title={note.title}
                onEdit={() => handleEdit(note, 'note')}
                onDelete={() => handleDelete('note', note.id)}
                onClick={() => navigate(`/notes/${note.id}`)}
              >
                <div className={styles.noteContent}>
                  <p>{note.content}</p>
                </div>
              </MemoryWidget>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>{searchQuery ? 'Заметки не найдены' : 'Пока нет заметок'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        onSubmit={handleCreate}
        type={modalType || 'folder'}
        mode="create"
      />
      <Modal
        isOpen={editModalType !== null}
        onClose={() => {
          setEditModalType(null)
          setEditingItem(null)
        }}
        onSubmit={handleEditSubmit}
        type={editModalType || 'folder'}
        mode="edit"
        initialData={editingItem}
      />

      {/* Context Menu */}
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.isOpen}
        onClose={closeContextMenu}
        onCreateFolder={() => {
          setModalType('folder')
          closeContextMenu()
        }}
        onCreateNote={() => {
          setModalType('note')
          closeContextMenu()
        }}
        onCreateTask={() => {
          setModalType('task')
          closeContextMenu()
        }}
        onSearch={() => {
          handleSearchOpen()
          closeContextMenu()
        }}
      />
    </div>
  )
}

export default MemoryContent
