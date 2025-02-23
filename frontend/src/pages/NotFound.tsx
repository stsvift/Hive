import styles from '../styles/NotFound.module.css'

const NotFound = () => {
  // Создаем случайные шестиугольники для фона
  const hexagons = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
    },
  }))

  return (
    <div className={styles.container}>
      <div className={styles.hexGrid}>
        {hexagons.map(hex => (
          <div key={hex.id} className={styles.hex} style={hex.style} />
        ))}
      </div>
      <h1 className={styles.errorCode}>404</h1>
      <h2 className={styles.title}>Улей потерян</h2>
      <p className={styles.description}>
        Похоже, что страница, которую вы ищете, улетела в другой улей. Давайте
        вернемся к вашим воспоминаниям.
      </p>
      <a href="/dashboard" className={styles.button}>
        Вернуться в улей
      </a>
    </div>
  )
}

export default NotFound
