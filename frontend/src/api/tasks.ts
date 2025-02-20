import axios from 'axios';

export const getTasksWithUpcomingDeadlines = async () => {
  const response = await axios.get('/api/tasks/upcoming-deadlines');
  return response.data;
};
