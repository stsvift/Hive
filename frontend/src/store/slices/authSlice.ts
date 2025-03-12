import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as authService from '../../services/authService'

interface AuthState {
  isAuthenticated: boolean
  user: any
  loading: boolean
  error: string | null
}

// Initialize state with token check to prevent flashing on refresh
const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem('token'),
  user: null,
  loading: true, // Start with loading to properly check auth status
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const userData = await authService.login(email, password)
      localStorage.setItem('token', userData.token)
      return userData
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Login failed')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (
    {
      username,
      email,
      password,
    }: { username: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const userData = await authService.register(username, email, password)
      localStorage.setItem('token', userData.token)
      return userData
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Registration failed')
    }
  }
)

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      // If no token, user is not authenticated
      const token = localStorage.getItem('token')
      if (!token) {
        return null
      }

      // Make sure we're using the token in the API call
      const userData = await authService.getCurrentUser()

      // Important: If we get here, the token is valid
      return userData
    } catch (error) {
      // If request fails, clear token and return null
      localStorage.removeItem('token')
      return rejectWithValue('Authentication failed')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user') // Also remove user data if stored
  return null
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isAuthenticated = true
        state.user = action.payload
        state.loading = false
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(register.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isAuthenticated = true
        state.user = action.payload
        state.loading = false
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(checkAuthStatus.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isAuthenticated = !!action.payload
        state.user = action.payload
        state.loading = false
        state.error = null
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isAuthenticated = false
        state.user = null
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(logout.fulfilled, state => {
        state.isAuthenticated = false
        state.user = null
        state.loading = false
        state.error = null
      })
  },
})

export default authSlice.reducer
