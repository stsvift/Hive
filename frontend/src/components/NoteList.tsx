import NoteItem from './NoteItem';

interface Note {
    id: number;
    title: string;
    content: string;
}

interface Props {
    notes: Note[];
    onDelete: (id: number) => void;
}

const NoteList = ({ notes, onDelete }: Props) => {
    return (
        <div>
            {notes.length > 0 ? (
                notes.map((note) => <NoteItem key={note.id} {...note} onDelete={onDelete} />)
            ) : (
                <p>Нет заметок</p>
            )}
        </div>
    );
};

export default NoteList;
