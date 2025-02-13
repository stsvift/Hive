import axios from 'axios';

const API_URL = 'http://localhost:5000/api/notes';

export const getNotes = async (userId: number) => {
    return axios.get(`${API_URL}/${userId}`);
};

export const createNote = async (title: string, content: string, userId: number) => {
    return axios.post(API_URL, { title, content, userId });
};

export const deleteNote = async (noteId: number) => {
    return axios.delete(`${API_URL}/${noteId}`);
};
    