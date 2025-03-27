import { STORAGE_KEYS } from '../config/constants'

// Get a setting value from localStorage with improved logging
export const getSetting = <T>(path: string, defaultValue: T): T => {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (!settings) {
      console.log(`No settings found, using default for ${path}:`, defaultValue)
      return defaultValue
    }

    const settingsObj = JSON.parse(settings)

    // Использование reduce для поиска по вложенному пути
    const keys = path.split('.')
    const value = keys.reduce(
      (obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined),
      settingsObj
    )

    if (value === undefined) {
      console.log(`Setting ${path} not found, using default:`, defaultValue)
      return defaultValue
    }

    console.log(`Retrieved setting ${path}:`, value)

    // Проверка на правильный тип для возвращаемого значения, особенно для акцента
    if (path === 'appearance.accent' && typeof value === 'string') {
      // Дополнительная проверка для акцентного цвета
      const validAccents = ['orange', 'blue', 'teal', 'green', 'purple', 'red']
      if (!validAccents.includes(value)) {
        console.warn(
          `Invalid accent color: ${value}, using default:`,
          defaultValue
        )
        return defaultValue
      }
    }

    return value as T
  } catch (error) {
    console.error(`Error retrieving setting ${path}:`, error)
    return defaultValue
  }
}

// Save settings with dot notation support
export const saveSetting = (key: string, value: any): void => {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      ? JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}')
      : {}

    // Split the key by dots to create nested structure
    const keys = key.split('.')
    let current = settings

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  } catch (error) {
    console.error('Error saving setting:', error)
  }
}

// Get current wallpaper
export const getCurrentWallpaper = (): string => {
  return getSetting('appearance.wallpaper', 'modern')
}

// Get current theme with higher priority handling - simplified to use only settings
export const getCurrentTheme = (): 'light' | 'dark' => {
  // Check settings first
  const settingsTheme = getSetting('appearance.theme', 'light')
  if (settingsTheme === 'light' || settingsTheme === 'dark') {
    return settingsTheme as 'light' | 'dark'
  }

  // Default to light if nothing found
  return 'light'
}

// Save theme in a single location
export const saveTheme = (theme: 'light' | 'dark'): void => {
  // Save in settings
  saveSetting('appearance.theme', theme)

  // Apply theme to document element
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

// Function to update favicon colors based on accent color
export const updateFaviconColors = (accentColor: string): void => {
  try {
    const favicon = document.querySelector(
      'link[rel="icon"]'
    ) as HTMLLinkElement
    if (!favicon) return

    // Get the SVG content
    fetch(favicon.href)
      .then(response => response.text())
      .then(svgText => {
        // Replace the primary color in the SVG
        const updatedSvg = svgText
          .replace(/fill="#FF9800"/g, `fill="${accentColor}"`)
          .replace(
            /stroke="#F57C00"/g,
            `stroke="${getDarkerColor(accentColor)}"`
          )
          .replace(/fill="#FFB74D"/g, `fill="${getLighterColor(accentColor)}"`)
          .replace(
            /fill="#FFE0B2"/g,
            `fill="${getLighterColor(accentColor, 0.8)}"`
          )
          .replace(/fill="#F57C00"/g, `fill="${getDarkerColor(accentColor)}"`)
          .replace(/stroke-width="4"/g, 'stroke-width="4"')

        // Create a blob from the modified SVG
        const blob = new Blob([updatedSvg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)

        // Save the updated SVG content to localStorage for persistent favicon after reload
        localStorage.setItem(STORAGE_KEYS.CUSTOM_FAVICON, updatedSvg)

        // Update the favicon href
        favicon.href = url
      })
      .catch(error => console.error('Error updating favicon:', error))
  } catch (e) {
    console.error('Error updating favicon:', e)
  }
}

// Helper functions to get lighter and darker versions of a color
const getLighterColor = (hexColor: string, factor = 0.3): string => {
  return adjustColor(hexColor, factor)
}

const getDarkerColor = (hexColor: string, factor = 0.3): string => {
  return adjustColor(hexColor, -factor)
}

const adjustColor = (hexColor: string, factor: number): string => {
  // Convert hex to RGB
  let r = parseInt(hexColor.substring(1, 3), 16)
  let g = parseInt(hexColor.substring(3, 5), 16)
  let b = parseInt(hexColor.substring(5, 7), 16)

  // Adjust RGB values
  r = Math.min(255, Math.max(0, Math.round(r + (255 - r) * factor)))
  g = Math.min(255, Math.max(0, Math.round(g + (255 - g) * factor)))
  b = Math.min(255, Math.max(0, Math.round(b + (255 - b) * factor)))

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Wallpaper data for access across components
export const WALLPAPERS = {
  modern: {
    name: 'Современный',
    bgClass: 'wallpaper-modern',
  },
  honeycomb: {
    name: 'Соты',
    bgClass: 'wallpaper-honeycomb',
  },
  gradient: {
    name: 'Градиент',
    bgClass: 'wallpaper-gradient',
  },
  minimal: {
    name: 'Минимализм',
    bgClass: 'wallpaper-minimal',
  },
}
