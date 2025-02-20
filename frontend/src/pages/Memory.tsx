import { useState, useEffect } from 'react';
import { memoryService } from '../api/memory';
import { CreateModal } from '../components/CreateModal';
import FolderItem from '../components/FolderItem';
import NoteItem from '../components/NoteItem';
import TaskItem from '../components/TaskItem';
import { IFolder, INote, ITask } from '../types';
import styles from '../styles/Memory.module.css';
import { EditModal } from '../components/EditModal';

const Memory = () => {
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [notes, setNotes] = useState<INote[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [modalType, setModalType] = useState<'folder' | 'note' | 'task' | null>(null);
  const [editModalType, setEditModalType] = useState<'folder' | 'note' | 'task' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [foldersData, notesData, tasksData] = await Promise.all([
        memoryService.getFolders(),
        memoryService.getNotes(),
        memoryService.getTasks()
      ]);
      console.log('Loaded tasks:', tasksData); // Add logging
      setFolders(foldersData);
      setNotes(notesData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      if (modalType === 'folder') {
        await memoryService.createFolder(data);
      } else if (modalType === 'note') {
        await memoryService.createNote(data);
      } else if (modalType === 'task') {
        await memoryService.createTask(data);
      }
      await loadData();
      setModalType(null);
    } catch (err) {
      console.error('Error creating item:', err);
      setError('Ошибка при создании');
    }
  };

  const handleEdit = (item: any, type: 'folder' | 'note' | 'task') => {
    setEditingItem(item);
    setEditModalType(type);
  };

  const handleEditSubmit = async (data: any) => {
    try {
      if (editModalType === 'folder') {
        await memoryService.updateFolder(editingItem.id, data);
      } else if (editModalType === 'note') {
        await memoryService.updateNote(editingItem.id, data);
      } else if (editModalType === 'task') {
        await memoryService.updateTask(editingItem.id, data);
      }
      await loadData();
      setEditModalType(null);
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Ошибка при обновлении');
    }
  };

  const handleToggleTask = async (id: number) => {
    try {
      await memoryService.toggleTaskComplete(id);
      await loadData();
    } catch (err) {
      console.error('Error toggling task:', err);
      setError('Ошибка при обновлении задачи');
    }
  };

  const handleDelete = async (type: string, id: number) => {
    try {
      if (type === 'folder') {
        await memoryService.deleteFolder(id);
      } else if (type === 'note') {
        await memoryService.deleteNote(id);
      } else if (type === 'task') {
        await memoryService.deleteTask(id);
      }
      await loadData();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Ошибка при удалении');
    }
  };

  return (
    <div className={styles.memoryContainer}>
      <div className={styles.header}>
        <h1>Memory</h1>
        <div className={styles.actions}>
          <button onClick={() => setModalType('folder')}>Создать папку</button>
          <button onClick={() => setModalType('note')}>Создать заметку</button>
          <button onClick={() => setModalType('task')}>Создать задачу</button>
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.content}>
        <section className={styles.section}>
          <h2>Папки</h2>
          <div className={styles.grid}>
            {folders.map(folder => (
              <FolderItem 
                key={folder.id} 
                {...folder} 
                onEdit={(folder) => handleEdit(folder, 'folder')}
                onDelete={(id) => handleDelete('folder', id)}
              />
            ))}
          </div>
        </section>
        <section className={styles.section}>
          <h2>Заметки</h2>
          <div className={styles.grid}>
            {notes.map(note => (
              <NoteItem key={note.id} {...note} />
            ))}
          </div>
        </section>
        <section className={styles.section}>
          <h2>Задачи</h2>
          <div className={styles.grid}>
            {tasks.map(task => (
              <TaskItem 
                key={task.id} 
                {...task}
                onToggle={handleToggleTask}
                onDelete={() => handleDelete('task', task.id)}
                onEdit={(task) => handleEdit(task, 'task')}
              />
            ))}
          </div>
        </section>
      </div>
      <CreateModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        onSubmit={handleCreate}
        type={modalType || 'folder'}
      />
      <EditModal
        isOpen={editModalType !== null}
        onClose={() => {
          setEditModalType(null);
          setEditingItem(null);
        }}
        onSubmit={handleEditSubmit}
        type={editModalType!}
        initialData={editingItem}
      />
    </div>
  );
};

export default Memory;
