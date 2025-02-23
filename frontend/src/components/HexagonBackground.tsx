import { useEffect, useRef } from 'react'
import styles from '../styles/HexagonBackground.module.css'

const HexagonBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const createHexagon = () => {
      const hexagon = document.createElement('div')
      hexagon.className = styles.hexagon

      // Случайное положение
      hexagon.style.left = `${Math.random() * 100}%`
      hexagon.style.top = `${Math.random() * 100}%`

      // Случайный размер
      const size = 30 + Math.random() * 70
      hexagon.style.width = `${size}px`
      hexagon.style.height = `${size}px`

      // Случайная длительность анимации
      hexagon.style.animationDuration = `${15 + Math.random() * 15}s`

      container.appendChild(hexagon)

      // Удаляем шестиугольник после завершения анимации
      setTimeout(() => {
        hexagon.remove()
      }, 30000)
    }

    // Создаем начальные шестиугольники
    for (let i = 0; i < 15; i++) {
      createHexagon()
    }

    // Периодически добавляем новые шестиугольники
    const interval = setInterval(() => {
      createHexagon()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return <div ref={containerRef} className={styles.hexagonBackground} />
}

export default HexagonBackground
