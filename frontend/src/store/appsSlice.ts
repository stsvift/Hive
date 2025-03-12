import { createSlice } from "@reduxjs/toolkit"

export interface AppState {
  id: string
  title: string
  icon: string
  component: string
}

interface AppsState {
  apps: AppState[]
}

const initialState: AppsState = {
  apps: [
    {
      id: "explorer",
      title: "Проводник",
      icon: "folder",
      component: "Explorer",
    },
    {
      id: "notes",
      title: "Заметки",
      icon: "sticky-note",
      component: "Notes",
    },
    {
      id: "tasks",
      title: "Задачи",
      icon: "tasks",
      component: "Tasks",
    },
    {
      id: "settings",
      title: "Настройки",
      icon: "cog",
      component: "Settings",
    },
    {
      id: "notifications",
      title: "Уведомления",
      icon: "bell",
      component: "Notifications",
    },
  ],
}

export const appsSlice = createSlice({
  name: "apps",
  initialState,
  reducers: {},
})

export default appsSlice.reducer

