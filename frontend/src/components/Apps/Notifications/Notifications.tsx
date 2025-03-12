"use client"

import { useState, useEffect } from "react"
import "./Notifications.css"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  createdAt: Date
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const savedNotifications = localStorage.getItem("notifications")
    return savedNotifications
      ? JSON.parse(savedNotifications)
      : [
          {
            id: "1",
            title: "Добро пожаловать",
            message: "Добро пожаловать в систему управления задачами!",
            type: "info",
            read: false,
            createdAt: new Date(),
          },
          {
            id: "2",
            title: "Новая функция",
            message: "Теперь вы можете изменять тему и обои в настройках.",
            type: "success",
            read: false,
            createdAt: new Date(Date.now() - 3600000),
          },
        ]
  })

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications))
  }, [notifications])

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter((notification) => notification.id !== notificationId))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffMs = now.getTime() - notificationDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} мин. назад`
    } else if (diffHours < 24) {
      return `${diffHours} ч. назад`
    } else if (diffDays < 7) {
      return `${diffDays} д. назад`
    } else {
      return notificationDate.toLocaleDateString("ru-RU")
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "info":
        return "info-circle"
      case "success":
        return "check-circle"
      case "warning":
        return "exclamation-triangle"
      case "error":
        return "times-circle"
      default:
        return "bell"
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <div className="notifications">
      <div className="notifications-header">
        <h2>Уведомления</h2>
        <div className="notifications-actions">
          {unreadCount > 0 && (
            <button className="notifications-action-button" onClick={handleMarkAllAsRead}>
              Отметить все как прочитанные
            </button>
          )}
          {notifications.length > 0 && (
            <button className="notifications-action-button notifications-action-button-clear" onClick={handleClearAll}>
              Очистить все
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="notifications-empty">
          <i className="fas fa-bell-slash"></i>
          <p>Нет уведомлений</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item notification-${notification.type} ${notification.read ? "notification-read" : ""}`}
            >
              <div className="notification-icon">
                <i className={`fas fa-${getNotificationIcon(notification.type)}`}></i>
              </div>

              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">{formatDate(notification.createdAt)}</div>
              </div>

              <div className="notification-actions">
                {!notification.read && (
                  <button
                    className="notification-action-button"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Отметить как прочитанное"
                  >
                    <i className="fas fa-check"></i>
                  </button>
                )}
                <button
                  className="notification-action-button notification-action-button-delete"
                  onClick={() => handleDeleteNotification(notification.id)}
                  title="Удалить"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications

