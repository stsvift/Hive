import { useCallback, useEffect, useState } from 'react'
import {
  createNote,
  deleteNote,
  getAllNotes,
  updateNote,
} from '../services/noteService'
import { Note } from '../types/Note'
import { useLocalStorage } from './useLocalStorage'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [backupNotes, setBackupNotes] = useLocalStorage<Note[]>(
    'notes_backup',
    []
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notes and sync with local backup
  const fetchNotes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Try to get from API first
      const apiNotes = await getAllNotes()

      if (Array.isArray(apiNotes) && apiNotes.length > 0) {
        setNotes(apiNotes)
        // Update local backup with latest API data
        setBackupNotes(apiNotes)
        return
      }

      // If API returned empty or invalid data, try to use local backup
      if (backupNotes.length > 0) {
        setNotes(backupNotes)
      }
    } catch (err) {
      setError('Failed to load notes. Using local backup if available.')

      // On error, use local backup
      if (backupNotes.length > 0) {
        setNotes(backupNotes)
      }
    } finally {
      setIsLoading(false)
    }
  }, [backupNotes, setBackupNotes])

  // Initial load
  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Create note with local backup
  const createNoteWithBackup = async (noteData: {
    title: string
    content: string
  }): Promise<Note> => {
    try {
      const newNote = await createNote(noteData)

      // Update state and backup
      const updatedNotes = [newNote, ...notes]
      setNotes(updatedNotes)
      setBackupNotes(updatedNotes)

      return newNote
    } catch (err) {
      // Create local note if API fails
      const localNote: Note = {
        id: Date.now(),
        title: noteData.title,
        content: noteData.content,
        color: '',
        createdAt: new Date().toISOString(),
        isLocalOnly: true, // Flag to indicate this note exists only locally
      }

      const updatedNotes = [localNote, ...notes]
      setNotes(updatedNotes)
      setBackupNotes(updatedNotes)

      return localNote
    }
  }

  // Update note with local backup
  const updateNoteWithBackup = async (
    id: number,
    noteData: { title?: string; content?: string; color?: string }
  ): Promise<Note> => {
    try {
      const updatedNote = await updateNote(id, noteData)

      // Update state and backup
      const updatedNotes = notes.map(note =>
        note.id === id ? updatedNote : note
      )
      setNotes(updatedNotes)
      setBackupNotes(updatedNotes)

      return updatedNote
    } catch (err) {
      // Update local note if API fails
      const noteToUpdate = notes.find(note => note.id === id)
      if (!noteToUpdate) throw new Error(`Note with id ${id} not found`)

      const updatedLocalNote = {
        ...noteToUpdate,
        ...noteData,
        updatedAt: new Date().toISOString(),
        isLocalOnly: true,
      }

      const updatedNotes = notes.map(note =>
        note.id === id ? updatedLocalNote : note
      )
      setNotes(updatedNotes)
      setBackupNotes(updatedNotes)

      return updatedLocalNote
    }
  }

  // Delete note with local backup sync
  const deleteNoteWithBackup = async (id: number): Promise<void> => {
    try {
      await deleteNote(id)

      // Update state and backup
      const updatedNotes = notes.filter(note => note.id !== id)
      setNotes(updatedNotes)
      setBackupNotes(updatedNotes)
    } catch (err) {
      // Remove from local state even if API fails
      const updatedNotes = notes.filter(note => note.id !== id)
      setNotes(updatedNotes)
      setBackupNotes(updatedNotes)
    }
  }

  return {
    notes,
    isLoading,
    error,
    fetchNotes,
    createNote: createNoteWithBackup,
    updateNote: updateNoteWithBackup,
    deleteNote: deleteNoteWithBackup,
  }
}
