import { FC } from 'react';
import styles from '../styles/Widget.module.css';
import { MemoryWidgetProps } from '../types';

const MemoryWidget: FC<MemoryWidgetProps> = ({ 
  type, 
  title, 
  children, 
  onEdit, 
  onDelete, 
  deadline 
}) => {
  return (
    <div className={`${styles.widget} ${styles[type]}`}>
      <div className={styles.widgetHeader}>
        <h3>{title}</h3>
        <div className={styles.controls}>
          {onEdit && (
            <button onClick={onEdit} className={styles.editButton}>
              Изменить
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className={styles.deleteButton}>
              Удалить
            </button>
          )}
        </div>
      </div>
      {deadline && (
        <div className={styles.deadline}>
          {deadline}
        </div>
      )}
      <div className={styles.widgetContent}>
        {children}
      </div>
    </div>
  );
};

export default MemoryWidget;