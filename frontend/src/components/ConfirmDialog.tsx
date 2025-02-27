import styles from '../styles/ConfirmDialog.module.css'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
  confirmText?: string
  cancelText?: string
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  type = 'warning',
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
}: ConfirmDialogProps) => {
  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h2 className={`${styles.title} ${styles[type]}`}>{title}</h2>
        <div className={styles.message}>{message}</div>
        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`${styles.button} ${styles.confirmButton} ${
              styles[`${type}Button`]
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog