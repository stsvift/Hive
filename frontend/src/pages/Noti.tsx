import styles from '../styles/NotFound.module.css'

const Noti = () => {
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
      <h1 className={styles.errorCode}>In DEV</h1>
      <h2 className={styles.title}>Тут ничего нет</h2>
      <p className={styles.description}>
        Соты на этапе строительства.
      </p>
    </div>
  )
}

export default Noti
