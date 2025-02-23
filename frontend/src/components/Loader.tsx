import styles from '../styles/Loader.module.css'

interface LoaderProps {
  showLogo?: boolean
  text?: string
}

const Loader = ({ showLogo = true, text }: LoaderProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.loaderContainer}>
        <div className={styles.honeycomb}>
          {[...Array(7)].map((_, index) => (
            <div key={index} className={styles.hex}>
              <div className={styles.hexInner}></div>
            </div>
          ))}
        </div>
        {showLogo && (
          <div className={styles.text}>
            {'HIVE'.split('').map((letter, index) => (
              <span key={index} className={styles.letter}>
                {letter}
              </span>
            ))}
          </div>
        )}
        {text && <div className={styles.customText}>{text}</div>}
      </div>
    </div>
  )
}

export default Loader
