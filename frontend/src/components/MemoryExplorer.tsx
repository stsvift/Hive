import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { memoryService } from '../api/memory'
import styles from '../styles/MemoryExplorer.module.css'
import { IFolder } from '../types'
import DropdownMenu from './DropdownMenu'
import Loader from './Loader'
import LoadingError from './LoadingError'
import { Modal } from './Modal'
import ConfirmDialog from './ConfirmDialog'

interface MemoryExplorerProps {
  folderId?: number | null
  setIsLoading?: (isLoading: boolean) => void
}

type MemoryItem = {
  id: number
  type: 'folder' | 'note' | 'task'
  name: string
  description?: string
  isCompleted?: boolean
  deadline?: string
  parentFolderId?: number | null
  createdAt?: string
}

const MemoryExplorer = ({
  folderId,
  setIsLoading: setParentIsLoading,
}: MemoryExplorerProps) => {
  const navigate = useNavigate()
  const [currentFolder, setCurrentFolder] = useState<IFolder | null>(null)
  const [items, setItems] = useState<MemoryItem[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<IFolder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [contentLoading, setContentLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'date'>('type')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [modalType, setModalType] = useState<'folder' | 'note' | 'task' | null>(
    null
  )
  const [editModalType, setEditModalType] = useState<
    'folder' | 'note' | 'task' | null
  >(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [loadingText, setLoadingText] = useState('Загружаем содержимое...')
  const [contextMenu, setContextMenu] = useState({
    x: 0,
    y: 0,
    isOpen: false,
    itemId: null as number | null,
    itemType: null as 'folder' | 'note' | 'task' | null,
  })
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Добавляем историю навигации
  const [navigationHistory, setNavigationHistory] = useState<number[]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)

  // Обновляем историю при изменении папки
  useEffect(() => {
    if (folderId !== undefined && folderId !== null) {
      setNavigationHistory(prev => {
        const newHistory = prev.slice(0, currentHistoryIndex + 1)
        return [...newHistory, folderId]
      })
      setCurrentHistoryIndex(prev => prev + 1)
    }
  }, [folderId])

  // Функции навигации
  const handleBack = () => {
    if (currentHistoryIndex > 0) {
      const prevFolderId = navigationHistory[currentHistoryIndex - 1]
      setCurrentHistoryIndex(prev => prev - 1)
      navigate(`/folders/${prevFolderId}`)
    } else {
      navigate('/memory')
    }
  }

  const handleForward = () => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      const nextFolderId = navigationHistory[currentHistoryIndex + 1]
      setCurrentHistoryIndex(prev => prev + 1)
      navigate(`/folders/${nextFolderId}`)
    }
  }

  useEffect(() => {
    const loadContent = async () => {
      setContentLoading(true)
      setError('')

      try {
        if (folderId !== null && folderId !== undefined) {
          // First, try to load the folder itself
          let folderData
          try {
            folderData = await memoryService.getFolder(folderId)
            setCurrentFolder(folderData)
          } catch (err: any) {
            console.error('Error loading folder:', err)
            if (err.response?.status === 404) {
              setError('Папка не найдена')
            } else {
              setError('Ошибка при загрузке папки')
            }
            setContentLoading(false)
            return
          }

          // Load folder contents in parallel
          try {
            const [folders, notes, tasks] = await Promise.all([
              memoryService.getFolderChildren(folderId).catch(() => []),
              memoryService.getFolderNotes(folderId).catch(() => []),
              memoryService.getFolderTasks(folderId).catch(() => [])
            ])

            const allItems: MemoryItem[] = [
              ...folders.map(folder => ({
                id: folder.id,
                type: 'folder' as const,
                name: folder.name,
                description: folder.description,
                parentFolderId: folder.parentFolderId,
                createdAt: folder.createdAt,
              })),
              ...notes.map(note => ({
                id: note.id,
                type: 'note' as const,
                name: note.title,
                description: note.content,
                parentFolderId: note.parentFolderId,
                createdAt: note.createdAt,
              })),
              ...tasks.map(task => ({
                id: task.id,
                type: 'task' as const,
                name: task.title,
                description: task.description,
                isCompleted: task.isCompleted,
                deadline: task.deadline,
                parentFolderId: task.parentFolderId,
                createdAt: task.createdAt,
              }))
            ]

            setItems(allItems)
          } catch (err) {
            console.error('Error loading folder contents:', err)
            setError('Ошибка при загрузке содержимого папки')
          }
        } else {
          // Load root content
          setCurrentFolder(null)
          setBreadcrumbs([])

          const [folders, notes, tasks] = await Promise.all([
            memoryService.getFolders(),
            memoryService.getNotes(),
            memoryService.getTasks(),
          ])

          const rootItems: MemoryItem[] = [
            ...folders.map(folder => ({
              id: folder.id,
              type: 'folder' as const,
              name: folder.name,
              description: folder.description,
              parentFolderId: folder.parentFolderId,
              createdAt: folder.createdAt,
            })),
            ...notes.map(note => ({
              id: note.id,
              type: 'note' as const,
              name: note.title,
              description: note.content,
              parentFolderId: note.parentFolderId,
              createdAt: note.createdAt,
            })),
            ...tasks.map(task => ({
              id: task.id,
              type: 'task' as const,
              name: task.title,
              description: task.description,
              isCompleted: task.isCompleted,
              deadline: task.deadline,
              parentFolderId: task.parentFolderId,
              createdAt: task.createdAt,
            })),
          ]

          setItems(rootItems)
        }
      } catch (err) {
        console.error('Error in loadContent:', err)
        setError('Ошибка при загрузке данных')
      } finally {
        setContentLoading(false)
      }
    }

    loadContent()
  }, [folderId])

  const sortItems = (items: MemoryItem[]) => {
    return [...items].sort((a, b) => {
      if (sortBy === 'type') {
        // Sort by type first (folders, then tasks, then notes)
        const typeOrder = { folder: 0, task: 1, note: 2 }
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return sortOrder === 'asc'
            ? typeOrder[a.type] - typeOrder[b.type]
            : typeOrder[b.type] - typeOrder[a.type]
        }
      }

      // Then by the selected sort field
      if (sortBy === 'date' && a.createdAt && b.createdAt) {
        return sortOrder === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }

      // Default sort by name
      return sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    })
  }

  const filteredItems = items.filter(item => {
    const nameMatch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const descMatch = item.description
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
    return nameMatch || descMatch
  })

  const sortedItems = sortItems(filteredItems)

  const handleContextMenu = (e: React.MouseEvent, item?: MemoryItem) => {
    e.preventDefault()
    if (item) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        isOpen: true,
        itemId: item.id,
        itemType: item.type,
      })
    } else {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        isOpen: true,
        itemId: null,
        itemType: null,
      })
    }
  }

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))
  }

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      navigate('/memory')
    } else if (breadcrumbs[index]) {
      navigate(`/folders/${breadcrumbs[index].id}`)
    }
  }

  const handleItemClick = (item: MemoryItem) => {
    if (item.type === 'folder') {
      // Для папок
      setContentLoading(true) // Показываем загрузку
      navigate(`/folders/${item.id}`) // Навигация к папке
    } else if (item.type === 'note') {
      // Для заметок
      navigate(`/notes/${item.id}`)
    } else if (item.type === 'task') {
      // Для задач
      navigate(`/tasks/${item.id}`)
    }
  }

  // Улучшим обработку клика на строку таблицы
  const handleRowClick = (e: React.MouseEvent, item: MemoryItem) => {
    // Игнорируем клик, если он был на кнопках действий
    if ((e.target as HTMLElement).closest(`.${styles.fileActions}`)) {
      return
    }
    handleItemClick(item)
  }

  const handleSearchToggle = () => {
    setIsSearchOpen(prev => !prev)
    if (isSearchOpen) {
      setSearchQuery('')
    }
  }

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'folder' | 'note' | 'task';
    id: number;
    contentsCount?: { notesCount: number; tasksCount: number; subFoldersCount: number };
  }>({ isOpen: false, type: 'folder', id: 0 });

  const handleDelete = async (type: 'folder' | 'note' | 'task', id: number) => {
    if (type === 'folder') {
      try {
        const contents = await memoryService.getFolderContentsCount(id);
        const hasContents = contents.notesCount > 0 || contents.tasksCount > 0 || contents.subFoldersCount > 0;
        
        if (hasContents) {
          setDeleteConfirmation({ isOpen: true, type, id, contentsCount: contents });
          return;
        }
      } catch (err) {
        console.error('Error checking folder contents:', err);
      }
    }
    
    await performDelete(type, id);
  };

  const performDelete = async (type: 'folder' | 'note' | 'task', id: number) => {
    setIsLoading(true);
    if (setParentIsLoading) setParentIsLoading(true);
    setLoadingText('Удаляем элемент');

    try {
      switch (type) {
        case 'folder':
          await memoryService.deleteFolder(id);
          break;
        case 'note':
          await memoryService.deleteNote(id);
          break;
        case 'task':
          await memoryService.deleteTask(id);
          break;
      }

      setItems(prev => prev.filter(item => !(item.id === id && item.type === type)));
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Ошибка при удалении');
    } finally {
      setIsLoading(false);
      if (setParentIsLoading) setParentIsLoading(false);
    }
  };

  const handleEdit = (item: MemoryItem) => {
    let editData

    switch (item.type) {
      case 'folder':
        editData = {
          id: item.id,
          name: item.name, // Изменено с title на name
          description: item.description || '',
        }
        break
      case 'note':
        editData = {
          id: item.id,
          title: item.name,
          content: item.description || '',
        }
        break
      case 'task':
        editData = {
          id: item.id,
          title: item.name,
          description: item.description || '',
          isCompleted: item.isCompleted || false,
        }

        if (item.deadline) {
          const date = new Date(item.deadline)
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')

            editData.deadline = `${year}-${month}-${day}`
            editData.time = `${hours}:${minutes}`
          }
        }
        break
    }

    setEditingItem(editData)
    setEditModalType(item.type)
  }

  const handleEditSubmit = async (data: any) => {
    setIsLoading(true)
    if (setParentIsLoading) setParentIsLoading(true)
    setLoadingText('Сохраняем изменения')

    try {
      if (editModalType === 'folder') {
        const folderData = {
          name: data.name, // Изменено с data.title на data.name
          description: data.description,
        }
        await memoryService.updateFolder(editingItem.id, folderData)

        // Update local state
        setItems(prev =>
          prev.map(item =>
            item.id === editingItem.id && item.type === 'folder'
              ? { ...item, name: data.name, description: data.description } // Изменено с data.title на data.name
              : item
          )
        )
      } else if (editModalType === 'note') {
        await memoryService.updateNote(editingItem.id, data)

        // Update local state
        setItems(prev =>
          prev.map(item =>
            item.id === editingItem.id && item.type === 'note'
              ? { ...item, name: data.title, description: data.content }
              : item
          )
        )
      } else if (editModalType === 'task') {
        const taskData = {
          ...data,
          deadline: data.deadline || editingItem.deadline,
        }
        await memoryService.updateTask(editingItem.id, taskData)

        // Update local state
        setItems(prev =>
          prev.map(item =>
            item.id === editingItem.id && item.type === 'task'
              ? {
                  ...item,
                  name: data.title,
                  description: data.description,
                  deadline: data.deadline,
                  isCompleted: data.isCompleted,
                }
              : item
          )
        )
      }

      setEditModalType(null)
      setEditingItem(null)
    } catch (err) {
      console.error('Error updating item:', err)
      setError('Ошибка при обновлении')
    } finally {
      setIsLoading(false)
      if (setParentIsLoading) setParentIsLoading(false)
    }
  }

  const handleCreate = async (data: any) => {
    setIsLoading(true)
    if (setParentIsLoading) setParentIsLoading(true)
    setLoadingText('Создаем новый элемент')

    try {
      let newItem: MemoryItem | null = null

      const itemData = {
        ...data,
        parentFolderId: folderId || null,
        folderId: folderId || null, // Явно указываем folderId
      }

      if (modalType === 'folder') {
        const response = await memoryService.createFolder(itemData)
        newItem = {
          id: response.id,
          type: 'folder',
          name: itemData.name,
          description: itemData.description,
          parentFolderId: folderId || null,
          createdAt: new Date().toISOString(),
        }
      } else if (modalType === 'note') {
        const response = await memoryService.createNote(itemData)
        newItem = {
          id: response.id,
          type: 'note',
          name: itemData.title,
          description: itemData.content,
          parentFolderId: folderId || null,
          createdAt: new Date().toISOString(),
        }
      } else if (modalType === 'task') {
        const response = await memoryService.createTask(itemData)
        newItem = {
          id: response.id,
          type: 'task',
          name: itemData.title,
          description: itemData.description,
          isCompleted: false,
          deadline: itemData.deadline,
          parentFolderId: folderId || null,
          createdAt: new Date().toISOString(),
        }
      }

      if (newItem) {
        setItems(prev => [...prev, newItem!])
      }

      setModalType(null)
    } catch (err) {
      console.error('Error creating item:', err)
      setError('Ошибка при создании')
    } finally {
      setIsLoading(false)
      if (setParentIsLoading) setParentIsLoading(false)
    }
  }

  const handleToggleTask = async (id: number) => {
    try {
      // Optimistically update UI
      setItems(prev =>
        prev.map(item =>
          item.id === id && item.type === 'task'
            ? { ...item, isCompleted: !item.isCompleted }
            : item
        )
      )

      await memoryService.toggleTaskComplete(id)
    } catch (err) {
      console.error('Error toggling task:', err)
      setError('Ошибка при обновлении задачи')

      // Revert on error
      setItems(prev =>
        prev.map(item =>
          item.id === id && item.type === 'task'
            ? { ...item, isCompleted: !item.isCompleted }
            : item
        )
      )
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return '📁'
      case 'note':
        return '📝'
      case 'task':
        return '📋'
      default:
        return '❓'
    }
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const SkeletonLoader = () => {
    return viewMode === 'list' ? (
      <div className={styles.loadingState}>
        <table className={styles.loadingTable}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>Тип</th>
              <th>Название</th>
              <th style={{ width: '120px' }}>Дата</th>
              <th style={{ width: '100px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, index) => (
              <tr key={index} className={styles.shimmerRow}>
                <td className={styles.shimmerCell}>
                  <div className={styles.shimmerIcon}></div>
                </td>
                <td className={styles.shimmerCell}>
                  <div
                    className={`${styles.shimmer} ${styles.shimmerName}`}
                  ></div>
                </td>
                <td className={styles.shimmerCell}>
                  <div
                    className={`${styles.shimmer} ${styles.shimmerDate}`}
                  ></div>
                </td>
                <td className={styles.shimmerCell}>
                  <div className={styles.shimmerActions}>
                    <div className={styles.shimmerAction}></div>
                    <div className={styles.shimmerAction}></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className={styles.gridViewLoading}>
        {[...Array(12)].map((_, index) => (
          <div key={index} className={styles.gridItemSkeleton}>
            <div className={styles.shimmerGridIcon}></div>
            <div className={styles.shimmerGridContent}>
              <div
                className={`${styles.shimmer} ${styles.shimmerGridName}`}
              ></div>
              <div
                className={`${styles.shimmer} ${styles.shimmerGridDate}`}
              ></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Обновляем секцию с хлебными крошками
  useEffect(() => {
    const loadBreadcrumbs = async () => {
      if (folderId !== null && folderId !== undefined) {
        try {
          const breadcrumbsData = await memoryService.getFolderBreadcrumbs(
            folderId
          )
          setBreadcrumbs(breadcrumbsData || [])
        } catch (err) {
          console.warn('Error loading breadcrumbs:', err)
          if (currentFolder) {
            setBreadcrumbs([currentFolder])
          }
        }
      } else {
        setBreadcrumbs([])
      }
    }

    loadBreadcrumbs()
  }, [folderId, currentFolder])

  return (
    <div
      className={styles.explorerContainer}
      onContextMenu={e => handleContextMenu(e)}
    >
      {isLoading && <Loader text={loadingText} />}

      <div className={styles.explorerHeader}>
        <div className={styles.breadcrumbsContainer}>
          <div className={styles.navigationButtons}>
            <button
              className={`${styles.navButton} ${
                currentHistoryIndex <= 0 ? styles.disabled : ''
              }`}
              onClick={handleBack}
              disabled={currentHistoryIndex <= 0}
              title="Назад"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className={`${styles.navButton} ${
                currentHistoryIndex >= navigationHistory.length - 1
                  ? styles.disabled
                  : ''
              }`}
              onClick={handleForward}
              disabled={currentHistoryIndex >= navigationHistory.length - 1}
              title="Вперед"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
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
          </div>
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
                onClick={handleSearchToggle}
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

        <div className={styles.explorerControls}>
          <button className={styles.controlButton} onClick={handleSearchToggle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <DropdownMenu
            triggerClassName={styles.controlButton}
            trigger={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5V19M5 12H19"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            items={[
              {
                icon: '📁',
                label: 'Создать папку',
                onClick: () => setModalType('folder'),
              },
              {
                icon: '📝',
                label: 'Создать заметку',
                onClick: () => setModalType('note'),
              },
              {
                icon: '📋',
                label: 'Создать задачу',
                onClick: () => setModalType('task'),
              },
            ]}
          />
        </div>
      </div>

      {error && (
        <LoadingError
          message={error}
          onRetry={() => {
            setError('')
            setContentLoading(true)
            // Re-trigger the useEffect by updating a dependency
            setFolderId(prev => (prev === null ? null : prev))
          }}
        />
      )}

      <div className={styles.explorerToolbar}>
        <div className={styles.sortControls}>
          <span>Сортировать:</span>
          <button
            className={`${styles.sortButton} ${
              sortBy === 'type' ? styles.active : ''
            }`}
            onClick={() => {
              setSortBy('type')
              if (sortBy === 'type')
                setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
            }}
          >
            Тип {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`${styles.sortButton} ${
              sortBy === 'name' ? styles.active : ''
            }`}
            onClick={() => {
              setSortBy('name')
              if (sortBy === 'name')
                setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
            }}
          >
            Имя {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`${styles.sortButton} ${
              sortBy === 'date' ? styles.active : ''
            }`}
            onClick={() => {
              setSortBy('date')
              if (sortBy === 'date')
                setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
            }}
          >
            Дата {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>

        <div className={styles.viewControls}>
          <button
            className={`${styles.viewButton} ${
              viewMode === 'list' ? styles.active : ''
            }`}
            onClick={() => setViewMode('list')}
            title="Список"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 3H7V7H3V3ZM11 3H15V7H11V3ZM3 11H7V15H3V11ZM11 11H15V15H11V11Z"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </button>
          <button
            className={`${styles.viewButton} ${
              viewMode === 'grid' ? styles.active : ''
            }`}
            onClick={() => setViewMode('grid')}
            title="Сетка"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 3H7V7H3V3ZM11 3H15V7H11V3ZM3 11H7V15H3V11ZM11 11H15V15H11V11Z"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.explorerContent}>
        {contentLoading ? (
          <SkeletonLoader />
        ) : sortedItems.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{searchQuery ? 'Ничего не найдено' : 'Это место пока пусто'}</p>
            <div className={styles.emptyActions}>
              <button onClick={() => setModalType('folder')}>
                Создать папку
              </button>
              <button onClick={() => setModalType('note')}>
                Создать заметку
              </button>
              <button onClick={() => setModalType('task')}>
                Создать задачу
              </button>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <table className={`${styles.fileTable} ${styles.fadeIn}`}>
            <thead>
              <tr>
                <th>Тип</th>
                <th>Название</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map(item => (
                <tr
                  key={`${item.type}-${item.id}`}
                  className={`${styles.fileRow} ${
                    item.type === 'folder' ? styles.folderRow : ''
                  }`}
                  onClick={e => handleRowClick(e, item)}
                  onContextMenu={e => handleContextMenu(e, item)}
                >
                  <td className={styles.fileIcon}>
                    <span>{getTypeIcon(item.type)}</span>
                    {item.type === 'task' && item.isCompleted && (
                      <span className={styles.completedBadge}>✓</span>
                    )}
                  </td>
                  <td className={styles.fileName}>
                    <span
                      className={
                        item.type === 'task' && item.isCompleted
                          ? styles.completedText
                          : ''
                      }
                    >
                      {item.name}
                    </span>
                  </td>
                  <td className={styles.fileDate}>
                    {formatDate(item.createdAt)}
                  </td>
                  <td
                    className={styles.fileActions}
                    onClick={e => e.stopPropagation()}
                  >
                    {item.type === 'task' && (
                      <button
                        className={`${styles.actionButton} ${
                          item.isCompleted ? styles.completedAction : ''
                        }`}
                        onClick={e => {
                          e.stopPropagation()
                          handleToggleTask(item.id)
                        }}
                        title={
                          item.isCompleted
                            ? 'Отметить как невыполненное'
                            : 'Отметить как выполненное'
                        }
                      >
                        {item.isCompleted ? '✓' : '○'}
                      </button>
                    )}
                    <button
                      className={styles.actionButton}
                      onClick={e => {
                        e.stopPropagation()
                        handleEdit(item)
                      }}
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={e => {
                        e.stopPropagation()
                        handleDelete(item.type, item.id)
                      }}
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={`${styles.gridView} ${styles.fadeIn}`}>
            {sortedItems.map(item => (
              <div
                key={`${item.type}-${item.id}`}
                className={`${styles.gridItem} ${
                  item.type === 'folder' ? styles.folderItem : ''
                }`}
                onClick={e => handleRowClick(e, item)}
                onContextMenu={e => handleContextMenu(e, item)}
              >
                <div className={styles.gridItemIcon}>
                  <span className={styles.typeIcon}>
                    {getTypeIcon(item.type)}
                  </span>
                  {item.type === 'task' && item.isCompleted && (
                    <span className={styles.gridCompletedBadge}>✓</span>
                  )}
                </div>
                <div className={styles.gridItemContent}>
                  <div className={styles.gridItemName}>
                    <span
                      className={
                        item.type === 'task' && item.isCompleted
                          ? styles.completedText
                          : ''
                      }
                    >
                      {item.name}
                    </span>
                  </div>
                  <div className={styles.gridItemDate}>
                    {formatDate(item.createdAt)}
                  </div>
                </div>
                <div
                  className={styles.gridItemActions}
                  onClick={e => e.stopPropagation()}
                >
                  {item.type === 'task' && (
                    <button
                      className={`${styles.actionButton} ${
                        item.isCompleted ? styles.completedAction : ''
                      }`}
                      onClick={e => {
                        e.stopPropagation()
                        handleToggleTask(item.id)
                      }}
                      title={
                        item.isCompleted
                          ? 'Отметить как невыполненное'
                          : 'Отметить как выполненное'
                      }
                    >
                      {item.isCompleted ? '✓' : '○'}
                    </button>
                  )}
                  <button
                    className={styles.actionButton}
                    onClick={e => {
                      e.stopPropagation()
                      handleEdit(item)
                    }}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(item.type, item.id)
                    }}
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.isOpen && (
        <div
          className={styles.contextMenu}
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.itemId === null ? (
            // Global context menu (background click)
            <>
              <button
                onClick={() => {
                  setModalType('folder')
                  closeContextMenu()
                }}
              >
                📁 Создать папку
              </button>
              <button
                onClick={() => {
                  setModalType('note')
                  closeContextMenu()
                }}
              >
                📝 Создать заметку
              </button>
              <button
                onClick={() => {
                  setModalType('task')
                  closeContextMenu()
                }}
              >
                📋 Создать задачу
              </button>
              <div className={styles.contextMenuDivider}></div>
              <button
                onClick={() => {
                  handleSearchToggle()
                  closeContextMenu()
                }}
              >
                🔍 Поиск
              </button>
            </>
          ) : (
            // Item-specific context menu
            <>
              <button
                onClick={() => {
                  handleItemClick({
                    id: contextMenu.itemId!,
                    type: contextMenu.itemType!,
                    name: '',
                  })
                  closeContextMenu()
                }}
              >
                👁️ Открыть
              </button>
              <button
                onClick={() => {
                  const item = items.find(
                    item =>
                      item.id === contextMenu.itemId &&
                      item.type === contextMenu.itemType
                  )
                  if (item) {
                    handleEdit(item)
                  }
                  closeContextMenu()
                }}
              >
                ✏️ Редактировать
              </button>
              {contextMenu.itemType === 'task' && (
                <button
                  onClick={() => {
                    handleToggleTask(contextMenu.itemId!)
                    closeContextMenu()
                  }}
                >
                  ⭕ Изменить статус
                </button>
              )}
              <div className={styles.contextMenuDivider}></div>
              <button
                className={styles.deleteContextButton}
                onClick={() => {
                  handleDelete(contextMenu.itemType!, contextMenu.itemId!)
                  closeContextMenu()
                }}
              >
                🗑️ Удалить
              </button>
            </>
          )}
        </div>
      )}

      {/* Background overlay to close the context menu when clicking outside */}
      {contextMenu.isOpen && (
        <div className={styles.contextMenuOverlay} onClick={closeContextMenu} />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        onSubmit={handleCreate}
        type={modalType || 'folder'}
        mode="create"
      />

      {/* Edit Modal */}
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

      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title="Подтверждение удаления"
        message={
          deleteConfirmation.contentsCount
            ? `В этой папке содержится:
              ${deleteConfirmation.contentsCount.subFoldersCount} папок,
              ${deleteConfirmation.contentsCount.notesCount} заметок,
              ${deleteConfirmation.contentsCount.tasksCount} задач.
              Все эти элементы будут удалены безвозвратно.`
            : 'Вы уверены, что хотите удалить этот элемент?'
        }
        onConfirm={() => {
          performDelete(deleteConfirmation.type, deleteConfirmation.id);
          setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
        type="danger"
        confirmText="Удалить"
      />
    </div>
  )
}

export default MemoryExplorer
