import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';
import '../styles/AuthForm.css';

const AuthForm = ({ isLogin = false }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const response = await login(formData.email, formData.password);
        if (response.token) {
          // После успешного входа делаем редирект
          window.location.href = '/';
        }
      } else {
        await register(formData.username, formData.email, formData.password);
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">
          {isLogin ? 'Вход в аккаунт' : 'Регистрация'}
        </h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="auth-button">
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-links">
          {isLogin ? (
            <p>
              Ещё нет аккаунта?{' '}
              <Link to="/register">Зарегистрироваться</Link>
            </p>
          ) : (
            <p>
              Уже есть аккаунт?{' '}
              <Link to="/login">Войти</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
