import React, { useState } from 'react'
import './Notifications.css'

export type NotificationType = 'success' | 'error' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  message: string
}

interface NotificationsProps {
  notifications: Notification[]
  onClose: (id: string) => void
}

export const NotificationsComponent: React.FC<NotificationsProps> = ({
  notifications,
  onClose,
}) => {
  return (
    <div className="notifications-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
        >
          <span className="notification-icon">
            {notification.type === 'success' && (
              <i className="fas fa-check-circle"></i>
            )}
            {notification.type === 'error' && (
              <i className="fas fa-exclamation-circle"></i>
            )}
            {notification.type === 'info' && (
              <i className="fas fa-info-circle"></i>
            )}
          </span>
          <span className="notification-message">{notification.message}</span>
          <button
            className="notification-close"
            onClick={() => onClose(notification.id)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  )
}

// Хук для работы с уведомлениями
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (
    message: string,
    type: NotificationType = 'info'
  ) => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])

    // Автоматически удаляем уведомление через 3 секунды
    setTimeout(() => {
      removeNotification(id)
    }, 3000)

    return id
  }

  const removeNotification = (id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    )
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    notificationsComponent: (
      <NotificationsComponent
        notifications={notifications}
        onClose={removeNotification}
      />
    ),
  }
}

export default NotificationsComponent
