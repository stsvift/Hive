import { FC } from 'react';
import { INote } from '../types';
import styles from '../styles/NoteItem.module.css';

interface NoteItemProps extends INote {
  onEdit?: (note: INote) => void;
  onDelete?: (id: number) => void;
}

const NoteItem: FC<NoteItemProps> = ({ 
  id, 
  title, 
  content, 
  createdAt, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className={styles.noteCard}>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.text}>{content}</p>
        <span className={styles.date}>
          {new Date(createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className={styles.actions}>
        {onEdit && (
          <button onClick={() => onEdit({ id, title, content, createdAt })} 
            className={styles.editButton}>
            Редактировать
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(id)} 
            className={styles.deleteButton}>
            Удалить
          </button>
        )}
      </div>
    </div>
  );
};

export default NoteItem;
