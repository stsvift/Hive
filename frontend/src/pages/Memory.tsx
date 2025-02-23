import { useEffect, useState } from 'react'
import { memoryService } from '../api/memory'
import ContextMenu from '../components/ContextMenu'
import HexagonBackground from '../components/HexagonBackground'
import Loader from '../components/Loader'
import MemoryWidget from '../components/MemoryWidget'
import { Modal } from '../components/Modal'
import { useNavigation } from '../context/NavigationContext'
import styles from '../styles/Memory.module.css'
import { IFolder, INote, ITask } from '../types'

const Memory = () => {
  const { setNavVisible } = useNavigation()
  const [folders, setFolders] = useState<IFolder[]>([])
  const [notes, setNotes] = useState<INote[]>([])
  const [tasks, setTasks] = useState<ITask[]>([])
  const [modalType, setModalType] = useState<'folder' | 'note' | 'task' | null>(
    null
  )
  const [editModalType, setEditModalType] = useState<
    'folder' | 'note' | 'task' | null
  >(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(false)
  const [isTasksExpanded, setIsTasksExpanded] = useState(false)
  const [isNotesExpanded, setIsNotesExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [loadingText, setLoadingText] = useState<string>('')

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    isOpen: boolean
  }>({
    x: 0,
    y: 0,
    isOpen: false,
  })

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      isOpen: true,
    })
  }

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }

  const filteredFolders = folders.filter(
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

  useEffect(() => {
    loadData()
    return () => {
      setNavVisible(true)
    }
  }, [setNavVisible])

  const loadData = async () => {
    setIsLoading(true)
    setLoadingText('Загружаем ваши соты')
    setNavVisible(false)
    try {
      const [foldersData, notesData, tasksData] = await Promise.all([
        memoryService.getFolders(),
        memoryService.getNotes(),
        memoryService.getTasks(),
      ])
      setFolders(foldersData)
      setNotes(notesData)
      setTasks(tasksData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Ошибка при загрузке данных')
    } finally {
      setIsLoading(false)
      setNavVisible(true)
    }
  }

  const handleCreate = async (data: any) => {
    setIsLoading(true)
    try {
      if (modalType === 'folder') {
        setLoadingText('Пытаемся создать папку')
        await memoryService.createFolder(data)
      } else if (modalType === 'note') {
        setLoadingText('Пробуем сохранить заметку')
        await memoryService.createNote(data)
      } else if (modalType === 'task') {
        setLoadingText('Записываем в соты вашу задачу :)')
        await memoryService.createTask(data)
      }
      await loadData()
      setModalType(null)
    } catch (err) {
      console.error('Error creating item:', err)
      setError('Ошибка при создании')
    } finally {
      setIsLoading(false)
      setLoadingText('')
    }
  }

  const handleEditSubmit = async (data: any) => {
    setIsLoading(true)
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
      await loadData()
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
    setLoadingText('Сота уничтожается :(')
    try {
      if (type === 'folder') {
        await memoryService.deleteFolder(id)
      } else if (type === 'note') {
        await memoryService.deleteNote(id)
      } else if (type === 'task') {
        await memoryService.deleteTask(id)
      }
      await loadData()
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Ошибка при удалении')
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleToggleTask = async (id: number) => {
    try {
      await memoryService.toggleTaskComplete(id)
      await loadData()
    } catch (err) {
      console.error('Error toggling task:', err)
      setError('Ошибка при обновлении задачи')
    }
  }

  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Дата не указана'

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Некорректная дата'
      }

      return date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Ошибка форматирования даты'
    }
  }

  const handleSearchOpen = (section?: 'folder' | 'task' | 'note') => {
    setIsSearchOpen(true)
    if (section) {
      // Если указана конкретная секция, открываем только её
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

  // Обновляем useEffect для автоматического открытия блоков при поиске
  useEffect(() => {
    if (searchQuery) {
      if (filteredFolders.length > 0) setIsFoldersExpanded(true)
      if (filteredTasks.length > 0) setIsTasksExpanded(true)
      if (filteredNotes.length > 0) setIsNotesExpanded(true)
    }
  }, [
    searchQuery,
    filteredFolders.length,
    filteredTasks.length,
    filteredNotes.length,
  ])

  if (isLoading) {
    return <Loader text={loadingText} />
  }

  return (
    <>
      <HexagonBackground />
      <div className={styles.memoryContainer} onContextMenu={handleContextMenu}>
        {isLoading && <Loader />}
        <div className={styles.header}>
          <span className={styles.title}>Hive</span>
          <span className={styles.memoryTitle}>Memory</span>
          <span className={styles.clock}>{currentTime}</span>
        </div>

        <div className={styles.navigationBar}>
          <button className={styles.homeButton}>
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
            <div className={styles.pathField}>/ Memory</div>
          )}
        </div>

        <div className={styles.mainContent}>
          {error && <div className={styles.error}>{error}</div>}
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
              <button className={styles.controlButton}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 6H21M3 12H21M3 18H21"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
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
              {filteredFolders.map(folder => (
                <MemoryWidget
                  key={folder.id}
                  type="folder"
                  title={folder.name}
                  onEdit={() => handleEdit(folder, 'folder')}
                  onDelete={() => handleDelete('folder', folder.id)}
                >
                  <div className={styles.taskDescription}>
                    <p>{folder.description}</p>
                  </div>
                </MemoryWidget>
              ))}
            </div>
          </div>

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
              <button className={styles.controlButton}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 6H21M3 12H21M3 18H21"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
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

          <div
            className={`${styles.tasksBlock} ${
              !isTasksExpanded ? styles.hidden : ''
            }`}
          >
            <div className={styles.horizontalGrid}>
              {filteredTasks.map(task => (
                <MemoryWidget
                  key={task.id}
                  type="task"
                  title={task.title}
                  deadline={formatDate(task.deadline)}
                  onEdit={() => handleEdit(task, 'task')}
                  onDelete={() => handleDelete('task', task.id)}
                >
                  <div className={styles.taskWrapper}>
                    <label className={styles.checkboxContainer}>
                      <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => handleToggleTask(task.id)}
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
              ))}
            </div>
          </div>

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
              <button className={styles.controlButton}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 6H21M3 12H21M3 18H21"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
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

          <div
            className={`${styles.notesBlock} ${
              !isNotesExpanded ? styles.hidden : ''
            }`}
          >
            <div className={styles.horizontalGrid}>
              {filteredNotes.map(note => (
                <MemoryWidget
                  key={note.id}
                  type="note"
                  title={note.title}
                  onEdit={() => handleEdit(note, 'note')}
                  onDelete={() => handleDelete('note', note.id)}
                >
                  <div className={styles.noteContent}>
                    <p>{note.content}</p>
                  </div>
                </MemoryWidget>
              ))}
            </div>
          </div>

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
        </div>
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
    </>
  )
}

export default Memory
