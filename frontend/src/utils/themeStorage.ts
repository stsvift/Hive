const THEME_STORAGE_KEY = 'userTheme'
const WALLPAPER_STORAGE_KEY = 'userWallpaper'

export const saveTheme = (theme: string): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    // Silent error - can't use localStorage
  }
}

export const getStoredTheme = (): string | null => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY)
  } catch (error) {
    // Silent error - can't use localStorage
    return null
  }
}

export const saveWallpaper = (wallpaper: string): void => {
  try {
    localStorage.setItem(WALLPAPER_STORAGE_KEY, wallpaper)
  } catch (error) {
    // Silent error - can't use localStorage
  }
}

export const getStoredWallpaper = (): string | null => {
  try {
    return localStorage.getItem(WALLPAPER_STORAGE_KEY)
  } catch (error) {
    // Silent error - can't use localStorage
    return null
  }
}
