import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { v4 as uuidv4 } from "uuid"

export interface WindowPosition {
  x: number
  y: number
}

export interface WindowSize {
  width: number
  height: number
}

export interface WindowState {
  id: string
  appId: string
  title: string
  isActive: boolean
  isMinimized: boolean
  isMaximized: boolean
  position: WindowPosition
  size: WindowSize
  zIndex: number
}

interface WindowsState {
  windows: WindowState[]
  highestZIndex: number
}

const initialState: WindowsState = {
  windows: [],
  highestZIndex: 0,
}

export const windowsSlice = createSlice({
  name: "windows",
  initialState,
  reducers: {
    openWindow: (state, action: PayloadAction<{ appId: string; title: string }>) => {
      const { appId, title } = action.payload
      const existingWindow = state.windows.find((w) => w.appId === appId && !w.isMinimized)

      if (existingWindow) {
        state.windows = state.windows.map((window) => ({
          ...window,
          isActive: window.id === existingWindow.id,
          zIndex: window.id === existingWindow.id ? state.highestZIndex + 1 : window.zIndex,
          isMinimized: false,
        }))
        state.highestZIndex += 1
        return
      }

      const newZIndex = state.highestZIndex + 1

      const newWindow: WindowState = {
        id: uuidv4(),
        appId,
        title,
        isActive: true,
        isMinimized: false,
        isMaximized: false,
        position: {
          x: 50 + Math.random() * 100,
          y: 50 + Math.random() * 100,
        },
        size: {
          width: 800,
          height: 600,
        },
        zIndex: newZIndex,
      }

      state.windows = state.windows
        .map((window) => ({
          ...window,
          isActive: false,
        }))
        .concat(newWindow)

      state.highestZIndex = newZIndex
    },
    closeWindow: (state, action: PayloadAction<string>) => {
      state.windows = state.windows.filter((window) => window.id !== action.payload)
    },
    minimizeWindow: (state, action: PayloadAction<string>) => {
      state.windows = state.windows.map((window) =>
        window.id === action.payload ? { ...window, isMinimized: true, isActive: false } : window,
      )
    },
    maximizeWindow: (state, action: PayloadAction<string>) => {
      state.windows = state.windows.map((window) =>
        window.id === action.payload ? { ...window, isMaximized: !window.isMaximized } : window,
      )
    },
    activateWindow: (state, action: PayloadAction<string>) => {
      const newZIndex = state.highestZIndex + 1

      state.windows = state.windows.map((window) => ({
        ...window,
        isActive: window.id === action.payload,
        zIndex: window.id === action.payload ? newZIndex : window.zIndex,
        isMinimized: window.id === action.payload ? false : window.isMinimized,
      }))

      state.highestZIndex = newZIndex
    },
    moveWindow: (state, action: PayloadAction<{ id: string; position: WindowPosition }>) => {
      const { id, position } = action.payload

      state.windows = state.windows.map((window) => (window.id === id ? { ...window, position } : window))
    },
    resizeWindow: (state, action: PayloadAction<{ id: string; size: WindowSize }>) => {
      const { id, size } = action.payload

      state.windows = state.windows.map((window) => (window.id === id ? { ...window, size } : window))
    },
  },
})

export const { openWindow, closeWindow, minimizeWindow, maximizeWindow, activateWindow, moveWindow, resizeWindow } =
  windowsSlice.actions

export default windowsSlice.reducer

