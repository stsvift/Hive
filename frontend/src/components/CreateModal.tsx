import { useState } from 'react';
import styles from '../styles/Modal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  type: 'folder' | 'note' | 'task';
}

export const CreateModal = ({ isOpen, onClose, onSubmit, type }: Props) => {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    content: '',
    deadline: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...(type === 'folder' && {
        name: formData.name,
        description: formData.description
      }),
      ...(type === 'note' && {
        title: formData.title,
        content: formData.content 
      }),
      ...(type === 'task' && {
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline
      })
    };
  
    onSubmit(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>Создать {type === 'folder' ? 'папку' : type === 'note' ? 'заметку' : 'задачу'}</h2>
        <form onSubmit={handleSubmit}>
          {type === 'folder' && (
            <>
              <input
                type="text"
                placeholder="Название папки"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <textarea
                placeholder="Описание"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </>
          )}
          {type === 'note' && (
            <>
              <input
                type="text"
                placeholder="Заголовок"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
              <textarea
                placeholder="Содержание"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
              />
            </>
          )}
          {type === 'task' && (
            <>
              <input
                type="text"
                placeholder="Название задачи"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
              <textarea
                placeholder="Описание"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </>
          )}
          <div className={styles.buttons}>
            <button type="submit">Создать</button>
            <button type="button" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
};