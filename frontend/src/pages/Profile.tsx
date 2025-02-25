import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardService } from '../api/dashboard'
import { memoryService } from '../api/memory'
import HexagonBackground from '../components/HexagonBackground'
import Loader from '../components/Loader'
import { useNavigation } from '../context/NavigationContext'
import styles from '../styles/Profile.module.css'
import { INote, ITask, UserResponse } from '../types'
import AvatarEditModal from '../components/AvatarEditModal';

const Profile = () => {
  const navigate = useNavigate()
  const { setNavVisible } = useNavigation()
  const [userData, setUserData] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalNotes: 0,
    totalFolders: 0,
  })
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [loadingText, setLoadingText] = useState<string>('')
  const [lastActivity, setLastActivity] = useState<
    Array<{ type: string; date: string; title: string }>
  >([])
  const [avatarUrl, setAvatarUrl] = useState<string>('/default-avatar.png')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingImage, setEditingImage] = useState<File | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true)
      setLoadingText('Ищем вас среди сот ^_^')
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/register')
          return
        }

        // Используем существующую функцию из dashboardService
        const username = await dashboardService.getUsername(token)
        setUserData({ name: username })

        // Загрузка статистики
        const [tasks, notes, folders] = await Promise.all([
          memoryService.getTasks(),
          memoryService.getNotes(),
          memoryService.getFolders(),
        ])

        setStats({
          totalTasks: tasks.length,
          completedTasks: tasks.filter((task: ITask) => task.isCompleted)
            .length,
          totalNotes: notes.length,
          totalFolders: folders.length,
        })

        // Формирование последней активности
        const activities = [
          ...tasks.map((task: ITask) => ({
            type: 'task',
            date: task.createdAt,
            title: task.title,
          })),
          ...notes.map((note: INote) => ({
            type: 'note',
            date: note.createdAt,
            title: note.title,
          })),
        ]
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 5)

        setLastActivity(activities)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [navigate])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAvatarUrl(data.avatarUrl || '/default-avatar.png');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditingImage(file);
    }
  };

  const handleSaveAvatar = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'avatar.jpg');

    try {
      const response = await fetch('http://localhost:5000/api/users/avatar', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(`${data.avatarUrl}?t=${Date.now()}`);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
    
    setEditingImage(null);
  };

  if (isLoading) return <Loader text={loadingText} />

  return (
    <>
      <HexagonBackground />
      <div className={styles.profileContainer}>
        <div className={styles.header}>
          <h1>Профиль</h1>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.avatar} onClick={handleAvatarClick}>
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/default-avatar.png';
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className={styles.uploadInput}
            />
          </div>
          <h2>{userData?.name || 'Пользователь'}</h2>
        </div>

        <div className={styles.actions}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Выйти
          </button>
        </div>

        <div className={styles.statsContainer}>
          <div className={styles.statsCard}>
            <h3>Статистика</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{stats.totalTasks}</span>
                <span className={styles.statLabel}>Всего задач</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{stats.completedTasks}</span>
                <span className={styles.statLabel}>Выполнено</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{stats.totalNotes}</span>
                <span className={styles.statLabel}>Заметок</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{stats.totalFolders}</span>
                <span className={styles.statLabel}>Папок</span>
              </div>
            </div>
          </div>

          <div className={styles.preferencesCard}>
            <h3>Настройки</h3>
            <div className={styles.themeToggle}>
              {/* <span>Тема: {theme === 'light' ? 'Светлая' : 'Темная'}</span>
              <button onClick={toggleTheme}>
                {theme === 'light' ? '🌙' : '☀️'}
              </button> */}
              <span>In DEV</span>
            </div>
          </div>

          <div className={styles.activityCard}>
            <h3>Последняя активность</h3>
            <div className={styles.activityList}>
              {lastActivity.map((activity, index) => (
                <div key={index} className={styles.activityItem}>
                  <span className={styles.activityIcon}>
                    {activity.type === 'task' ? '📋' : '📝'}
                  </span>
                  <span className={styles.activityTitle}>{activity.title}</span>
                  <span className={styles.activityDate}>
                    {new Date(activity.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {editingImage && (
          <AvatarEditModal
            image={editingImage}
            onSave={handleSaveAvatar}
            onCancel={() => setEditingImage(null)}
          />
        )}
      </div>
    </>
  )
}

export default Profile
