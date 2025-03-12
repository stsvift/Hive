import { configureStore } from '@reduxjs/toolkit'
import appsReducer from './appsSlice'
import authReducer from './authSlice'
import themeReducer from './themeSlice'
import windowsReducer from './windowsSlice'

export const store = configureStore({
  reducer: {
    windows: windowsReducer,
    auth: authReducer,
    apps: appsReducer,
    theme: themeReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
