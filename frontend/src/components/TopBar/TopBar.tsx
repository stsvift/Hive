"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { logout } from "../../store/authSlice"
import type { RootState } from "../../store"
import "./TopBar.css"

const TopBar = () => {
  const [date, setDate] = useState(new Date())
  const [showUserMenu, setShowUserMenu] = useState(false)
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date())
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="topbar-logo">Hive</span>
      </div>
      <div className="topbar-right">
        <div className="topbar-user" onClick={() => setShowUserMenu(!showUserMenu)}>
          <div className="topbar-user-avatar">
            <i className="fas fa-user"></i>
          </div>
          <span className="topbar-username">{user?.username}</span>
          <i className="fas fa-chevron-down"></i>

          {showUserMenu && (
            <div className="topbar-user-menu">
              <div className="topbar-user-menu-header">
                <div className="topbar-user-menu-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div className="topbar-user-menu-info">
                  <div className="topbar-user-menu-name">{user?.username}</div>
                  <div className="topbar-user-menu-email">{user?.email}</div>
                </div>
              </div>
              <div className="topbar-user-menu-divider"></div>
              <button className="topbar-user-menu-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Выйти</span>
              </button>
            </div>
          )}
        </div>

        <div className="topbar-date-time">
          <div className="topbar-time">{formatTime(date)}</div>
          <div className="topbar-date">{formatDate(date)}</div>
        </div>
      </div>
    </div>
  )
}

export default TopBar

