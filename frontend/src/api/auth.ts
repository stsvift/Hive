import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // После успешного входа устанавливаем заголовок авторизации
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Ошибка при входе');
  }
};

export const register = async (username: string, email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { username, email, password });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Ошибка при регистрации');
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};
