import { useEffect, useRef } from 'react'
import styles from '../styles/ContextMenu.module.css'

interface ContextMenuProps {
  x: number
  y: number
  isOpen: boolean
  onClose: () => void
  onCreateFolder: () => void
  onCreateNote: () => void
  onCreateTask: () => void
  onSearch?: () => void
}

const ContextMenu = ({
  x,
  y,
  isOpen,
  onClose,
  onCreateFolder,
  onCreateNote,
  onCreateTask,
  onSearch,
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className={styles.menuItem} onClick={onCreateFolder}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 7v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2h-6l-2-2H5c-1.1 0-2 .9-2 2z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        Создать папку
      </div>
      <div className={styles.menuItem} onClick={onCreateNote}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        Создать заметку
      </div>
      <div className={styles.menuItem} onClick={onCreateTask}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        Создать задачу
      </div>
      {onSearch && (
        <>
          <div className={styles.divider} />
          <div className={styles.menuItem} onClick={onSearch}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            Поиск
          </div>
        </>
      )}
    </div>
  )
}

export default ContextMenu
