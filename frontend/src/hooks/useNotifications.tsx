import { useState } from 'react'
import {
  Notification as NotificationType,
  NotificationsComponent,
} from '../components/Common/Notifications'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([])

  const addNotification = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])

    // Automatically remove notification after 3 seconds
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
