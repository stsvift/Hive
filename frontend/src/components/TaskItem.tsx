import { FC } from 'react';
import { ITask } from '../types';
import styles from '../styles/TaskItem.module.css';

interface TaskItemProps extends ITask {
  onEdit?: (task: ITask) => void;
  onDelete?: (id: number) => void;
  onToggle?: (id: number) => void;
}

const TaskItem: FC<TaskItemProps> = ({ 
  id, 
  title, 
  description, 
  deadline, 
  isCompleted,
  onToggle,
  onEdit,
  onDelete 
}) => {
  return (
    <div className={`${styles.taskCard} ${isCompleted ? styles.completed : ''}`}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => onToggle?.(id)}
            className={styles.checkbox}
          />
        </div>
        <p className={styles.description}>{description}</p>
        {deadline && (
          <span className={styles.deadline}>
            До: {new Date(deadline).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className={styles.actions}>
        <button onClick={() => onEdit?.({ id, title, description, deadline, isCompleted })} 
          className={styles.editButton}>
          Редактировать
        </button>
        <button onClick={() => onDelete?.(id)} 
          className={styles.deleteButton}>
          Удалить
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
