import { deleteNote } from '../api/notes';

interface NoteProps {
    id: number;
    title: string;
    content: string;
    onDelete: (id: number) => void;
}

const NoteItem = ({ id, title, content, onDelete }: NoteProps) => {
    const handleDelete = async () => {
        await deleteNote(id);
        onDelete(id);
    };

    return (
        <div>
            <h3>{title}</h3>
            <p>{content}</p>
            <button onClick={handleDelete}>Удалить</button>
        </div>
    );
};

export default NoteItem;
