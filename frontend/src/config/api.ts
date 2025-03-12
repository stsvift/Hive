// API configuration constants
export const API_BASE_URL = 'http://localhost:5000/api'

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    ME: `${API_BASE_URL}/users/profile`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
  },
  FOLDERS: `${API_BASE_URL}/folders`,
  NOTES: `${API_BASE_URL}/notes`,
  TASKS: `${API_BASE_URL}/tasks`,
  USERS: `${API_BASE_URL}/users`,
}
