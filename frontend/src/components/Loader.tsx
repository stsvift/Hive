import { useEffect, useState } from 'react'
import styles from '../styles/Loader.module.css'

interface LoaderProps {
  showLogo?: boolean
  text?: string
  alternativeText?: string // Text to show after timeout
}

const Loader = ({ showLogo = true, text, alternativeText }: LoaderProps) => {
  const [showAltText, setShowAltText] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAltText(true)
    }, 4000)

    return () => clearTimeout(timer)
  }, [])

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
        {(text || alternativeText) && (
          <div className={styles.customText}>
            {showAltText && alternativeText ? alternativeText : text}
          </div>
        )}
      </div>
    </div>
  )
}

export default Loader
