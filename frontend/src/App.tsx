import { useEffect } from 'react';
import axios from 'axios';
import AppRouter from './router';

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  return <AppRouter />;
}

export default App;
