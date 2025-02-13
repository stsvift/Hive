import { logout } from '../api/auth';
import '../styles/Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <h1>Hive</h1>
        <button onClick={logout} className="logout-button">
          Выйти
        </button>
      </div>
    </header>
  );
};

export default Header;