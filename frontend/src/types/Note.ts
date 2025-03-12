export interface Note {
  id: number
  title: string
  content: string
  color?: string
  createdAt: string
  updatedAt?: string
  isNew?: boolean
  [key: string]: any // Allow for additional properties
}
