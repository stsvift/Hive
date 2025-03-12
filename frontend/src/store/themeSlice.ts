import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  getStoredTheme,
  getStoredWallpaper,
  saveTheme,
  saveWallpaper,
} from '../utils/themeStorage'

interface ThemeState {
  theme: string
  wallpaper: string
}

// Get stored values or use defaults
const initialState: ThemeState = {
  theme: getStoredTheme() || 'light',
  wallpaper: getStoredWallpaper() || 'default',
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload
      saveTheme(action.payload)
    },
    setWallpaper: (state, action: PayloadAction<string>) => {
      state.wallpaper = action.payload
      saveWallpaper(action.payload)
    },
  },
})

export const { setTheme, setWallpaper } = themeSlice.actions
export default themeSlice.reducer
