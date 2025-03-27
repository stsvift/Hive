import { STORAGE_KEYS } from '../config/constants'
import { isAuthenticated } from './authService'

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface WindowState {
  position: Position
  size: Size
}

// Default window positions based on app id
const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  tasks: { x: 100, y: 80 },
  notes: { x: 150, y: 120 },
  calendar: { x: 200, y: 150 },
  settings: { x: 250, y: 100 },
  files: { x: 180, y: 130 },
  projects: { x: 120, y: 100 },
  chat: { x: 220, y: 110 },
}

// Default window sizes
const DEFAULT_SIZES: Record<string, { width: number; height: number }> = {
  tasks: { width: 800, height: 600 },
  notes: { width: 600, height: 500 },
  calendar: { width: 750, height: 600 },
  settings: { width: 700, height: 550 },
  files: { width: 700, height: 500 },
  projects: { width: 800, height: 600 },
  chat: { width: 650, height: 550 },
}

// Current device type tracking
let currentDeviceType: 'mobile' | 'desktop' =
  window.innerWidth < 768 ? 'mobile' : 'desktop'

// Function to determine if the device is mobile
function isMobileDevice(): boolean {
  return window.innerWidth < 768
}

// Get the appropriate window size based on device
function getDefaultSizeForDevice(appId: string) {
  const defaultSize = DEFAULT_SIZES[appId] || { width: 700, height: 500 }

  // Adjust for mobile devices
  if (isMobileDevice()) {
    return {
      width: Math.min(defaultSize.width, window.innerWidth - 20),
      height: Math.min(defaultSize.height, window.innerHeight - 100),
    }
  }

  return defaultSize
}

// Calculate centered position based on window size and screen dimensions
function getCenteredPosition(size: Size): Position {
  return {
    x: Math.max(0, (window.innerWidth - size.width) / 2),
    y: Math.max(0, (window.innerHeight - size.height) / 4),
  }
}

// Get window state from localStorage with proper defaults
export function getWindowState(appId: string): WindowState {
  // Try to get from consolidated storage first
  const allStates = loadWindowStates()
  if (allStates[appId]) {
    try {
      const state = allStates[appId]
      const size = getDefaultSizeForDevice(appId)

      // If current device is mobile, adjust the saved state
      if (isMobileDevice()) {
        return {
          position: getCenteredPosition(size),
          size,
        }
      }

      // Ensure the window is within visible area
      const adjustedPosition = {
        x: Math.min(
          Math.max(0, state.position.x),
          window.innerWidth - size.width
        ),
        y: Math.min(
          Math.max(0, state.position.y),
          window.innerHeight - size.height
        ),
      }

      return {
        position: adjustedPosition,
        size,
      }
    } catch (e) {
      console.error('Error parsing window state:', e)
    }
  }

  // Default fallback - calculate position based on device type
  const size = getDefaultSizeForDevice(appId)
  let position

  if (isMobileDevice()) {
    // Center the window on mobile
    position = getCenteredPosition(size)
  } else {
    // Use default position or calculate one if not available
    position = DEFAULT_POSITIONS[appId] || {
      x: 100 + Math.random() * 100,
      y: 100 + Math.random() * 50,
    }
  }

  return { position, size }
}

// Save window state to localStorage - now saves to consolidated storage
export function saveWindowState(appId: string, state: WindowState): void {
  const allStates = loadWindowStates()
  allStates[appId] = state

  try {
    localStorage.setItem(STORAGE_KEYS.WINDOW_STATES, JSON.stringify(allStates))
  } catch (error) {
    console.error('Error saving window state:', error)
  }
}

// Reset all window states (useful when changing between mobile and desktop)
export function resetAllWindowStates(): void {
  const appIds = Object.keys(DEFAULT_POSITIONS)
  const allStates: Record<string, WindowState> = {}

  appIds.forEach(appId => {
    const size = getDefaultSizeForDevice(appId)
    const position = isMobileDevice()
      ? getCenteredPosition(size)
      : DEFAULT_POSITIONS[appId] || { x: 100, y: 100 }

    allStates[appId] = { position, size }
  })

  // Save all states at once
  localStorage.setItem(STORAGE_KEYS.WINDOW_STATES, JSON.stringify(allStates))
}

// Listen for device type changes
window.addEventListener('resize', () => {
  const newDeviceType = isMobileDevice() ? 'mobile' : 'desktop'

  // Only reset states when device type changes (mobile <-> desktop)
  if (newDeviceType !== currentDeviceType) {
    currentDeviceType = newDeviceType
    resetAllWindowStates()

    // Dispatch an event that components can listen for
    window.dispatchEvent(
      new CustomEvent('deviceTypeChanged', {
        detail: { deviceType: currentDeviceType },
      })
    )
  }
})

// Export function to get current device type
export function getCurrentDeviceType(): 'mobile' | 'desktop' {
  return currentDeviceType
}

// Load saved window states
export const loadWindowStates = (): Record<string, WindowState> => {
  try {
    // Only load window states if the user is authenticated
    if (isAuthenticated()) {
      const savedStates = localStorage.getItem(STORAGE_KEYS.WINDOW_STATES)
      if (savedStates) {
        return JSON.parse(savedStates)
      }
    }
  } catch (error) {
    console.error('Error loading window states:', error)
  }
  return {}
}

// Clear all saved window states
export const clearWindowStates = (): void => {
  localStorage.removeItem(STORAGE_KEYS.WINDOW_STATES)
}

export default {
  loadWindowStates,
  saveWindowState,
  getWindowState,
  clearWindowStates,
}
