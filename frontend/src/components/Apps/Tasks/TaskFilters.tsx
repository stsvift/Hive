import { TaskFilters as ApiTaskFilters } from '../../../api/tasksApi'

interface TaskFiltersProps {
  filters: ApiTaskFilters
  onFilterChange: (filters: ApiTaskFilters) => void
}

export const TaskFilters: React.FC<TaskFiltersProps> = () => {
  // Empty component - no search functionality
  return null
}
