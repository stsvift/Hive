import { useEffect, useRef, useState } from 'react'
import styles from '../styles/DropdownMenu.module.css'

interface DropdownMenuItem {
  icon?: React.ReactNode
  label: string
  onClick: () => void
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownMenuItem[]
  triggerClassName?: string
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  triggerClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleItemClick = (callback: () => void) => {
    callback()
    setIsOpen(false)
  }

  return (
    <div className={styles.dropdownContainer}>
      <button
        ref={triggerRef}
        className={`${styles.dropdownTrigger} ${triggerClassName}`}
        onClick={toggleMenu}
      >
        {trigger}
      </button>
      {isOpen && (
        <div className={styles.dropdownMenu} ref={menuRef}>
          {items.map((item, index) => (
            <button
              key={index}
              className={styles.dropdownItem}
              onClick={() => handleItemClick(item.onClick)}
            >
              {item.icon && (
                <span className={styles.itemIcon}>{item.icon}</span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default DropdownMenu
