import React, { useEffect, useRef, useState } from 'react'
import './AppWindow.css'

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface AppWindowProps {
  id: string
  title: string
  icon?: string
  children: React.ReactNode
  onClose: () => void
  onMinimize?: () => void
  defaultPosition?: Position
  defaultSize?: Size
  isActive?: boolean
  isMinimized?: boolean
  onFocus?: () => void
  onPositionChange?: (id: string, position: Position) => void
  onSizeChange?: (id: string, size: Size) => void
  dockPosition?: { x: number; y: number } // Add new prop for dock icon position
}

const AppWindow: React.FC<AppWindowProps> = ({
  id,
  title,
  icon = 'window-maximize',
  children,
  onClose,
  onMinimize,
  defaultPosition = { x: 100, y: 80 },
  defaultSize = { width: 700, height: 500 },
  isActive = false,
  isMinimized = false,
  onFocus,
  onPositionChange,
  onSizeChange,
  dockPosition,
}) => {
  const [position, setPosition] = useState<Position>(defaultPosition)
  const [size, setSize] = useState<Size>(defaultSize)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [isMaximized, setIsMaximized] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>('')
  const [isClosing, setIsClosing] = useState(false)
  const [isMinimizing, setIsMinimizing] = useState(false) // Add new state for minimizing animation
  const [isRestoring, setIsRestoring] = useState(false) // Add state for restore animation

  const windowRef = useRef<HTMLDivElement>(null)
  const resizeStartPosition = useRef<Position>({ x: 0, y: 0 })
  const resizeStartSize = useRef<Size>({ width: 0, height: 0 })

  const [preMaximizeState, setPreMaximizeState] = useState<{
    position: Position
    size: Size
  }>({ position, size })

  const [screenDimensions, setScreenDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  // Define larger minimum dimensions constants that will be used throughout the component
  const minWindowWidth = 600 // Increased from 400
  const minWindowHeight = 400 // Increased from 300

  useEffect(() => {
    const handleResize = () => {
      setScreenDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })

      if (window.innerWidth < 768 && !isMaximized) {
        if (window.innerWidth < 600) {
          if (!isMaximized) {
            toggleMaximize()
          }
        } else {
          const newSize = {
            width: Math.min(size.width, window.innerWidth - 20),
            height: Math.min(size.height, window.innerHeight - 100),
          }
          setSize(newSize)

          const boundedPosition = getBoundedPosition(position, newSize)
          if (
            boundedPosition.x !== position.x ||
            boundedPosition.y !== position.y
          ) {
            setPosition(boundedPosition)
          }
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMaximized, position, size])

  const isMobile = () => {
    return window.innerWidth < 768
  }

  useEffect(() => {
    if (isMobile()) {
      const mobileSize = {
        width: Math.min(defaultSize.width, screenDimensions.width - 20),
        height: Math.min(defaultSize.height, screenDimensions.height - 100),
      }

      setSize(mobileSize)

      const centeredPosition = {
        x: Math.max(0, (screenDimensions.width - mobileSize.width) / 2),
        y: Math.max(
          0,
          Math.min(
            defaultPosition.y,
            (screenDimensions.height - mobileSize.height) / 2
          )
        ),
      }

      setPosition(centeredPosition)

      if (screenDimensions.width < 600) {
        setIsMaximized(true)
      }
    } else {
      const boundedPosition = getBoundedPosition(defaultPosition, defaultSize)
      setPosition(boundedPosition)
      setSize(defaultSize)
    }
  }, [defaultPosition, defaultSize, screenDimensions])

  const getBoundedPosition = (pos: Position, windowSize: Size): Position => {
    const minX = 0
    const minY = 0
    const maxX = screenDimensions.width - windowSize.width
    const maxY = screenDimensions.height - windowSize.height

    return {
      x: Math.min(Math.max(pos.x, minX), maxX),
      y: Math.min(Math.max(pos.y, minY), maxY),
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return

    if (onFocus) onFocus()

    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setIsDragging(true)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMaximized) return

    if (onFocus) onFocus()

    if (windowRef.current && e.touches.length === 1) {
      const touch = e.touches[0]
      const rect = windowRef.current.getBoundingClientRect()
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      })
      setIsDragging(true)
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0]
      const newPosition = {
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y,
      }

      const boundedPosition = getBoundedPosition(newPosition, size)
      setPosition(boundedPosition)

      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false)
      if (onPositionChange) {
        onPositionChange(id, position)
      }
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        }
        const boundedPosition = getBoundedPosition(newPosition, size)
        setPosition(boundedPosition)
      } else if (isResizing) {
        handleResize(e)
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        if (onPositionChange) {
          onPositionChange(id, position)
        }
      }

      if (isResizing) {
        setIsResizing(false)
        if (onSizeChange) {
          onSizeChange(id, size)
        }
      }
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      })
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [
    isDragging,
    isResizing,
    dragOffset,
    id,
    onPositionChange,
    onSizeChange,
    position,
    size,
    screenDimensions,
  ])

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (onFocus) onFocus()

    setIsResizing(true)
    setResizeDirection(direction)
    resizeStartPosition.current = { x: e.clientX, y: e.clientY }
    resizeStartSize.current = { ...size }
  }

  const handleResize = (e: MouseEvent) => {
    const deltaX = e.clientX - resizeStartPosition.current.x
    const deltaY = e.clientY - resizeStartPosition.current.y

    let newWidth = resizeStartSize.current.width
    let newHeight = resizeStartSize.current.height
    let newX = position.x
    let newY = position.y

    // Use the minimum dimension constants
    const minWidth = minWindowWidth
    const minHeight = minWindowHeight

    // Calculate maximum width and height based on screen boundaries
    const maxWidth = screenDimensions.width
    const maxHeight = screenDimensions.height

    switch (resizeDirection) {
      case 'top':
        // Calculate possible new height and position while maintaining mouse under cursor
        const proposedHeight = resizeStartSize.current.height - deltaY

        // First check if the proposed height meets minimum requirements
        if (proposedHeight >= minHeight) {
          // Calculate new position that would keep the bottom edge fixed
          const proposedY =
            resizeStartPosition.current.y + deltaY - dragOffset.y

          // Only apply changes if the new position isn't negative
          if (proposedY >= 0) {
            newHeight = proposedHeight
            newY = proposedY
          } else {
            // If new position would be negative, only resize as much as possible
            // to keep the window at the top of the screen
            newY = 0
            newHeight = resizeStartSize.current.height + (position.y - newY)
          }
        } else if (proposedHeight < minHeight) {
          // If height would be too small, set it to minimum and adjust Y
          newHeight = minHeight
          newY = position.y + resizeStartSize.current.height - minHeight
        }
        break

      case 'right':
        newWidth = Math.min(
          maxWidth - position.x,
          Math.max(minWidth, resizeStartSize.current.width + deltaX)
        )
        break

      case 'bottom':
        newHeight = Math.min(
          maxHeight - position.y,
          Math.max(minHeight, resizeStartSize.current.height + deltaY)
        )
        break

      case 'left':
        // Start with desired width
        const proposedWidth = resizeStartSize.current.width - deltaX

        // Check if width meets minimum
        if (proposedWidth >= minWidth) {
          // Calculate new position that would keep right edge fixed
          const proposedX =
            resizeStartPosition.current.x + deltaX - dragOffset.x

          // Only apply if new position isn't negative
          if (proposedX >= 0) {
            newWidth = proposedWidth
            newX = proposedX
          } else {
            // If new position would be negative, limit the resize
            newX = 0
            newWidth = resizeStartSize.current.width + position.x
          }
        } else if (proposedWidth < minWidth) {
          // If width would be too small, set it to minimum and adjust X
          newWidth = minWidth
          newX = position.x + resizeStartSize.current.width - minWidth
        }
        break

      default:
        break
    }

    // Ensure we're not making the window larger than the screen
    // or positioning it outside the screen
    if (newX + newWidth > screenDimensions.width) {
      newWidth = screenDimensions.width - newX
    }

    if (newY + newHeight > screenDimensions.height) {
      newHeight = screenDimensions.height - newY
    }

    // Add extra enforcement of minimum size at the end of the function
    // This ensures that regardless of the resize logic, we never go below minimum
    if (newWidth < minWidth) {
      newWidth = minWidth
    }
    if (newHeight < minHeight) {
      newHeight = minHeight
    }

    // Set both size and position in one update to avoid flickering
    setSize({ width: newWidth, height: newHeight })
    setPosition({ x: newX, y: newY })
  }

  const toggleMaximize = () => {
    if (!isMaximized) {
      setPreMaximizeState({ position, size })
      setIsMaximized(true)
    } else {
      if (isMobile()) {
        const mobileSize = {
          width: Math.min(
            preMaximizeState.size.width,
            screenDimensions.width - 20
          ),
          height: Math.min(
            preMaximizeState.size.height,
            screenDimensions.height - 100
          ),
        }

        const centeredPosition = {
          x: Math.max(0, (screenDimensions.width - mobileSize.width) / 2),
          y: Math.max(0, (screenDimensions.height - mobileSize.height) / 4),
        }

        setPosition(centeredPosition)
        setSize(mobileSize)
      } else {
        setPosition(preMaximizeState.position)
        setSize(preMaximizeState.size)
      }

      setIsMaximized(false)

      if (onPositionChange) {
        onPositionChange(id, isMobile() ? position : preMaximizeState.position)
      }
      if (onSizeChange) {
        onSizeChange(id, isMobile() ? size : preMaximizeState.size)
      }
    }
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 350)
  }

  // Полностью переработанный простой обработчик минимизации
  const handleMinimize = () => {
    if (!onMinimize) return

    // Запускаем анимацию скрытия
    setIsMinimizing(true)

    // Ждем завершения анимации перед вызовом обработчика
    setTimeout(() => {
      setIsMinimizing(false)
      if (onMinimize) onMinimize()
    }, 250)
  }

  // Упрощенный эффект для восстановления
  useEffect(() => {
    // Если окно больше не в списке минимизированных и требует восстановления
    if (
      isMinimized === false &&
      windowRef.current &&
      !isMinimizing &&
      windowRef.current.classList.contains('minimized')
    ) {
      setIsRestoring(true)

      setTimeout(() => {
        setIsRestoring(false)
      }, 250)
    }
  }, [isMinimized, isMinimizing])

  // Упрощаем getWindowStyle для корректной работы с минимизацией
  const getWindowStyle = () => {
    // Если окно минимизировано и не в процессе анимации - скрываем его
    if (isMinimized && !isMinimizing && !isRestoring) {
      return { display: 'none' }
    }

    // Для максимизированного окна
    if (isMaximized) {
      return {
        top: 0,
        left: 0,
        width: '100%',
        height: isMobile()
          ? 'calc(100% - var(--dock-height))'
          : 'calc(100% - var(--dock-height) - 20px)',
        borderRadius: 0,
      }
    }

    // Обычное позиционирование
    return {
      top: `${position.y}px`,
      left: `${position.x}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
    }
  }

  useEffect(() => {
    // When the component mounts, ensure the window meets minimum size requirements
    if (size.width < minWindowWidth || size.height < minWindowHeight) {
      const newSize = {
        width: Math.max(size.width, minWindowWidth),
        height: Math.max(size.height, minWindowHeight),
      }

      setSize(newSize)

      // Also adjust position if needed to keep window within screen
      const newPosition = getBoundedPosition(position, newSize)
      if (newPosition.x !== position.x || newPosition.y !== position.y) {
        setPosition(newPosition)
      }
    }
  }, [])

  return (
    <div
      ref={windowRef}
      className={`app-window ${isActive ? 'active' : ''} ${
        isDragging ? 'dragging' : ''
      } ${isMaximized ? 'maximized' : ''} ${isMinimized ? 'minimized' : ''} ${
        isResizing ? 'resizing' : ''
      } ${isClosing ? 'closing' : ''} ${isMinimizing ? 'minimizing' : ''} ${
        isRestoring ? 'restoring' : ''
      } window-appear`}
      style={getWindowStyle()}
      onClick={onFocus}
      data-id={id}
    >
      <div
        className="app-window-header"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={toggleMaximize}
      >
        <div className="app-window-controls">
          <button
            className="window-control close"
            onClick={handleClose}
          ></button>
          <button
            className="window-control minimize"
            onClick={handleMinimize}
          ></button>
          <button
            className="window-control maximize"
            onClick={toggleMaximize}
          ></button>
        </div>

        <div className="app-window-title">
          <i className={`fas fa-${icon}`}></i>
          <span>{title}</span>
        </div>
      </div>

      <div className="app-window-content">{children}</div>

      {!isMaximized && !isMobile() && (
        <>
          <div
            className="resize-handle top"
            onMouseDown={e => handleResizeStart(e, 'top')}
          ></div>
          <div
            className="resize-handle right"
            onMouseDown={e => handleResizeStart(e, 'right')}
          ></div>
          <div
            className="resize-handle bottom"
            onMouseDown={e => handleResizeStart(e, 'bottom')}
          ></div>
          <div
            className="resize-handle left"
            onMouseDown={e => handleResizeStart(e, 'left')}
          ></div>
        </>
      )}
    </div>
  )
}

export default AppWindow
