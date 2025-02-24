import { FC } from 'react'
import styles from '../styles/Widget.module.css'
import { MemoryWidgetProps } from '../types'

const MemoryWidget: FC<MemoryWidgetProps> = ({
  type,
  title,
  children,
  onEdit,
  onDelete,
  deadline,
  onClick,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.className.includes('checkboxContainer') ||
      target.className.includes('checkmark')
    ) {
      return
    }
    onClick?.()
  }

  return (
    <div
      className={`${styles.widget} ${styles[type]} ${
        onClick ? styles.clickable : ''
      }`}
      onClick={handleClick}
    >
      <div className={styles.widgetHeader}>
        <h3>{title}</h3>
        <div className={styles.controls}>
          {onEdit && (
            <button
              onClick={e => {
                e.stopPropagation()
                onEdit()
              }}
              className={styles.editButton}
            >
              Изменить
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => {
                e.stopPropagation()
                onDelete()
              }}
              className={styles.deleteButton}
            >
              Удалить
            </button>
          )}
        </div>
      </div>
      {deadline && <div className={styles.deadline}>{deadline}</div>}
      <div className={styles.widgetContent}>{children}</div>
    </div>
  )
}

export default MemoryWidget
