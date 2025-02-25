import React, { useState, useRef } from 'react';
import AvatarEditor from 'react-avatar-editor';
import styles from '../styles/AvatarEditModal.module.css';
import Spinner from './Spinner';

interface Props {
  image: File;
  onSave: (blob: Blob) => Promise<void>;
  onCancel: () => void;
}

const AvatarEditModal: React.FC<Props> = ({ image, onSave, onCancel }) => {
  const [scale, setScale] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<AvatarEditor>(null);

  const handleSave = async () => {
    if (editorRef.current) {
      setIsSaving(true);
      const canvas = editorRef.current.getImage();
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await onSave(blob);
          } catch (error) {
            console.error('Error saving avatar:', error);
          } finally {
            setIsSaving(false);
          }
        }
      });
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Редактировать фото</h3>
        <div className={styles.editorContainer}>
          <AvatarEditor
            ref={editorRef}
            image={image}
            width={250}
            height={250}
            border={50}
            borderRadius={125}
            color={[0, 0, 0, 0.6]}
            scale={scale}
            rotate={0}
          />
        </div>
        <div className={styles.controls}>
          <input
            type="range"
            min="1"
            max="2"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
          />
        </div>
        <div className={styles.buttons}>
          <button 
            onClick={handleSave} 
            className={styles.saveButton}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                Сохранение
                <Spinner />
              </>
            ) : (
              'Сохранить'
            )}
          </button>
          <button 
            onClick={onCancel} 
            className={styles.cancelButton}
            disabled={isSaving}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarEditModal;