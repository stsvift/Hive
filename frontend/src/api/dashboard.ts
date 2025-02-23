import { ITask, TaskStats, UserResponse } from '../types'
import api from './axios.config'

class DashboardService {
  async getTodayTasks(): Promise<ITask[]> {
    const response = await api.get<ITask[]>('/dashboard/today-tasks')
    return response.data
  }

  async getTaskStats(): Promise<TaskStats> {
    const { data } = await api.get<TaskStats>('/dashboard/task-stats')
    return {
      activeTasks: data.activeTasks,
      completedTasks: data.completedTasks,
      totalTasks: data.totalTasks,
    }
  }

  async getUsername(token: string): Promise<string> {
    try {
      const { data } = await api.get<UserResponse>('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return data.name
    } catch (error) {
      console.error('Error fetching username:', error)
      return 'Гость'
    }
  }
}

export const dashboardService = new DashboardService()
