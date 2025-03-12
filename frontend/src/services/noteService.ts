import axios from 'axios'
import { Note } from '../types/Note'
import { getAuthToken } from '../utils/authUtils'

// Update the API URL to match the correct endpoint from the API documentation
const API_BASE_URL = 'http://localhost:5000/api'
const API_URL = `${API_BASE_URL}/notes`

// Get authorization headers
const getHeaders = () => {
  const token = getAuthToken()
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }
}

// Create proxy for development
const proxy = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Important for cookie transmission
})

// Get all notes from database
export const getAllNotes = async (): Promise<Note[]> => {
  try {
    const response = await proxy.get('/notes', getHeaders())

    // Handle different response formats
    if (Array.isArray(response.data)) {
      return response.data
    } else if (response.data && typeof response.data === 'object') {
      // If response is an object with a notes array
      if (Array.isArray(response.data.notes)) {
        return response.data.notes
      }
      // If response is a single note, wrap it in an array
      if (response.data.id) {
        return [response.data]
      }
      // If response is in another format, try to extract notes
      const potentialNotes = Object.values(response.data).filter(
        (item: any) => item && typeof item === 'object' && 'title' in item
      )
      if (potentialNotes.length > 0) {
        return potentialNotes as Note[]
      }
    }

    // If format couldn't be recognized, return empty array
    return []
  } catch (error) {
    // In development return test notes
    if (window.location.hostname === 'localhost') {
      return [
        {
          id: 1,
          title: 'Meeting Notes',
          content: 'Discussed project timeline and deliverables',
          userId: 1,
          folderId: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Project Ideas',
          content: 'List of ideas for the next sprint',
          userId: 1,
          folderId: 2,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]
    }
    return []
  }
}

// Get a specific note
export const getNote = async (id: number): Promise<Note> => {
  try {
    const response = await proxy.get(`/notes/${id}`, getHeaders())
    return response.data
  } catch (error) {
    throw new Error(
      'Не удалось загрузить заметку. Пожалуйста, попробуйте позже.'
    )
  }
}

// Create a new note
export const createNote = async (noteData: {
  title: string
  content: string
}): Promise<Note> => {
  try {
    const response = await proxy.post('/notes', noteData, getHeaders())

    // Check API response
    if (!response.data) {
      throw new Error('Сервер вернул пустой ответ')
    }

    // If server didn't return ID, create a temporary one
    if (!response.data.id) {
      response.data.id = Date.now()
    }

    return response.data
  } catch (error) {
    // In development return a mock note
    if (window.location.hostname === 'localhost') {
      const mockNote: Note = {
        id: Date.now(),
        title: noteData.title,
        content: noteData.content,
        userId: 1,
        folderId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        color: '',
        isLocalOnly: true,
      }
      return mockNote
    }

    throw new Error('Не удалось создать заметку. Пожалуйста, попробуйте позже.')
  }
}

// Update an existing note
export const updateNote = async (
  id: number,
  noteData: { title?: string; content?: string; color?: string }
): Promise<Note> => {
  try {
    const response = await proxy.put(`/notes/${id}`, noteData, getHeaders())

    // Check API response
    if (!response.data) {
      throw new Error('Сервер вернул пустой ответ при обновлении')
    }

    return response.data
  } catch (error) {
    // In development return updated local note
    if (window.location.hostname === 'localhost') {
      return {
        id: id,
        title: noteData.title || 'Untitled',
        content: noteData.content || '',
        color: noteData.color || '',
        userId: 1,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        isLocalOnly: true,
      }
    }

    throw new Error(
      'Не удалось обновить заметку. Пожалуйста, попробуйте позже.'
    )
  }
}

// Delete a note
export const deleteNote = async (id: number): Promise<void> => {
  try {
    await proxy.delete(`/notes/${id}`, getHeaders())
  } catch (error) {
    // In development, ignore deletion error
    if (window.location.hostname === 'localhost') {
      return
    }

    throw new Error('Не удалось удалить заметку. Пожалуйста, попробуйте позже.')
  }
}
