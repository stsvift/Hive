import { FC } from 'react';
import styles from '../styles/FolderItem.module.css';
import { IFolder } from '../types';

interface FolderItemProps extends IFolder {
  onEdit?: (folder: IFolder) => void;
  onDelete?: (id: number) => void;
}

const FolderItem: FC<FolderItemProps> = ({ 
  id, 
  name, 
  description, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className={styles.folderCard}>
      <div className={styles.content}>
        <h3 className={styles.title}>{name}</h3>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.actions}>
        {onEdit && (
          <button onClick={() => onEdit({ id, name, description })} className={styles.editButton}>
            Редактировать
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(id)} className={styles.deleteButton}>
            Удалить
          </button>
        )}
      </div>
    </div>
  );
};

export default FolderItem;
