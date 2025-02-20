import api from './axios.config';
import { IFolder, INote, ITask } from '../types';

export const memoryService = {
  // Folders
  getFolders: async () => {
    const response = await api.get<IFolder[]>('/folders');
    return response.data;
  },
  
  createFolder: async (data: Partial<IFolder>) => {
    const response = await api.post<IFolder>('/folders', data);
    return response.data;
  },
    
  updateFolder: async (id: number, data: Partial<IFolder>) => {
    const response = await api.put<IFolder>(`/folders/${id}`, data);
    return response.data;
  },
    
  deleteFolder: async (id: number) => {
    await api.delete(`/folders/${id}`);
  },

  // Notes
  getNotes: async () => {
    const response = await api.get<INote[]>('/notes');
    return response.data;
  },
  
  createNote: async (data: Partial<INote>) => {
    const response = await api.post<INote>('/notes', data);
    return response.data;
  },

  updateNote: async (id: number, data: Partial<INote>) => {
    const response = await api.put<INote>(`/notes/${id}`, data);
    return response.data;
  },

  deleteNote: async (id: number) => {
    await api.delete(`/notes/${id}`);
  },

  // Tasks
  getTasks: async () => {
    const response = await api.get<ITask[]>('/tasks');
    return response.data;
  },
  
  createTask: async (data: Partial<ITask>) => {
    const response = await api.post<ITask>('/tasks', data); // Verify endpoint matches backend
    return response.data;
  },

  updateTask: async (id: number, data: Partial<ITask>) => {
    const response = await api.put<ITask>(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id: number) => {
    await api.delete(`/tasks/${id}`);
  },

  toggleTaskComplete: async (id: number) => {
    const response = await api.patch<ITask>(`/tasks/${id}/toggle`);
    return response.data;
  }
};

export default memoryService;
