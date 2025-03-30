type EventCallback = (data: any) => void

class EventBus {
  private events: Record<string, EventCallback[]> = {}

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }

  publish(event: string, data: any): void {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data))
    }
  }
}

export const eventBus = new EventBus()

// Event types
export const EVENTS = {
  TASKS_UPDATED: 'tasks_updated',
  CALENDAR_UPDATED: 'calendar_updated',
  NOTE_UPDATED: 'note_updated',
  SETTINGS_CHANGED: 'settings_changed',
}
