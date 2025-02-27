import React from 'react'
import styles from '../styles/LoadingError.module.css'

interface LoadingErrorProps {
  message: string
  onRetry?: () => void
}

const LoadingError: React.FC<LoadingErrorProps> = ({ message, onRetry }) => {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
          <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
        </svg>
      </div>
      <div className={styles.errorMessage}>{message}</div>
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  )
}

export default LoadingError
