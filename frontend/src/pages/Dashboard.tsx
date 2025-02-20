import { useEffect, useState } from 'react';
import { getTasksWithUpcomingDeadlines } from '../api/tasks';
import TaskItem from '../components/TaskItem';
import styles from '../styles/Dashboard.module.css';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await getTasksWithUpcomingDeadlines();
      setTasks(response);
    };

    fetchTasks();
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.taskList}>
        {tasks.map(task => (
          <TaskItem key={task.id} {...task} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
