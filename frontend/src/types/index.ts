export interface IFolder {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

export interface INote {
  id: number;
  title: string;
  content: string;
  folderId?: number;
  createdAt: string;
}

export interface ITask {
  id: number;
  title: string;
  description: string;
  deadline?: string;
  isCompleted: boolean;
  folderId?: number;
}