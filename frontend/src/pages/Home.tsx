import { useEffect, useState } from 'react';
import { getNotes, createNote } from '../api/notes';
import NoteItem from '../components/NoteItem';
import Header from '../components/Header';

const Home = () => {
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const userId = 1; // ID пользователя (пока что захардкожен)

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        const res = await getNotes(userId);
        setNotes(res.data);
    };

    const handleAddNote = async () => {
        await createNote(title, content, userId);
        setTitle('');
        setContent('');
        fetchNotes();
    };

    return (
        <div>
            <Header />
            <main className="container">
                <h2>Заметки</h2>
                <input type="text" placeholder="Заголовок" value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea placeholder="Текст" value={content} onChange={(e) => setContent(e.target.value)} />
                <button onClick={handleAddNote}>Добавить</button>
                {notes.map((note: any) => (
                    <NoteItem key={note.id} {...note} onDelete={fetchNotes} />
                ))}
            </main>
        </div>
    );
};

export default Home;
