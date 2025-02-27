import { ReactNode } from 'react'

export interface IFolder {
  id: number
  name: string
  description: string
  createdAt?: string
  parentFolderId?: number | null
}

export interface INote {
  id: number
  title: string
  content: string
  folderId?: number
  parentFolderId?: number | null
  createdAt: string | Date
}

export interface ITask {
  id: number
  title: string
  description: string
  isCompleted: boolean
  deadline?: string
  createdAt: string
  userId: number
  folderId?: number
  parentFolderId?: number | null
}

export interface TaskStats {
  activeTasks: number
  completedTasks: number
  totalTasks: number
}

//Widgets

export type WidgetSize = 'small' | 'large' | 'deadline'
export type WidgetType = 'folder' | 'note' | 'task'

export interface WidgetProps {
  size: WidgetSize
  title: string
  children: ReactNode
}

export interface MemoryWidgetProps {
  type: 'folder' | 'note' | 'task'
  title: string
  children: React.ReactNode
  onEdit?: () => void
  onDelete?: () => void
  deadline?: string
  onClick?: () => void
}

export interface UserResponse {
  name: string
  // другие поля пользователя если нужны
}
