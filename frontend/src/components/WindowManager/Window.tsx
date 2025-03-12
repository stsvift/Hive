"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useDispatch } from "react-redux"
import {
  closeWindow,
  minimizeWindow,
  maximizeWindow,
  activateWindow,
  moveWindow,
  resizeWindow,
  type WindowState,
  type WindowPosition,
} from "../../store/windowsSlice"
import "./Window.css"

interface WindowProps {
  window: WindowState
  children: React.ReactNode
}

const Window: React.FC<WindowProps> = ({ window: windowData, children }) => {
  const dispatch = useDispatch()
  const windowRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeDirection, setResizeDirection] = useState("")

  const handleMouseDown = () => {
    if (!windowData.isActive) {
      dispatch(activateWindow(windowData.id))
    }
  }

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if (windowData.isMaximized) return

    setIsDragging(true)
    setDragOffset({
      x: e.clientX - windowData.position.x,
      y: e.clientY - windowData.position.y,
    })
  }

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
  }

  useEffect(() => {
    const handleMouseMoveEvent = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition: WindowPosition = {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        }

        dispatch(moveWindow({ id: windowData.id, position: newPosition }))
      }

      if (isResizing && windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect()
        let newWidth = windowData.size.width
        let newHeight = windowData.size.height
        let newX = windowData.position.x
        let newY = windowData.position.y

        if (resizeDirection.includes("e")) {
          newWidth = e.clientX - rect.left
        }
        if (resizeDirection.includes("s")) {
          newHeight = e.clientY - rect.top
        }
        if (resizeDirection.includes("w")) {
          newWidth = rect.right - e.clientX
          newX = e.clientX
        }
        if (resizeDirection.includes("n")) {
          newHeight = rect.bottom - e.clientY
          newY = e.clientY
        }

        // Minimum size constraints
        newWidth = Math.max(newWidth, 300)
        newHeight = Math.max(newHeight, 200)

        if (resizeDirection.includes("w") || resizeDirection.includes("n")) {
          dispatch(moveWindow({ id: windowData.id, position: { x: newX, y: newY } }))
        }

        dispatch(resizeWindow({ id: windowData.id, size: { width: newWidth, height: newHeight } }))
      }
    }

    const handleMouseUpEvent = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      globalThis.window.addEventListener("mousemove", handleMouseMoveEvent)
      globalThis.window.addEventListener("mouseup", handleMouseUpEvent)
    }

    return () => {
      globalThis.window.removeEventListener("mousemove", handleMouseMoveEvent)
      globalThis.window.removeEventListener("mouseup", handleMouseUpEvent)
    }
  }, [isDragging, isResizing, dispatch, dragOffset, resizeDirection, windowData])

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(closeWindow(windowData.id))
  }

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(minimizeWindow(windowData.id))
  }

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(maximizeWindow(windowData.id))
  }

  const getWindowStyle = () => {
    if (windowData.isMaximized) {
      return {
        top: "40px",
        left: "0",
        width: "100%",
        height: "calc(100vh - 40px)",
        transform: "none",
        borderRadius: "0",
      }
    }

    return {
      top: `${windowData.position.y}px`,
      left: `${windowData.position.x}px`,
      width: `${windowData.size.width}px`,
      height: `${windowData.size.height}px`,
      zIndex: windowData.zIndex,
    }
  }

  return (
    <div
      ref={windowRef}
      className={`window ${windowData.isActive ? "window-active" : ""}`}
      style={getWindowStyle()}
      onMouseDown={handleMouseDown}
    >
      <div className="window-titlebar" onMouseDown={handleTitleBarMouseDown} onDoubleClick={handleMaximize}>
        <div className="window-title">{windowData.title}</div>
        <div className="window-controls">
          <button className="window-control window-control-minimize" onClick={handleMinimize}>
            <i className="fas fa-minus"></i>
          </button>
          <button className="window-control window-control-maximize" onClick={handleMaximize}>
            <i className={`fas fa-${windowData.isMaximized ? "compress-alt" : "expand-alt"}`}></i>
          </button>
          <button className="window-control window-control-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div className="window-content">{children}</div>

      {!windowData.isMaximized && (
        <>
          <div className="resize-handle resize-handle-n" onMouseDown={(e) => handleResizeMouseDown(e, "n")}></div>
          <div className="resize-handle resize-handle-e" onMouseDown={(e) => handleResizeMouseDown(e, "e")}></div>
          <div className="resize-handle resize-handle-s" onMouseDown={(e) => handleResizeMouseDown(e, "s")}></div>
          <div className="resize-handle resize-handle-w" onMouseDown={(e) => handleResizeMouseDown(e, "w")}></div>
          <div className="resize-handle resize-handle-ne" onMouseDown={(e) => handleResizeMouseDown(e, "ne")}></div>
          <div className="resize-handle resize-handle-se" onMouseDown={(e) => handleResizeMouseDown(e, "se")}></div>
          <div className="resize-handle resize-handle-sw" onMouseDown={(e) => handleResizeMouseDown(e, "sw")}></div>
          <div className="resize-handle resize-handle-nw" onMouseDown={(e) => handleResizeMouseDown(e, "nw")}></div>
        </>
      )}
    </div>
  )
}

export default Window

