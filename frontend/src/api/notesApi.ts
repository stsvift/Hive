import { API_ENDPOINTS } from '../config/api'
import api from '../services/api'

export interface Note {
  id: string | number
  title: string
  content: string
  userId?: number
  folderId: string | number
  createdAt?: string
  updatedAt?: string
}

interface CreateNoteData {
  title: string
  content: string
  folderId: string | number
}

// Helper function for better error handling
const handleError = (error: any): never => {
  console.error('Notes API Error:', error)
  const message =
    error.response?.data?.message || error.message || 'Unknown error occurred'
  throw new Error(message)
}

// Transform API response into consistent Note format
const transformNoteResponse = (data: any): Note => {
  if (!data) {
    throw new Error('Invalid note data')
  }

  // Extract the actual note data from various possible structures
  const noteData = data.data || data.attributes || data
  const id = String(noteData.id || data.id || '')

  return {
    id,
    title: noteData.title || 'Untitled Note',
    content: noteData.content || '',
    userId: noteData.userId,
    folderId: noteData.folderId || noteData.folder_id || data.folderId,
    createdAt: noteData.createdAt || new Date().toISOString(),
    updatedAt: noteData.updatedAt || new Date().toISOString(),
  }
}

export const notesApi = {
  // Get all notes
  async getNotes(): Promise<Note[]> {
    try {
      const response = await api.get(API_ENDPOINTS.NOTES)

      // Handle both array and object responses
      if (Array.isArray(response.data)) {
        return response.data.map(transformNoteResponse)
      } else if (response.data?.notes) {
        return response.data.notes.map(transformNoteResponse)
      }

      return []
    } catch (error) {
      return handleError(error)
    }
  },

  // Get notes from a specific folder
  async getNotesByFolder(folderId: string | number): Promise<Note[]> {
    try {
      const response = await api.get(
        `${API_ENDPOINTS.FOLDERS}/${folderId}/notes`
      )

      if (Array.isArray(response.data)) {
        return response.data.map(transformNoteResponse)
      } else if (response.data?.notes) {
        return response.data.notes.map(transformNoteResponse)
      }

      return []
    } catch (error) {
      console.error(`Error fetching notes for folder ${folderId}:`, error)
      return [] // Return empty array instead of throwing to prevent UI crashes
    }
  },

  // Get a specific note
  async getNote(id: string | number): Promise<Note> {
    try {
      const response = await api.get(`${API_ENDPOINTS.NOTES}/${id}`)
      return transformNoteResponse(response.data)
    } catch (error) {
      return handleError(error)
    }
  },

  // Create a note with improved error handling and response normalization
  async createNote(data: CreateNoteData): Promise<Note> {
    try {
      console.log('Creating note with data:', data)

      // Ensure folderId is sent in all possible formats for better compatibility
      const requestData = {
        ...data,
        folderId: String(data.folderId),
        folder_id: String(data.folderId),
        folderid: String(data.folderId),
      }

      const response = await api.post(API_ENDPOINTS.NOTES, requestData)
      console.log('Note API response:', response.data)

      const createdNote = transformNoteResponse(response.data)

      // Link the note to the folder if it's not automatically linked by the API
      try {
        await api.post(`${API_ENDPOINTS.FOLDERS}/${data.folderId}/items`, {
          type: 'note',
          referenceId: createdNote.id,
        })
        console.log('Note linked to folder successfully')
      } catch (linkError) {
        console.warn('Could not explicitly link note to folder:', linkError)
        // We continue anyway since the note was created successfully
      }

      return createdNote
    } catch (error) {
      console.error('Failed to create note:', error)

      // In case of error, provide a minimal note object for UI continuity
      if (data.title) {
        return {
          id: `temp-${Date.now()}`,
          title: data.title,
          content: data.content,
          folderId: data.folderId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }

      return handleError(error)
    }
  },

  // Update a note
  async updateNote(
    id: string | number,
    data: Partial<CreateNoteData>
  ): Promise<Note> {
    try {
      const response = await api.put(`${API_ENDPOINTS.NOTES}/${id}`, data)
      return transformNoteResponse(response.data)
    } catch (error) {
      return handleError(error)
    }
  },

  // Delete a note
  async deleteNote(id: string | number): Promise<void> {
    try {
      await api.delete(`${API_ENDPOINTS.NOTES}/${id}`)
    } catch (error) {
      return handleError(error)
    }
  },
}
